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
    async getPosts(userId){
        const query = `SELECT 
                        p.postId, 
                        p.text AS text,
                        p.datetime AS datetime,
                        p.media AS media,
                        u.profilePic AS postAuthorProfilePic,

                        (SELECT COUNT(*) FROM likes l WHERE l.postId = p.postId AND l.commentId IS NULL) AS postNumLikes,

                        EXISTS(
                            SELECT 1 FROM likes l WHERE l.postId = p.postId AND l.userId = ? AND l.commentId IS NULL
                        ) AS userLikedPost,

                        COALESCE(JSON_ARRAYAGG(
                            CASE 
                                WHEN c.commentId IS NOT NULL THEN JSON_OBJECT(
                                    'commentId', c.commentId, 
                                    'commentText', c.text,
                                    'commentDatetime', c.datetime,
                                    'userIsCommentAuthor', c.authorId = ?,  
                                    'commentLikeCount', (
                                        SELECT COUNT(*) FROM likes l WHERE l.commentId = c.commentId
                                    ),
                                    'userLikedComment', EXISTS(
                                        SELECT 1 FROM likes l WHERE l.commentId = c.commentId AND l.userId = ?
                                    ),
                                    'authorFirstName', cu.firstName,
                                    'authorLastName', cu.lastName,
                                    'authorProfilePic', cu.profilePic
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
        const [rows] = await db.promise().query(query, [userId,userId,userId,userId,userId,userId,userId]);
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