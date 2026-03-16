// Middleware factory to validate required body fields.
const validateRequired = (requiredFields = []) => {
    return (req, res, next) => {
        // Identify missing fields (null/undefined/empty string).
        const missing = requiredFields.filter((field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');
        if (missing.length) {
            return res.status(400).json({ message: `Campos requeridos: ${missing.join(', ')}` });
        }
        // Continue when all required fields are present.
        next();
    };
};

export {
    validateRequired
};
