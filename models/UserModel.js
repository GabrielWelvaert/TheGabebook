const db = require('../config/db.js')

const UserModel = {
    async findUserByEmail(email){
        console.log("entered findUserByEmail() in UserModel.js");
        const query = 'SELECT * FROM users WHERE email = ?';
        const values = [email];
        const [rows] = await db.promise().query(query, values);
        return rows.length > 0;
    },

    async createUser(userData){
        console.log("entered createUser() in UserModel.js");
        const { firstName, lastName, email, password, birthday } = userData;
        const query = `
            INSERT INTO users (firstName, lastName, email, password, birthday)
            VALUES (?,?,?,?,?);
        `;
        const values = [firstName, lastName, email, password, birthday];
        const result = await db.promise().query(query, values);
        // return result.rows[0];
    }
}

module.exports = UserModel;
