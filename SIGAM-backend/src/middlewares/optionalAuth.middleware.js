import jwt from 'jsonwebtoken';

// Optional auth: attach req.user if token is valid, but never block the request.
const optionalAuth = (req, _res, next) => {
    const authHeader = req.headers?.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return next();

    try {
        // Best-effort decode for public endpoints.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch {
        // Invalid token is ignored for optional endpoints.
    }
    next();
};

export default optionalAuth;
