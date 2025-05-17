const db = require('../config/db.js');

const maxNumberOfNotifications = 30;

const NotificationModel = {
    async createNotification(link, datetime, senderId, recipientId, notificationUUID, text){
        const query = `INSERT INTO notification (link, datetime, senderId, recipientId, notificationUUID, text, seen) VALUES (?,?,?,?,UUID_TO_BIN(?,true),?,?);`;
        const [result] = await db.promise().query(query, [link, datetime, senderId, recipientId,notificationUUID,text,false]);
        // todo check how many notifications this user has and delete the old ones. 
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
    async seen(){

    },
    async getNotifications(){

    }
}

module.exports = NotificationModel;