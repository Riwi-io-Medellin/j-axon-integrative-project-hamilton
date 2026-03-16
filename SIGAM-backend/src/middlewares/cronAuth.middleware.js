export default function cronAuth(req, res, next) {
    const expected = process.env.CRON_SECRET;
    if (!expected) {
        res.status(500).json({ message: 'CRON_SECRET no configurado' });
        return;
    }
    const provided = req.header('x-cron-secret') || req.header('x-cron-key');
    if (!provided || provided !== expected) {
        res.status(401).json({ message: 'Cron no autorizado' });
        return;
    }
    next();
}
