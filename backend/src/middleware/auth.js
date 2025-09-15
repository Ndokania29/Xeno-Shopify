const jwt = require('jsonwebtoken');
const { Tenant } = require('../models');
const { sendEmail } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Get tenant from token
    const tenant = await Tenant.findByPk(decoded.tenantId);
    if (!tenant) {
      return res.status(401).json({ error: 'Tenant not found' });
    }

    if (!tenant.isActive) {
      return res.status(403).json({ error: 'Tenant account is deactivated' });
    }

    // Attach tenant to request
    req.tenant = tenant;
    req.tenantId = tenant.id;
    req.userId = decoded.userId || tenant.id;

    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
};

// Optional authentication middleware (doesn't throw error if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = verifyToken(token);
      const tenant = await Tenant.findByPk(decoded.tenantId);
      
      if (tenant && tenant.isActive) {
        req.tenant = tenant;
        req.tenantId = tenant.id;
        req.userId = decoded.userId || tenant.id;
      }
    } catch (error) {
      // Ignore token errors in optional auth
      console.log('Optional auth error:', error.message);
    }

    next();
  } catch (error) {
    next(error);
  }
};


// Login function for tenants
const login = async (email, password) => {
  try {
    const tenant = await Tenant.findOne({ where: { email } });
    if (!tenant) {
      throw new Error('Invalid credentials');
    }

    if (!tenant.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await tenant.validatePassword(password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = generateToken({
      tenantId: tenant.id,
      email: tenant.email,
      shopDomain: tenant.shopifyDomain,
      userId: tenant.id
    });

    return {
      token,
      tenant: tenant.toJSON(),
      expiresIn: JWT_EXPIRES_IN
    };
  } catch (error) {
    throw error;
  }
};

// Register function for new tenants
const register = async (tenantData) => {
  try {
    // Check if tenant already exists
    const existingTenant = await Tenant.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email: tenantData.email },
          { shopifyDomain: tenantData.shopifyDomain }
        ]
      }
    });

    if (existingTenant) {
      throw new Error('Tenant with this email or shop domain already exists');
    }

    // Create new tenant
    const tenant = await Tenant.create(tenantData);

    // Generate token
    const token = generateToken({
      tenantId: tenant.id,
      email: tenant.email,
      shopDomain: tenant.shopifyDomain,
      userId: tenant.id
    });

    return {
      token,
      tenant: tenant.toJSON(),
      expiresIn: JWT_EXPIRES_IN
    };
  } catch (error) {
    throw error;
  }
};

// Refresh token
const refreshToken = async (currentToken) => {
  try {
    const decoded = verifyToken(currentToken);
    const tenant = await Tenant.findByPk(decoded.tenantId);
    
    if (!tenant || !tenant.isActive) {
      throw new Error('Invalid token');
    }

    // Generate new token
    const newToken = generateToken({
      tenantId: tenant.id,
      email: tenant.email,
      shopDomain: tenant.shopifyDomain,
      userId: tenant.id
    });

    return {
      token: newToken,
      expiresIn: JWT_EXPIRES_IN
    };
  } catch (error) {
    throw error;
  }
};

const resendVerificationEmail = async (email) => {
  try {
    const tenant = await Tenant.findOne({ where: { email } });
    if (!tenant) {
      throw new Error('No account found with this email');
    }

    if (tenant.isVerified) {
      throw new Error('Account is already verified');
    }

    const verifyToken = generateToken(
      { tenantId: tenant.id, email: tenant.email },
      '1h'
    );

    const verifyUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${verifyToken}`;

    await sendEmail(
      tenant.email,
      'Resend Verification - Verify your account',
      `<p>Hello ${tenant.name},</p>
       <p>Please verify your account by clicking below:</p>
       <a href="${verifyUrl}">Verify Email</a>`
    );

    return {
      message: 'Verification email resent. Please check your inbox.'
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  resendVerificationEmail,
  optionalAuth,
  login,
  register,
  refreshToken
};
