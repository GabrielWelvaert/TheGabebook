const db = require('../config/db.js');
const bcrypt = require('bcrypt');

const LikesModel = {
    async userHasLikedPost(postId, userId){
        const query = `SELECT * FROM likes WHERE postId = ? and userId = ?;`;
        const values = [postId, userId];
        const [rows,fields] = await db.promise().query(query, values);
        return rows.length > 0;
    },
    async likePost(postId, userId){
        const query = `INSERT INTO likes (postId, userId) VALUES (?,?);`;
        const values = [postId, userId];
        const [rows,fields] = await db.promise().query(query, values);
        return rows[0] ? rows[0] : undefined;
    },
    async dislikePost(postId, userId){
        const query = `DELETE FROM likes WHERE  postId = ? and userId = ?;`;
        const values = [postId, userId];
        const [rows,fields] = await db.promise().query(query, values);
        return rows.length > 0;
    },
    async getLikes(postId){ // returns total number of likes for a post
        const query = `SELECT COUNT(*) AS total_likes FROM likes WHERE postId = ?`;
        const [rows,fields] = await db.promise().query(query, [postId]);
        return rows[0].total_likes;
    }
}

module.exports = LikesModel;