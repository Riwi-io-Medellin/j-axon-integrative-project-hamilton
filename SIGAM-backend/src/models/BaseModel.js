import database from '../data/DatabaseAdapter.js';

class BaseModel {
    constructor() {
        this.db = database;
    }

    get useSupabase() {
        return this.db.isSupabase;
    }

    get supabase() {
        return this.db.supabase;
    }

    query(text, params = []) {
        return this.db.query(text, params);
    }

    transaction(callback) {
        return this.db.transaction(callback);
    }

    dbFindAll(table, orderBy, orderDir = 'ASC', columns = '*') {
        return this.db.findAll(table, orderBy, orderDir, columns);
    }

    dbFindById(table, idColumn, id, columns = '*') {
        return this.db.findById(table, idColumn, id, columns);
    }

    dbCreate(table, data, returning = '*') {
        return this.db.create(table, data, returning);
    }

    dbUpdate(table, idColumn, id, data, returning = '*') {
        return this.db.update(table, idColumn, id, data, returning);
    }

    dbRemove(table, idColumn, id, returning = '*') {
        return this.db.remove(table, idColumn, id, returning);
    }
}

export default BaseModel;
