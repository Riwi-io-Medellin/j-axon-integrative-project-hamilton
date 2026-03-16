class CategoriaController {
    constructor(service) {
        this.service = service;
        this.getAll = this.getAll.bind(this);
    }

    async getAll(req, res, next) {
        try {
            const categorias = await this.service.findAll();
            res.json(categorias);
        } catch (error) {
            next(error);
        }
    }
}

export default CategoriaController;
