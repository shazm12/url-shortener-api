import rateLimit from'express-rate-limit';

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minute window
    max: 100, // Limit each IP to 100 requests per window
    message: {
        status: 429,
        message: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});


export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // 5 attempts per hour
    message: {
        status: 429,
        message: 'Too many login attempts, please try again later.',
    },
});