const db = require('../config/db.js');

const maxNumberMessages = 30;

const MessageModel = {
    async sendMessage(senderId, recipientId, datetime, text){
        const query = `INSERT INTO message (senderId, recipientId, datetime, text) VALUES (?,?,?,?);`;
        const [rows] = await db.promise().query(query, [senderId, recipientId, datetime, text]);
        const countMessages = await this.countMessages(senderId, recipientId);
        if(countMessages > maxNumberMessages){
            await this.deleteOldestFiveMessages(senderId, recipientId);
        }
        return rows.affectedRows > 0;        
    },
    async getConversation(IdOne, IdTwo){
        const query = `SELECT * FROM message WHERE (senderId = ? AND recipientId = ?) OR (senderId = ? AND recipientId = ?);`;
        const [rows] = await db.promise().query(query, [IdOne, IdTwo, IdTwo, IdOne]);
        return rows;
    },
    async countMessages(IdOne, IdTwo) {
        const query = `SELECT COUNT(*) AS total FROM message WHERE (senderId = ? AND recipientId = ?) OR (senderId = ? AND recipientId = ?);`;
        const [rows] = await db.promise().query(query, [IdOne, IdTwo, IdTwo, IdOne]);
        return rows[0].total;
    },
    async deleteOldestFiveMessages(IdOne, IdTwo) {
        const query = `DELETE FROM message
                        WHERE messageId IN (
                            SELECT messageId FROM (
                                SELECT messageId
                                FROM message
                                WHERE (senderId = ? AND recipientId = ?) OR (senderId = ? AND recipientId = ?)
                                ORDER BY datetime ASC
                                LIMIT 5
                            ) AS sub
                        );`
        const [rows] = await db.promise().query(query, [IdOne, IdTwo, IdTwo, IdOne]);
        return rows.affectedRows > 0;
    },
    async getActiveConversationFriends(selfId){ // to populate people-list w/ prior convos
        const query = `SELECT 
                            BIN_TO_UUID(u.userUUID, true) AS otherUUID,
                            u.firstName AS otherFirstName,
                            u.lastName AS otherLastName,
                            u.profilePic AS otherProfilePic,
                            MAX(m.datetime) AS lastMsgTime
                        FROM user u
                        JOIN message m ON (
                            (m.senderId = ? AND m.recipientId = u.userId)
                            OR (m.senderId = u.userId AND m.recipientId = ?)
                        )
                        WHERE u.userId != ?
                        GROUP BY u.userId, u.userUUID, u.firstName, u.lastName, u.profilePic
                        ORDER BY lastMsgTime DESC;`;
        const [rows] = await db.promise.query(query, [selfId,selfId,selfId]);
        return rows[0] ? rows : undefined;
    }

}

module.exports = MessageModel;