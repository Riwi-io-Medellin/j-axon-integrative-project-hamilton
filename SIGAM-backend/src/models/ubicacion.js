import BaseModel from './BaseModel.js';


class UbicacionModel extends BaseModel {
    async findAll() {
        return this.dbFindAll('ubicaciones', 'id_ubicacion');
    }

    async findById(id) {
        return this.dbFindById('ubicaciones', 'id_ubicacion', id);
    }

    async create({ sede, piso, sala }) {
        return this.dbCreate('ubicaciones', { sede, piso, sala });
    }

    async update(id, { sede, piso, sala }) {
        return this.dbUpdate('ubicaciones', 'id_ubicacion', id, { sede, piso, sala });
    }

    async remove(id) {
        return this.dbRemove('ubicaciones', 'id_ubicacion', id);
    }
}

export default UbicacionModel;
