import BaseModel from './BaseModel.js';


class ProveedorModel extends BaseModel {
    async findAll() {
        return this.dbFindAll('proveedores', 'id_proveedor');
    }

    async findById(id) {
        return this.dbFindById('proveedores', 'id_proveedor', id);
    }

    async create({ nombre, contacto, identificacion_legal }) {
        return this.dbCreate('proveedores', { nombre, contacto, identificacion_legal });
    }

    async update(id, { nombre, contacto }) {
        return this.dbUpdate('proveedores', 'id_proveedor', id, { nombre, contacto });
    }

    async remove(id) {
        return this.dbRemove('proveedores', 'id_proveedor', id);
    }
}

export default ProveedorModel;
