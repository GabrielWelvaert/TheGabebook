const db = require('../config/db.js');

const CommentModel = {
    async submitComment(data){
        const {authorId, text, datetime, postId} = data;
        const query = `INSERT INTO comment (authorId, text, datetime, postId) VALUES (?,?,?,?);`;
        const values = [authorId, text, datetime, postId];
        const rows = await db.promise().query(query, values);
        return rows[0] ? rows[0] : undefined;        
    },
    async commentExists(commentId){
        const query = `SELECT * FROM comment WHERE commentId = ?;`;
        const [rows, fields] = await db.promise().query(query, [commentId]);
        return rows[0] ? rows[0] : undefined;       
    },
    async deleteComment(commentId){
        const query =  `DELETE FROM comment WHERE commentId = ?`;
        const [rows,fields] = await db.promise().query(query, [commentId]);
        return rows.affectedRows  > 0;
    }
}

module.exports = CommentModel;