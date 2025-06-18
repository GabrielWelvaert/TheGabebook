const db = require('../config/db.js');

const PasstokenModel = {
    async createConfirmToken(userId, token, expiry){
        const query = `INSERT INTO passtokens (userId, token, type, expiry) VALUES (?,UUID_TO_BIN(?,true),?,?);`;
        const [result] = await db.promise().query(query, [userId, token, 'confirm', expiry]);
        return result.affectedRows > 0;
    },
    async createResetToken(userId, token, expiry){
        const query = `INSERT INTO passtokens (userId, token, type, expiry) VALUES (?,UUID_TO_BIN(?,true),?,?);`;
        const [result] = await db.promise().query(query, [userId, token, 'reset', expiry]);
        return result.affectedRows > 0 ? result.insertedId : null;
    },
    async userHasActiveConfirmToken(userId){
        const query = `SELECT 1 FROM passtokens WHERE userId = ? AND type = 'confirm' AND expiry > NOW() LIMIT 1;`;
        const [rows] = await db.promise().query(query, [userId]);
        return rows.length > 0; 
    },
    async userHasActiveResetToken(userId){
        const query = `SELECT 1 FROM passtokens WHERE userId = ? AND type = 'reset' AND expiry > NOW() LIMIT 1;`;
        const [rows] = await db.promise().query(query, [userId]);
        return rows.length > 0; 
    },
    async cullExpiredTokens(){
        const query = `DELETE FROM passtokens WHERE NOW() > expiry;`;
        const [result] = await db.promise().query(query);
        return result.affectedRows;
    },
    async isValidResetToken(token){
        const query = `SELECT * FROM passtokens WHERE token = UUID_TO_BIN(?,true) AND type = 'reset' AND expiry > NOW() LIMIT 1;`;
        const [rows] = await db.promise().query(query, [token]);
        return rows.length > 0 ? rows[0] : null;
    },
    async isValidConfirmToken(token){
        const query = `SELECT * FROM passtokens WHERE token = UUID_TO_BIN(?,true) AND type = 'confirm' AND expiry > NOW() LIMIT 1;`;
        const [rows] = await db.promise().query(query, [token]);
        return rows.length > 0 ? rows[0] : null;
    },
    async deleteAllTokensForUser(userId){
        const query = `DELETE FROM passtokens WHERE userID = ?;`;
        const [result] = await db.promise().query(query, [userId]);
        return result.affectedRows;
    },
}

module.exports = PasstokenModel;