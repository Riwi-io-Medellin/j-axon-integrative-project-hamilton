import BaseModel from './BaseModel.js';


class CategoriaModel extends BaseModel {
    async findAll() {
        return this.dbFindAll('categorias', 'id_categoria');
    }
}

export default CategoriaModel;

