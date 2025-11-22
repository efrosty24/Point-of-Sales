require('dotenv').config();
const mysql = require('mysql2');



const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;
const CLOUD_SQL_CONNECTION_NAME = process.env.CLOUD_SQL_CONNECTION_NAME;

const isAppEngine = !!CLOUD_SQL_CONNECTION_NAME;

let connectionOptions = {
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, 
};

if (isAppEngine) {
    const DB_SOCKET_PATH = `/cloudsql/${CLOUD_SQL_CONNECTION_NAME}`;

    connectionOptions.socketPath = DB_SOCKET_PATH;
    
} else {
    connectionOptions.host = process.env.DB_HOST;
    connectionOptions.port = process.env.DB_PORT || 3306;
    connectionOptions.user = process.env.DB_USER;
    connectionOptions.password = process.env.DB_PASSWORD;
}

const pool = mysql.createPool(connectionOptions);

pool.getConnection((err, connection) => {
    if (err) {
        console.error('================================================================');
        console.error('CRITICAL ERROR: FAILED TO CONNECT TO MYSQL DATABASE');
        console.error(`Attempted Connection Target: ${isAppEngine ? 'GCP Cloud SQL (Socket)' : 'Local/Remote TCP/IP'}`);
        if (isAppEngine) {
            console.error(`Socket Path: ${connectionOptions.socketPath}`);
            console.error("1. CHECK CLOUD_SQL_CONNECTION_NAME in app.yaml (Project:Region:Instance)");
            console.error("2. CHECK IAM permissions for App Engine Service Account (Cloud SQL Client role)");
        }
        console.error(`Error: ${err.message}`);
        console.error('================================================================');
        return;
    }
    console.log(`Database Connected! Thread ID: ${connection.threadId}`);
    connection.release(); 
});

module.exports = pool;
