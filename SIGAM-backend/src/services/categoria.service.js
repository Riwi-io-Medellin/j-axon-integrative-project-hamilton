class CategoriaService {
    constructor(model) {
        this.model = model;
    }

    findAll() {
        return this.model.findAll();
    }
}

export default CategoriaService;
