require('dotenv').config();
const mysql = require('mysql2');


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, // use whatever you personal password is to mySQL on your machine
    database: process.env.DB_NAME
})

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL: ', err.stack);
        console.error(`Attempted to connect to ${process.env.DB_USER}@${process.env.DB_HOST}/${process.env.DB_NAME}`);
    }
    console.log('Connected to MySQL as id' + db.threadId);
});

module.exports = db;