const { login, register,resendVerificationEmail, verifyToken, refreshToken } = require('../middleware/auth');
const { Tenant } = require('../models');
const { logEvent } = require('../utils/logger');

// Verify Email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    const decoded = verifyToken(token);
    const tenant = await Tenant.findByPk(decoded.tenantId);

    if (!tenant) {
      return res.status(400).json({ success: false, error: 'Invalid token' });
    }

    tenant.isVerified = true;
    await tenant.save();


    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};


// Resend Verification Email
const resendEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const result = await resendVerificationEmail(email);
    res.json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};


// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await login(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, shopifyDomain, shopifyAccessToken } = req.body;
    
    // Basic validation
    if (!name || !email || !password || !shopifyDomain) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, password, and shopifyDomain are required'
      });
    }

    const tenantData = {
      name,
      email,
      password,
      shopifyDomain,
      shopifyAccessToken: shopifyAccessToken || null
    };

    const result = await register(tenantData);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/auth/refresh
const refreshUserToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    const result = await refreshToken(token);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/auth/logout
const logoutUser = async (req, res) => {
  try {
    // In a JWT-based system, logout is typically handled client-side
    // by removing the token from storage. However, we can log the event.
    
    logEvent('user_logout', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

module.exports = {
  loginUser,
  registerUser,
  refreshUserToken,
    verifyEmail,
  resendEmail,
  logoutUser
};
