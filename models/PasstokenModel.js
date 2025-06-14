const db = require('../config/db.js');

const PasstokenModel = {
    async validateConfirmToken(){

    },
    async createConfirmToken(){

    },
    async validateResetToken(){

    },
    async createResetToken(userId, token, expiry){
        const query = `INSERT INTO passtokens (userId, token, type, expiry) VALUES (?,UUID_TO_BIN(?,true),?,?);`;
        const [result] = await db.promise().query(query, [userId, token, 'reset', expiry]);
        return result.affectedRows > 0;
    },
    async userHasActiveConfirmToken(userId){
        const query = `SELECT 1 FROM passtokens WHERE userId = ? AND type = 'confrim' AND expiry > NOW() LIMIT 1;`;
        const [rows] = await db.promise().query(query, [userId]);
        return rows.length > 0; 
    },
    async userHasActiveResetToken(userId){
        const query = `SELECT 1 FROM passtokens WHERE userId = ? AND type = 'reset' AND expiry > NOW() LIMIT 1;`;
        const [rows] = await db.promise().query(query, [userId]);
        return rows.length > 0; 
    }
}

module.exports = PasstokenModel;