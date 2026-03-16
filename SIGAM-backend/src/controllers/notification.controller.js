// Notifications controller: list queued/sent notifications.
class NotificationController {
    constructor(service) {
        this.service = service;
        this.getAll = this.getAll.bind(this);
    }

    async getAll(req, res, next) {
        try {
            const estado = req.query?.estado;
            res.json(await this.service.findAll({ estado }));
        } catch (e) {
            next(e);
        }
    }
}

export default NotificationController;
