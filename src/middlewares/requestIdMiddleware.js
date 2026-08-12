const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to assign or propagate X-Request-Id for tracing and auditing.
 */
const requestIdMiddleware = (req, res, next) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
};

module.exports = requestIdMiddleware;
