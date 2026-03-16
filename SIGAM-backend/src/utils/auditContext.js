// Build a minimal audit context payload from the request.
const buildAuditContext = (req) => ({
    request_id: req?.context?.request_id ?? null,
    ip: req?.context?.ip ?? null,
    user_agent: req?.context?.user_agent ?? null,
    ruta: req?.originalUrl ?? req?.url ?? null,
    metodo: req?.method ?? null
});

export default buildAuditContext;
