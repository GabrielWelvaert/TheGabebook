const db = require('../config/db.js')
const bcrypt = require('bcrypt');

const PostModel = {
    async getPostIdFromUUID(postUUID){
        const query = `SELECT postId FROM post WHERE postUUID = UUID_TO_BIN(?, true);`;
        const [rows] = await db.promise().query(query, [postUUID]);
        return rows[0] ? rows[0].postId : undefined;
    },
    async createPost(data){
        const {postUUID, authorId, text, media, datetime } = data;  
        const query = `INSERT INTO post (postUUID, authorId, text, media, datetime) VALUES (UUID_TO_BIN(?,true),?, ?, ?, ?);`;
        const values = [postUUID, authorId, text, media, datetime];  
        const [result] = await db.promise().query(query, values); 
        if(result.insertId){
            const [rows] = await db.promise().query(`SELECT BIN_TO_UUID(postUUID, true) as postUUID, text, datetime FROM post WHERE postId = ?`, [result.insertId]);
            return rows[0] ? rows[0] : undefined;
        }
        return undefined;
    },
    async getPosts(profileUserId, sessionUserId){
        const query = `SELECT 
                        BIN_TO_UUID(p.postUUID, true) as postUUID, 
                        p.text AS text,
                        p.datetime AS datetime,
                        p.media AS media,
                        u.profilePic AS postAuthorProfilePic,
                        IF(p.authorId = ?, TRUE, FALSE) AS userIsAuthorized,
                        BIN_TO_UUID(u.userUUID, true) AS postAuthorUUID,  

                        (SELECT COUNT(*) FROM likes l WHERE l.postId = p.postId AND l.commentId IS NULL) AS postNumLikes,

                        EXISTS(
                            SELECT 1 FROM likes l WHERE l.postId = p.postId AND l.userId = ? AND l.commentId IS NULL
                        ) AS userLikedPost,

                        COALESCE(JSON_ARRAYAGG(
                            CASE 
                                WHEN c.commentId IS NOT NULL THEN JSON_OBJECT(
                                    'commentUUID', BIN_TO_UUID(c.commentUUID, true), 
                                    'commentText', c.text,
                                    'commentDatetime', c.datetime,
                                    'userIsAuthorized', IF(c.authorId = ? OR p.authorId = ?, TRUE, FALSE),
                                    'commentLikeCount', (
                                        SELECT COUNT(*) FROM likes l WHERE l.commentId = c.commentId
                                    ),
                                    'userLikedComment', EXISTS(
                                        SELECT 1 FROM likes l WHERE l.commentId = c.commentId AND l.userId = ?
                                    ),
                                    'authorFirstName', cu.firstName,
                                    'authorLastName', cu.lastName,
                                    'authorProfilePic', cu.profilePic,
                                    'commentAuthorUUID', BIN_TO_UUID(cu.userUUID, true)
                                )
                            END
                        ), JSON_ARRAY()) AS comments

                    FROM post p
                    LEFT JOIN user u ON u.userId = p.authorId -- Post author's profile pic
                    LEFT JOIN comment c ON p.postId = c.postId -- Comments associated with each post
                    LEFT JOIN user cu ON cu.userId = c.authorId -- Comment authors
                    WHERE p.authorId = ?
                    GROUP BY p.postId
                    ORDER BY p.datetime DESC;`;
        const [rows] = await db.promise().query(query, [sessionUserId,sessionUserId,sessionUserId,sessionUserId,profileUserId,profileUserId]);
        return rows[0] ? rows : undefined;
    },
    async getAllCommentsForPost(userId, postId){
        const query = `SELECT 
                            COALESCE(JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'commentUUID', BIN_TO_UUID(c.commentUUID, true), 
                                    'commentText', c.text,
                                    'commentDatetime', c.datetime,
                                    'authorFirstName', cu.firstName,
                                    'authorLastName', cu.lastName,
                                    'authorProfilePic', cu.profilePic,
                                    'commentLikeCount', (
                                        SELECT COUNT(*) FROM likes l WHERE l.commentId = c.commentId
                                    ),
                                    'userLikedComment', EXISTS(
                                        SELECT 1 FROM likes l WHERE l.commentId = c.commentId AND l.userId = ?
                                    )
                                )
                            ), JSON_ARRAY()) AS comments
                        FROM comment c
                        LEFT JOIN user cu ON cu.userId = c.authorId -- info about comment author
                        WHERE c.postId = ?
                        ORDER BY c.datetime ASC;`
        const [rows] = await db.promise().query(query, [userId,postId]);
        return rows[0] ? rows : undefined;
    },
    async deletePost(data){
        const {postId, authorId} = data;
        const query = 'DELETE FROM post WHERE postID = ? AND authorId = ?';
        const [rows, fields] = await db.promise().query(query, [postId,authorId]);
        return rows.affectedRows > 0;
    },
    async postExists(postId){
        const query = `SELECT * FROM post WHERE postId = ?;`;
        const [rows, fields] = await db.promise().query(query, [postId]);
        return rows[0] ? rows[0] : undefined;
    },
}

module.exports = PostModel;