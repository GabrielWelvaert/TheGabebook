const db = require('../config/db.js');

const maxNumberMessages = 30;

const MessageModel = {
    async sendMessage(senderId, recipientId, datetime, text, UUID){
        const query = `INSERT INTO message (senderId, recipientId, datetime, text, messageUUID) VALUES (?,?,?,?,UUID_TO_BIN(?,true));`;
        const [rows] = await db.promise().query(query, [senderId, recipientId, datetime, text, UUID]);
        const countMessages = await this.countMessages(senderId, recipientId);
        if(countMessages > maxNumberMessages){
            await this.deleteOldestFiveMessages(senderId, recipientId);
        }
        return rows.affectedRows > 0;        
    },
    async getConversation(selfId, otherId){
        const query = `SELECT datetime, text, BIN_TO_UUID(messageUUID, true) as messageUUID, seen,
                            CASE WHEN senderId = ? THEN TRUE ELSE FALSE END AS isSender
                        FROM message 
                        WHERE 
                            (senderId = ? AND recipientId = ?) OR 
                            (senderId = ? AND recipientId = ?)
                        ORDER BY datetime ASC;
                    `;
        const [rows] = await db.promise().query(query, [selfId, selfId, otherId, otherId, selfId]);
        return rows[0] ? rows : null;
    },
    async deleteConversation(selfId, otherId){
        const query = `DELETE FROM message WHERE (senderId = ? AND recipientId = ?) OR (senderId = ? AND recipientId = ?);`
        const [rows] = await db.promise().query(query, [selfId, otherId, otherId, selfId]);
        return rows.affectedRows > 0; 
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
    async getMostRecentMessageTime(IdOne, IdTwo) {
        const query = `SELECT * FROM message WHERE (senderId = ? AND recipientId = ?) OR (senderId = ? AND recipientId = ?) ORDER BY datetime DESC LIMIT 1;`;
        const [rows] = await db.promise().query(query, [IdOne, IdTwo, IdTwo, IdOne]);
        return rows[0] ? rows : null;
    },
    async getMostRecentMessage(IdOne, IdTwo) {
        const query = `SELECT datetime, text, BIN_TO_UUID(messageUUID, true) as messageUUID, seen FROM message WHERE (senderId = ? AND recipientId = ?) OR (senderId = ? AND recipientId = ?) ORDER BY datetime DESC LIMIT 1;`;
        const [rows] = await db.promise().query(query, [IdOne, IdTwo, IdTwo, IdOne]);
        return rows[0] ? rows[0] : null;
    },
    async getActiveConversationFriends(selfId){ // to populate people-list w/ prior convos
        const query = `
                SELECT 
                    BIN_TO_UUID(u.userUUID, true) AS otherUUID,
                    u.firstName AS otherFirstName,
                    u.lastName AS otherLastName,
                    u.profilePic AS otherProfilePic,
                    m.datetime AS lastMsgTime,
                    CASE WHEN m.senderId = ? THEN TRUE ELSE FALSE END AS isSender,
                    CASE WHEN m.senderId != ? AND m.seen = 0 THEN TRUE ELSE FALSE END AS isUnseen
                FROM user u
                JOIN (
                    SELECT m1.*
                    FROM message m1
                    JOIN (
                        SELECT 
                            userA,
                            userB,
                            MAX(messageId) AS maxMsgId
                        FROM (
                            SELECT 
                                LEAST(senderId, recipientId) AS userA,
                                GREATEST(senderId, recipientId) AS userB,
                                messageId
                            FROM message
                            WHERE senderId = ? OR recipientId = ?
                        ) grouped
                        GROUP BY userA, userB
                    ) latest
                    ON LEAST(m1.senderId, m1.recipientId) = latest.userA
                    AND GREATEST(m1.senderId, m1.recipientId) = latest.userB
                    AND m1.messageId = latest.maxMsgId
                ) m
                ON (
                    (m.senderId = u.userId AND m.recipientId = ?) OR
                    (m.recipientId = u.userId AND m.senderId = ?)
                )
                WHERE u.userId != ?
                ORDER BY m.datetime DESC;
            `;
        const [rows] = await db.promise().query(query, [selfId, selfId, selfId, selfId, selfId, selfId, selfId]);
        return rows[0] ? rows : null;
    },
    async getNumberUnreadMessages(selfId) {
        const query = `
                SELECT 
                    COUNT(*) AS unseenCount,
                    GROUP_CONCAT(DISTINCT BIN_TO_UUID(u.userUUID, true)) AS userUUIDs
                FROM (
                    SELECT 
                        m.messageId,
                        m.senderId,
                        m.recipientId,
                        m.seen
                    FROM message m
                    JOIN (
                        SELECT 
                            LEAST(senderId, recipientId) AS userA,
                            GREATEST(senderId, recipientId) AS userB,
                            MAX(messageId) AS maxMsgId
                        FROM message
                        WHERE senderId = ? OR recipientId = ?
                        GROUP BY userA, userB
                    ) latest
                    ON LEAST(m.senderId, m.recipientId) = latest.userA
                    AND GREATEST(m.senderId, m.recipientId) = latest.userB
                    AND m.messageId = latest.maxMsgId
                    WHERE m.seen = 0 AND m.senderId != ?
                ) AS recentUnseen
                JOIN user u ON recentUnseen.senderId = u.userId;`;
        const [rows] = await db.promise().query(query, [selfId, selfId, selfId]);
        const unseenCount = rows[0]?.unseenCount || 0;  // Get unseen count
        const userUUIDs = rows[0]?.userUUIDs ? rows[0].userUUIDs.split(',') : [];  // Get the list of unique userUUIDs
        return {unseenCount, userUUIDs};
    },
    async markMessageAsSeen(messageUUID) {
        const query = `
            UPDATE message 
            SET seen = 1 
            WHERE messageUUID = UUID_TO_BIN(?, true)
        `;
        const [rows] = await db.promise().query(query, [messageUUID]);
        return rows.affectedRows > 0;
    }
}

module.exports = MessageModel;