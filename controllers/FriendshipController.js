const FriendshipModel = require("../models/FriendshipModel");
const UserModel = require("../models/UserModel.js");
const path = require('path');
const ServerUtils = require('./serverUtils.js');

const FriendshipController = {
    async getFriendshipStatus(req,res){ 
        try {
            const selfId = req.session.userId;
            if(!req.params.otherUUID){
                return res.status(400).json({success:false, pending:undefined, initiatorUUID:undefined, message:"!req.params.otherUUID"});
            }
            const otherId = await UserModel.getUserIdFromUUID(req.params.otherUUID);
            if(selfId == otherId){
                return res.status(400).json({success:false, pending:undefined, initiatorUUID:undefined, message:"selfId == otherId"});
            }
            let pending = null;
            let initiatorUUID = undefined;
            const friendshipData = await FriendshipModel.getStatus(selfId, otherId); 
            if(friendshipData){
                pending = friendshipData.pending;
                initiatorUUID = await UserModel.getUUIDFromUserId(friendshipData.initiatorId)    
            } // dont return 400 if !friendshipData; if it doesn't exist it just means there is no request or friendship
            return res.status(200).json({success:true, pending:pending, initiatorUUID:initiatorUUID});
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success:false, message: `Server Error: ${error.message}`});
        }
    },
    async sendFriendRequest(req,res){
        try {
            const selfId = req.session.userId;
            if(!req.body.otherUUID ){
                return res.status(400).json({success:false,message:"!req.body.otherUUID"});
            }
            const otherId = await UserModel.getUserIdFromUUID(req.body.otherUUID);
            if(selfId == otherId){
                return res.status(400).json({success:false,message:"selfId == otherId"});
            }
            const friendshipData = await FriendshipModel.getStatus(selfId, otherId);
            if(friendshipData){ // cant create request if request already exists
                return res.status(400).json({success:false,message:"friendship already exists"});
            }
            let datetime = ServerUtils.getCurrentDateTime();
            const createFriendRequest = await FriendshipModel.createFriendRequest(selfId, otherId, datetime);
            if(!createFriendRequest){
                return res.status(400).json({success:false,message:"creation db failure"});
            }
            return res.status(200).json({success:true});
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success:false, message: `Server Error: ${error.message}`})
        }
    },
    async acceptFriendRequest(req,res){
        try {
            const selfId = req.session.userId;
            if(!req.body.otherUUID ){
                return res.status(400).json({success:false,message:"!req.body.otherUUID"});
            }
            const otherId = await UserModel.getUserIdFromUUID(req.body.otherUUID);
            if(selfId == otherId){
                return res.status(400).json({success:false,message:"selfId == otherId"});
            }
            const friendshipData = await FriendshipModel.getStatus(selfId, otherId);
            if(!friendshipData){ // no request exists to accept
                return res.status(400).json({success:false,message:"no request to accept"});
            } else if(!friendshipData.pending){
                return res.status(400).json({success:false,message:"friendship is already accepted"});
            }
            const acceptFriendRequest = await FriendshipModel.acceptFriendRequest(selfId, otherId);
            if(!acceptFriendRequest){
                return res.status(400).json({success:false,message:"accept friend request db failure"});
            }
            return res.status(200).json({success:true});
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success:false, message: `Server Error: ${error.message}`})
        }
    },
    async terminate(req,res){
        try {
            const selfId = req.session.userId;
            if(!req.body.otherUUID){
                return res.status(400).json({success:false, message:"!req.body.otherUUID"});
            }
            const otherId = await UserModel.getUserIdFromUUID(req.body.otherUUID);
            if(selfId == otherId){
                return res.status(400).json({success:false, message:"selfId == otherId"});
            }
            const friendshipData = await FriendshipModel.getStatus(selfId, otherId);
            if(!friendshipData){ // does not exist, cannot be terminated
                return res.status(400).json({success:false, message:"friendship does not exist; cant be terminated"});
            }
            const endFriendRequest = await FriendshipModel.terminate(selfId, otherId);
            if(!endFriendRequest){
                return res.status(400).json({success:false, message:"friendship termination db failure"});
            } 
            return res.status(200).json({success:true});
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success:false, message: `Server Error: ${error.message}`})
        }
    },
    async friendRequests(req, res){
        res.sendFile(path.join(__dirname, '..', 'views', 'friendRequests.html')); // automatically sets status to 200
    },
    async getAllOutgoing(req,res){
        try {
            const selfId = req.session.userId;
            const getAllOutgoing = await FriendshipModel.getAllOutgoing(selfId);
            return res.status(200).json({success:true, friendships:getAllOutgoing});
        } catch (error){
            console.log(error.message);
            return res.status(500).json({success:false, message: `Server Error: ${error.message}`})
        }
    }
}

module.exports = FriendshipController;