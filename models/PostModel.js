const db = require('../config/db.js')
const bcrypt = require('bcrypt');

const PostModel = {
    async createPost(data){
        const { authorId, text, media, datetime } = data;  
        const query = `INSERT INTO post (authorId, text, media, datetime) VALUES (?, ?, ?, ?);`;
        const values = [authorId, text, media, datetime];  
        const [rows, fields] = await db.promise().query(query, values); 
        return rows[0] ? rows[0] : undefined;
    },
    async getPosts(data){
        const userId = data;
        const query = `SELECT * FROM test_db.post WHERE authorId = ? ORDER BY datetime DESC;`;
        const [rows, fields] = await db.promise().query(query, userId); 
        return rows[0] ? rows : undefined;
    }
}

module.exports = PostModel;