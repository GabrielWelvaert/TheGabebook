const db = require('../config/db.js');

const maxNumberOfNotifications = 50;

const NotificationModel = {
    async createNotification(link, datetime, senderId, recipientId, notificationUUID, text, subjectUUID){
        const query = `INSERT INTO notification (link, datetime, senderId, recipientId, notificationUUID, text, seen, subjectUUID) VALUES (?,?,?,?,UUID_TO_BIN(?,true),?,?,UUID_TO_BIN(?,true));`;
        const [result] = await db.promise().query(query, [link, datetime, senderId, recipientId,notificationUUID,text,false,subjectUUID]);
        return result.affectedRows > 0;
    },
    async cullNotifications(recipientId){
        const query = `SELECT count(*) as count FROM notification WHERE recipientId = ?;`;
        const [result] = await db.promise().query(query, [recipientId]);
        const count = result[0].count;
        if (result[0].count >= maxNumberOfNotifications){
            const deleteQuery = `
                DELETE FROM notification 
                WHERE recipientId = ? 
                ORDER BY datetime ASC 
                LIMIT 5;`;
            await db.promise().query(deleteQuery, [recipientId]);
        }
    },
    async getTimeOfLastNotificationForSubjectBetweenTwoUsers(senderId, recipientId, subjectUUID, datetime){
        // query fetches most recent notification between these two users given the subject
        const query = ` 
            SELECT *
            FROM notification
            WHERE senderId = ? AND recipientId = ? AND subjectUUID = UUID_TO_BIN(?, true)
            ORDER BY datetime DESC
            LIMIT 1;
        `;
        const [rows] = await db.promise().query(query, [senderId, recipientId, subjectUUID]);
        return rows[0] ? rows[0] : undefined;
    },
    async likeNotificationAlreadyExistsForSubjectBetweenTwoUsers(senderId, recipientId, subjectUUID){
        // should only be called when action is likepost or likecomment
        const query = ` 
            SELECT *
            FROM notification
            WHERE senderId = ? AND recipientId = ? AND subjectUUID = UUID_TO_BIN(?, true)
        `;
        const [rows] = await db.promise().query(query, [senderId, recipientId, subjectUUID]);
        return rows[0] ? rows[0] : undefined;
    },
    async seen(notificationUUID){
        const query = `UPDATE notification SET seen = TRUE WHERE notificationUUID = UUID_TO_BIN(?,true);`;
        const [rows] = await db.promise().query(query, [notificationUUID]);
        return rows.affectedRows > 0;
    },
    async getNotifications(recipientId){
        const query = `SELECT datetime,link,BIN_TO_UUID(notificationUUID,true) as notificationUUID,BIN_TO_UUID(subjectUUID,true) as subjectUUID,seen,text,senderId as senderUUID from notification WHERE recipientId = ? ORDER BY datetime ASC;`;
        const [rows] = await db.promise().query(query, [recipientId]);
        return rows;
    },
    async getCountUnseen(recipientId){
        const query = `SELECT COUNT(*) as count FROM notification WHERE recipientId = ? AND seen = FALSE`;
        const [rows] = await db.promise().query(query, [recipientId]);
        return rows[0].count;
    },
    async getLastNotification(userId, otherId){
        const query = `SELECT datetime,link,BIN_TO_UUID(notificationUUID,true) as notificationUUID,BIN_TO_UUID(subjectUUID,true) as subjectUUID,seen,text,senderId as senderUUID from notification WHERE recipientId = ? AND senderId = ? ORDER BY datetime DESC LIMIT 1;`;
        const [rows] = await db.promise().query(query, [userId, otherId]);
        return rows[0] ? rows[0] : undefined;
    }
}

module.exports = NotificationModel;