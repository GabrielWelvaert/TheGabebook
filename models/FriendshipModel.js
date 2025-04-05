const db = require('../config/db.js');

// the friendship table requires the two ids to be inserted in sorted order
const FriendshipModel = {
    async getStatus(IdOne, IdTwo){
        let idSmaller = Math.min(IdOne, IdTwo);
        let idLarger = Math.max(IdOne, IdTwo);
        const query = `SELECT pending, initiatorId FROM friendship WHERE (idSmaller = ? AND idLarger = ?);`;
        const [rows] = await db.promise().query(query, [idSmaller, idLarger]);
        return rows[0] ? rows[0] : undefined;
    },
    async createFriendRequest(initiatorId, otherId, datetime){ // initiator must be first arg
        let idSmaller = Math.min(initiatorId, otherId);
        let idLarger = Math.max(initiatorId, otherId);
        const query = `INSERT into friendship (idSmaller, idLarger, initiatorId, pending, datetime) VALUES (?,?,?,?,?);`;
        const [result] = await db.promise().query(query, [idSmaller, idLarger, initiatorId, true, datetime]);
        return result.affectedRows > 0;
    },
    async acceptFriendRequest(IdOne, IdTwo){
        let idSmaller = Math.min(IdOne, IdTwo);
        let idLarger = Math.max(IdOne, IdTwo);
        const query = `UPDATE friendship SET pending = 0 where (idSmaller = ? and idLarger = ?);`;
        const [result] = await db.promise().query(query, [idSmaller, idLarger]);
        return result.affectedRows > 0;
    },
    async terminate(IdOne, IdTwo){
        let idSmaller = Math.min(IdOne, IdTwo);
        let idLarger = Math.max(IdOne, IdTwo);
        const query = `DELETE FROM friendship WHERE (idSmaller = ? AND idLarger = ?);`;
        const [result] = await db.promise().query(query, [idSmaller, idLarger]);
        return result.affectedRows > 0;
    },
    async getAllOutgoing(IdOne){ // get all pending where session user is initiator
        const query = `
            SELECT COALESCE(JSON_ARRAYAGG(
                JSON_OBJECT(
                    'otherUUID', BIN_TO_UUID(u.userUUID, true),
                    'otherFirstName', u.firstName,
                    'otherLastName', u.lastName,
                    'otherProfilePic', u.profilePic
                )
            ), JSON_ARRAY()) AS friendships
            FROM (
                SELECT f.idSmaller, f.idLarger, f.datetime, 
                    CASE 
                        WHEN f.idSmaller = ? THEN f.idLarger 
                        ELSE f.idSmaller 
                    END AS otherUserId
                FROM friendship f
                WHERE f.initiatorid = ? AND f.pending = 1
                ORDER BY f.datetime ASC
            ) AS ordered_friendships
            JOIN user u ON u.userId = ordered_friendships.otherUserId;
        `;
        const [rows] = await db.promise().query(query, [IdOne, IdOne]);
        return rows[0] ? rows : undefined;
    },
    async getAllIncoming(IdOne){ // get all pending where session user is initiator
        const query = `
            SELECT COALESCE(JSON_ARRAYAGG(
                JSON_OBJECT(
                    'otherUUID', BIN_TO_UUID(u.userUUID, true),
                    'otherFirstName', u.firstName,
                    'otherLastName', u.lastName,
                    'otherProfilePic', u.profilePic
                )
            ), JSON_ARRAY()) AS friendships
            FROM (
                SELECT f.idSmaller, f.idLarger, f.datetime, 
                    CASE 
                        WHEN f.idSmaller = ? THEN f.idLarger 
                        ELSE f.idSmaller 
                    END AS otherUserId
                FROM friendship f
                WHERE f.initiatorid != ? AND f.pending = 1
                ORDER BY f.datetime ASC
            ) AS ordered_friendships
            JOIN user u ON u.userId = ordered_friendships.otherUserId;
        `;
        const [rows] = await db.promise().query(query, [IdOne, IdOne]);
        return rows[0] ? rows : undefined;
    },
    async getAll(IdOne){
        const query = `
           SELECT COALESCE(
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'otherUUID', BIN_TO_UUID(u.userUUID, true),
                        'otherFirstName', u.firstName,
                        'otherLastName', u.lastName,
                        'otherProfilePic', u.profilePic
                    )
                ), JSON_ARRAY()) AS friendships
            FROM friendship f
            JOIN user u ON u.userId = 
                CASE 
                    WHEN f.idSmaller = ? THEN f.idLarger 
                    ELSE f.idSmaller 
                END
            WHERE f.pending = 0
            AND (f.idSmaller = ? OR f.idLarger = ?)  -- Ensure we are considering friendships involving IdOne
            ORDER BY f.datetime ASC;
        `;
        const [rows] = await db.promise().query(query, [IdOne,IdOne,IdOne,IdOne]);
        return rows[0] ? rows : undefined;
    },
    
}

module.exports = FriendshipModel;