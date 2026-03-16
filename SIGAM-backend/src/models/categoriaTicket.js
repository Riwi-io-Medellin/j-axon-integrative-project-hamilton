import BaseModel from './BaseModel.js';

class CategoriaTicketModel extends BaseModel {
    findAll() {
        return this.dbFindAll('categorias_ticket', 'nombre', 'ASC');
    }

    findById(id) {
        return this.dbFindById('categorias_ticket', 'id_categoria_ticket', id);
    }

    findByNombre(nombre) {
        return this.dbFindById('categorias_ticket', 'nombre', nombre);
    }

    create({ nombre, descripcion, activo = true }) {
        return this.dbCreate('categorias_ticket', { nombre, descripcion, activo });
    }

    update(id, { nombre, descripcion, activo }) {
        return this.dbUpdate('categorias_ticket', 'id_categoria_ticket', id, { nombre, descripcion, activo });
    }

    remove(id) {
        return this.dbRemove('categorias_ticket', 'id_categoria_ticket', id);
    }
}

export default CategoriaTicketModel;
