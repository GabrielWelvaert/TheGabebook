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
    async getConversation(selfId, otherId){
        const query = `SELECT datetime, text, 
                            CASE WHEN senderId = ? THEN TRUE ELSE FALSE END AS isSender
                        FROM message 
                        WHERE 
                            (senderId = ? AND recipientId = ?) OR 
                            (senderId = ? AND recipientId = ?)
                        ORDER BY datetime ASC;
                    `;
        const [rows] = await db.promise().query(query, [selfId, selfId, otherId, otherId, selfId]);
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
                            m.datetime AS lastMsgTime,
                            CASE WHEN m.senderId = ? THEN TRUE ELSE FALSE END AS isSender
                        FROM user u
                        JOIN (
                            SELECT m1.*
                            FROM message m1
                            JOIN (
                                SELECT 
                                    LEAST(senderId, recipientId) AS userA,
                                    GREATEST(senderId, recipientId) AS userB,
                                    MAX(datetime) AS maxDate
                                FROM message
                                WHERE senderId = ? OR recipientId = ?
                                GROUP BY userA, userB
                            ) latest ON
                                LEAST(m1.senderId, m1.recipientId) = latest.userA AND
                                GREATEST(m1.senderId, m1.recipientId) = latest.userB AND
                                m1.datetime = latest.maxDate
                        ) m ON (
                            (m.senderId = u.userId AND m.recipientId = ?) OR
                            (m.recipientId = u.userId AND m.senderId = ?)
                        )
                        WHERE u.userId != ?
                        ORDER BY m.datetime DESC;`;
        const [rows] = await db.promise().query(query, [selfId, selfId, selfId, selfId, selfId, selfId]);
        return rows[0] ? rows : undefined;
    }

}

module.exports = MessageModel;