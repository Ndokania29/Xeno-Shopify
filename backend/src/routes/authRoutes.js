const express = require('express');
const { 
  loginUser, 
  registerUser, 
  refreshUserToken, 
  logoutUser, 
  verifyEmail,
  resendEmail
} = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/login
router.post('/login', loginUser);

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/refresh
router.post('/refresh', refreshUserToken);

// POST /api/auth/logout
router.post('/logout', logoutUser);
// GET /api/auth/verify-email
router.get('/verify-email', verifyEmail);
// POST /api/auth/resend-verification
router.post('/resend-verification', resendEmail);

module.exports = router;
