const db = require('../config/db.js');

const CommentModel = {
    async submitComment(data){
        const {authorId, text, datetime, postId} = data;
        const query = `INSERT INTO comment (authorId, text, datetime, postId) VALUES (?,?,?,?);`;
        const values = [authorId, text, datetime, postId];
        const rows = await db.promise().query(query, values);
        return rows[0] ? rows[0] : undefined;        
    }
}

module.exports = CommentModel;