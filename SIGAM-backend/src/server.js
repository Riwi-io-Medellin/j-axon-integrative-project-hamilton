import 'dotenv/config';

import app from './app.js';
import EnvConfig from './config/env.js';
import db from './config/db.js';

const PORT = process.env.PORT || 4000;

async function start() {
    try {
        EnvConfig.validate();
        await db.testConnection();
        console.log('Backend conectado a la base de datos');

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('No fue posible iniciar el servidor:', error);
        process.exit(1);
    }
}

start();
