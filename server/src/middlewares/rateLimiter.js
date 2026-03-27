import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import httpStatus from 'http-status';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    if (req.auth && req.auth.userId) {
      return req.auth.userId;
    }

    const cfConnectingIp = req.headers['cf-connecting-ip'];
    if (cfConnectingIp) {
      return ipKeyGenerator(cfConnectingIp);
    }

    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
      return ipKeyGenerator(xForwardedFor.split(',')[0].trim());
    }

    return ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown');
  },
  handler: (req, res, next, options) => {
    res.status(httpStatus.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Too many requests, please try again later.'
    });
  },
});
