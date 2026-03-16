// Middleware factory to allow only specified roles.
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        // Block if the user is missing or role is not allowed.
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Acceso denegado: No tienes el rol necesario' });
        }

        // Continue if authorized.
        next();
    };
};

export default checkRole;
