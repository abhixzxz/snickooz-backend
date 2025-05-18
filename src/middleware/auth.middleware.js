import crypto from 'crypto';
import User from '../models/user.model.js';
import { config } from '../config/index.js';

// Generate Token
export const generateToken = (userId) => {
  const payload = JSON.stringify({ 
    id: userId, 
    exp: config.jwt.expiresIn ? Date.now() + config.jwt.expiresIn * 1000 : null 
  });
  const hmac = crypto.createHmac('sha256', config.jwt.secret);
  const signature = hmac.update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
};

// Verify JWT Token
export const verifyToken = async (req, res, next) => {
  let token;
  let payloadBase64;
  let signatureBase64;
  let payload;

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided or invalid token format'
      });
    }

    token = authHeader.split(' ')[1];
    
    const decodedToken = Buffer.from(token, 'base64').toString();
    const lastColonIndex = decodedToken.lastIndexOf(':');
    if (lastColonIndex === -1) {
      throw { name: 'JsonWebTokenError', message: 'Invalid token format' };
    }
    payloadBase64 = decodedToken.substring(0, lastColonIndex);
    signatureBase64 = decodedToken.substring(lastColonIndex + 1);
    payload = JSON.parse(payloadBase64);
    
    // Check token expiration
    if (payload.exp !== null && payload.exp <= Date.now()) {
      throw { name: 'TokenExpiredError' };
    }
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', config.jwt.secret);
    const expectedSignature = hmac.update(payloadBase64).digest('hex');
    
    if (signatureBase64 !== expectedSignature) {
      throw { name: 'JsonWebTokenError' };
    }
    
    const decoded = payload;
    
    const user = await User.findById(decoded.id)
      .select('-password -refreshToken')
      .lean();
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found or token is invalid'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token has expired'
      });
    }
    console.error('Auth middleware error:', {
      name: error.name,
      message: error.message,
      token: token,
      payload: payloadBase64 || null
    });
    return res.status(500).json({
      status: 'error',
      message: 'Token validation failed: ' + (error.message || error.name || 'Unknown error')
    });
  }
};



// Optional auth middleware
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    const [payloadBase64, signatureBase64] = Buffer.from(token, 'base64').toString().split(':');
    const payload = JSON.parse(payloadBase64);
    
    // Check token expiration
    if (payload.exp !== null && payload.exp <= Date.now()) {
      throw { name: 'TokenExpiredError' };
    }
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', config.jwt.secret);
    const expectedSignature = hmac.update(payloadBase64).digest('hex');
    
    if (signatureBase64 !== expectedSignature) {
      throw { name: 'JsonWebTokenError' };
    }
    
    const decoded = payload;
    const user = await User.findById(decoded.id)
      .select('-password -refreshToken')
      .lean();
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    next();
  }
};