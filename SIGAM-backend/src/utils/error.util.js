function getErrorMessage(error) {
    if (!error) {
        return 'Error desconocido';
    }

    if (typeof error === 'string' && error.trim()) {
        return error;
    }

    if (error.message && String(error.message).trim()) {
        return String(error.message).trim();
    }

    if (Array.isArray(error.errors) && error.errors.length) {
        const nested = error.errors.find((item) => item?.message && String(item.message).trim());
        if (nested?.message) {
            return String(nested.message).trim();
        }
    }

    if (error.code) {
        return `Error con codigo ${error.code}`;
    }

    return 'Error interno sin detalle';
}

function getErrorCode(error) {
    if (!error) {
        return 'UNKNOWN_ERROR';
    }

    if (error.code) {
        return error.code;
    }

    if (Array.isArray(error.errors) && error.errors.length) {
        const nested = error.errors.find((item) => item?.code);
        if (nested?.code) {
            return nested.code;
        }
    }

    return 'UNKNOWN_ERROR';
}

export {
    getErrorCode,
    getErrorMessage
};
