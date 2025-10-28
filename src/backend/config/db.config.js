require('dotenv').config();
const mysql = require('mysql2');

// ====================================================================
// Configuration Variables from App Engine / .env
// ====================================================================

const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_NAME = process.env.DB_NAME;
const CLOUD_SQL_CONNECTION_NAME = process.env.CLOUD_SQL_CONNECTION_NAME;

const isAppEngine = !!CLOUD_SQL_CONNECTION_NAME;

let connectionOptions = {
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    
    // Recommended: Use a Connection Pool for scalability, not a single connection
    waitForConnections: true,
    connectionLimit: 10, 
};

if (isAppEngine) {
    // 1. App Engine Deployment (Secure Unix Socket Path)
    // The format MUST be: /cloudsql/PROJECT:REGION:INSTANCE_NAME
    const DB_SOCKET_PATH = `/cloudsql/${CLOUD_SQL_CONNECTION_NAME}`;
    
    // Add the socket path to the options object
    connectionOptions.socketPath = DB_SOCKET_PATH;
    
} else {
    // 2. Local Development/Testing (Standard TCP/IP)
    // Assumes your local host/DB host is defined in .env
    connectionOptions.host = process.env.DB_HOST || '127.0.0.1'; 
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
    
    // If connected successfully
    console.log(`Database Connected! Thread ID: ${connection.threadId}`);
    connection.release(); 
});

module.exports = pool.promise();
