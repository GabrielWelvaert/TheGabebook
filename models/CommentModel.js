const db = require('../config/db.js');

const CommentModel = {
    async getCommentIdFromUUID(commentUUID){
        const query = `SELECT commentId FROM comment WHERE commentUUID = UUID_TO_BIN(?, true);`;
        const [rows] = await db.promise().query(query, [commentUUID]);
        return rows[0] ? rows[0].commentId : undefined;
    },
    async submitComment(data){
        const {commentUUID, authorId, text, datetime, postId} = data;
        const query = `INSERT INTO comment (commentUUID, authorId, text, datetime, postId) VALUES (UUID_TO_BIN(?,true),?,?,?,?);`;
        const values = [commentUUID, authorId, text, datetime, postId];
        const [result] = await db.promise().query(query, values);
        if(result.insertId){
            const [rows] = await db.promise().query(`SELECT BIN_TO_UUID(commentUUID, true) as commentUUID, text, datetime FROM comment WHERE commentId = ?`, [result.insertId]);
            return rows[0] ? rows[0] : undefined;
        }
        return undefined;      
    },
    async commentExists(commentId){
        const query = `SELECT * FROM comment WHERE commentId = ?;`;
        const [rows, fields] = await db.promise().query(query, [commentId]);
        return rows[0] ? rows[0] : undefined;       
    },
    async deleteComment(commentId){
        const query =  `DELETE FROM comment WHERE commentId = ?`;
        const [rows,fields] = await db.promise().query(query, [commentId]);
        return rows.affectedRows > 0;
    },
    async getNotificationInfoFromCommentId(commentId){ // get postUUID and authorUUID
        const query = `SELECT
            BIN_TO_UUID(u.userUUID, TRUE) AS authorUUID,
            BIN_TO_UUID(p.postUUID, TRUE) AS postUUID
            FROM comment AS c
            JOIN user AS u ON u.userId = c.authorId
            JOIN post AS p ON p.postId = c.postId
            WHERE c.commentId = ?`;
        const [rows] = await db.promise().query(query, [commentId]);
        return rows[0] ? rows[0] : undefined;
    },
}

module.exports = CommentModel;