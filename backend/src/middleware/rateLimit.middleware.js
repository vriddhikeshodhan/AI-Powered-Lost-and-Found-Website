const rateLimit = require("express-rate-limit");
const handler = (req, res) => {
    res.status(429).json({
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil(res.getHeader("Retry-After") || 60),
    });
};

const loginLimiter = rateLimit({
    windowMs:         15 * 60 * 1000,   
    max:              5,
    standardHeaders:  true,              
    legacyHeaders:    false,
    handler,
    message:          "Too many login attempts. Please wait 15 minutes and try again.",
    skipSuccessfulRequests: true,      
});
const registerLimiter = rateLimit({
    windowMs:         60 * 60 * 1000,   // 1 hour
    max:              10,
    standardHeaders:  true,
    legacyHeaders:    false,
    handler,
});

const forgotPasswordLimiter = rateLimit({
    windowMs:         60 * 60 * 1000,   // 1 hour
    max:              5,
    standardHeaders:  true,
    legacyHeaders:    false,
    handler,
});

const itemSubmissionLimiter = rateLimit({
    windowMs:         60 * 60 * 1000,   // 1 hour
    max:              20,
    standardHeaders:  true,
    legacyHeaders:    false,
    handler,
});

module.exports = {
    loginLimiter,
    registerLimiter,
    forgotPasswordLimiter,
    itemSubmissionLimiter,
};