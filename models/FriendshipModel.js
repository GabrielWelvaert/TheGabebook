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
    async createFriendRequest(initiatorId, otherId){ // initiator must be first arg
        let idSmaller = Math.min(initiatorId, otherId);
        let idLarger = Math.max(initiatorId, otherId);
        const query = `INSERT into friendship (idSmaller, idLarger, initiatorId, pending) VALUES (?,?,?,?);`;
        const [result] = await db.promise().query(query, [idSmaller, idLarger, initiatorId, true]);
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
}

module.exports = FriendshipModel;