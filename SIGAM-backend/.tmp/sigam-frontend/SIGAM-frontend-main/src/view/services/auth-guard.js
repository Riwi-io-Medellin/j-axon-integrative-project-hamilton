// Simple route guard based on token presence and allowed roles.
// Pages define window.SIGAM_PAGE_ROLES to restrict access by role.
(() => {
    const api = window.SIGAM_API;
    const token = api && api.getToken ? api.getToken() : null;
    const user = api && api.getUser ? api.getUser() : null;

    if (!token) {
        window.location.href = "/login";
        return;
    }

    const allowedRoles = Array.isArray(window.SIGAM_PAGE_ROLES)
        ? window.SIGAM_PAGE_ROLES
        : null;

    if (allowedRoles && allowedRoles.length > 0) {
        const role = (user && (user.role || user.rol || user.ROLE || user.Rol)) || "";
        const normalizedRole = String(role).toLowerCase();
        const isAllowed = allowedRoles.some((item) => String(item).toLowerCase() === normalizedRole);
        if (!isAllowed) {
            window.location.href = "/login";
        }
    }
})();
