const db = require('../config/db.js')

const UserModel = {
    async findUserByEmail(email){
        const query = 'SELECT * FROM users WHERE email = ?';
        const values = [email];
        const [rows,fields] = await db.promise().query(query, values);
        return rows[0] ? rows[0] : undefined;
    },

    async createUser(userData){
        const { firstName, lastName, email, password, birthday } = userData;
        const query = `INSERT INTO users (firstName, lastName, email, password, birthday) VALUES (?,?,?,?,?);`;
        const values = [firstName, lastName, email, password, birthday];
        const [rows,fields] = await db.promise().query(query, values);
        return rows[0] ? rows[0] : undefined;
    },

    // this function assumes we have already validated that email is registered
    // returns true or false
    async validatePassword(email, password){
        const values = [email];
        const query = `SELECT password FROM users WHERE email = ?`
        const [rows,fields] = await db.promise().query(query, values);
        return rows[0] ? rows[0].password === password : undefined; 
    }
}

module.exports = UserModel;
