const db = require('../config/db.js');
const bcrypt = require('bcrypt');

const UserModel = {
    async getUserIdFromUUID(uuid){
        const query = `SELECT userId FROM user WHERE userUUID = UUID_TO_BIN(?,true);`;
        const [rows] = await db.promise().query(query, [uuid]);
        return rows[0] ? rows[0].userId : undefined;
    },

    async cullUsersIfThereAreTooMany(){
        let count;
        const countQuery = `SELECT COUNT(*) AS count FROM user;`;
        let [rows] = await db.promise().query(countQuery);
        count = rows[0].count;
        if(count >= 50){
            const deleteQuery = `DELETE FROM user WHERE confirmed = 0;`;
            await db.promise().query(deleteQuery);
            [rows] = await db.promise().query(countQuery);
            count = rows[0].count;
        }
        return count;
    },

    async getUUIDFromUserId(userId){
        const query = `SELECT BIN_TO_UUID(userUUID, true) as userUUID from user where userId = ?;`;
        const [rows] = await db.promise().query(query, [userId]);
        return rows[0] ? rows[0].userUUID : undefined;
    },

    async findUserByEmail(email){
        const query = 'SELECT BIN_TO_UUID(userUUID, true) as userUUID, firstName, lastName, confirmed FROM user WHERE email = ?';
        const values = [email];
        const [rows,fields] = await db.promise().query(query, values);
        return rows[0] ? rows[0] : undefined;
    },

    async confirmUser(userId){
        const query = `UPDATE user SET confirmed = 1 WHERE userId = ?;`;
        const [rows] = await db.promise().query(query, [userId]);
        return rows.affectedRows > 0;
    },

    async createUser(userData){
        const { userUUID, firstName, lastName, email, password, birthday } = userData; // unpacking passed userData
        const query = `INSERT INTO user (userUUID, firstName, lastName, email, password, birthday) VALUES (UUID_TO_BIN(?,true),LOWER(?),LOWER(?),LOWER(?),?,?);`;
        const values = [userUUID, firstName, lastName, email, password, birthday];
        const [rows,fields] = await db.promise().query(query, values);
        return rows.affectedRows > 0 ? rows.insertId : undefined;
    },

    async resetPassword(userId, password){
        const query = `UPDATE user set password = ? WHERE userId = ?;`;
        const [rows] = await db.promise().query(query, [password, userId]);
        return rows.affectedRows > 0;
    },

    // this function assumes we have already validated that email is registered
    // returns true or false. User is not yet logged in; cant verify session
    async validatePassword(email, password){
        const values = [email];
        const query = `SELECT password FROM user WHERE email = LOWER(?);`;
        const [rows,fields] = await db.promise().query(query, values);
        const isMatch = await bcrypt.compare(password, rows[0].password);
        return rows[0] ? isMatch : undefined; 
    },

    async validatePasswordFromUserId(password, userId){
        const query = `SELECT password FROM user WHERE userId = ?;`;
        const [rows] = await db.promise().query(query, [userId]);
        const isMatch = await bcrypt.compare(password, rows[0].password);
        return rows[0] ? isMatch : undefined; 
    },

    // get userId from email
    async getUserIdFromEmail(email){
        const values = [email];
        const query = `SELECT userId FROM user WHERE email = LOWER(?);`;
        const [rows,fields] = await db.promise().query(query, values);
        return rows[0] ? rows[0].userId : undefined; 
    },

    async updateInfo(column,text,userId){
        const values = [column, text, userId];
        const query = `UPDATE user SET ?? = ? WHERE userId = ?;`;
        const [rows,fields] = await db.promise().query(query, values);
        return rows.affectedRows > 0;
    },

    async getInfo(userId){;
        const query = 'SELECT job,education,location,hometown FROM user WHERE userId = ?;';
        const [rows,fields] = await db.promise().query(query, [userId]);
        return rows[0] ? rows[0] : undefined;
    },

    async getName(userId){;
        const query = 'SELECT firstName, lastName FROM user WHERE userId = ?;';
        const [rows,fields] = await db.promise().query(query, [userId]);
        return rows[0] ? rows[0] : undefined;
    },

    async updateProfilePic(userId,fileLocator){
        const query = `UPDATE user SET profilePic = ? WHERE userId = ?;`;
        const [rows,fields] = await db.promise().query(query, [fileLocator,userId]);
        return rows.affectedRows > 0;
    },

    async updateHeaderPic(userId,fileLocator){
        const query = `UPDATE user SET headerPic = ? WHERE userId = ?;`;
        const [rows,fields] = await db.promise().query(query, [fileLocator,userId]);
        return rows.affectedRows > 0;
    },
    async getProfilePic(userId){
        const query = `SELECT profilePic FROM user WHERE userId = ?;`;
        const [rows,fields] = await db.promise().query(query, [userId]);
        return rows[0] ? rows[0] : undefined;
    },

    async getHeaderPic(userId){
        const query = `SELECT headerPic FROM user WHERE userId = ?;`;
        const [rows,fields] = await db.promise().query(query, [userId]);
        return rows[0] ? rows[0] : undefined;
    },

    async deleteUser(userId){
        const query = `DELETE FROM user WHERE userId = ?;`;
        const [rows,fields] = await db.promise().query(query, [userId]);
        return rows.affectedRows > 0;
    },

    async searchUser(firstName, lastName){
        const query = `SELECT BIN_TO_UUID(userUUID, true) as userUUID, firstName, lastName, profilePic 
                        FROM user 
                        WHERE LOWER(firstName) LIKE LOWER(?) 
                        OR LOWER(lastName) LIKE LOWER(?) 
                        OR LOWER(lastName) LIKE LOWER(?)
                        LIMIT 25;`;
        const [rows] = await db.promise().query(query, ["%"+firstName+"%", "%"+lastName+"%","%"+firstName+"%"]);
        return rows ? rows : undefined;
    },

    async userIsAutoFriend(userId){
        const query = `SELECT autoFriend FROM user WHERE userId = ? LIMIT 1;`;
        const [rows] = await db.promise().query(query, [userId]);
        return rows[0].autoFriend;
    },
}

module.exports = UserModel;
