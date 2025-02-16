const db = require('../config/db.js');
const bcrypt = require('bcrypt');

const UserModel = {
    async findUserByEmail(email){
        const query = 'SELECT * FROM user WHERE email = ?';
        const values = [email];
        const [rows,fields] = await db.promise().query(query, values);
        return rows[0] ? rows[0] : undefined;
    },

    async createUser(userData){
        const { firstName, lastName, email, password, birthday } = userData; // unpacking passed userData
        const query = `INSERT INTO user (firstName, lastName, email, password, birthday) VALUES (?,?,?,?,?);`;
        const values = [firstName, lastName, email, password, birthday];
        const [rows,fields] = await db.promise().query(query, values);
        return rows[0] ? rows[0] : undefined;
    },

    // this function assumes we have already validated that email is registered
    // returns true or false
    async validatePassword(email, password){
        const values = [email];
        const query = `SELECT password FROM user WHERE email = ?;`;
        const [rows,fields] = await db.promise().query(query, values);
        const isMatch = await bcrypt.compare(password, rows[0].password);
        return rows[0] ? isMatch : undefined; 
    },

    // get userId from email
    async getUserIdFromEmail(email){
        const values = [email];
        const query = `SELECT userId FROM user WHERE email = ?;`;
        const [rows,fields] = await db.promise().query(query, values);
        return rows[0] ? rows[0].userId : undefined; 
    },
}

module.exports = UserModel;
