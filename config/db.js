require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if(err){
        console.error('db connection error:', err, '\n');
        return;
    }
    console.log(`connected to ${process.env.DB_NAME} successfully`);
});

module.exports = db;