const FriendshipModel = require("../models/FriendshipModel.js");
const UserModel = require("../models/UserModel.js");
const path = require('path');
const ServerUtils = require('./serverUtils.js');
const MessageModel = require("../models/MessageModel.js");

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
            await MessageModel.deleteConversation(selfId, otherId);
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
            console.error(error.message);
            return res.status(500).json({success:false, message: `Server Error: ${error.message}`})
        }
    },
    async getAllIncoming(req,res){
        try {
            const selfId = req.session.userId;
            const getAllIncoming = await FriendshipModel.getAllIncoming(selfId);
            return res.status(200).json({success:true, friendships:getAllIncoming});
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success:false, message: `Server Error: ${error.message}`})
        }
    },
    async getAll(req,res){ 
        try {
            let IdOne = req.session.userId;
            if(req.params.otherUUID){ // if passed a UUID, use it, otherwise assume self
                IdOne = await UserModel.getUserIdFromUUID(req.params.otherUUID);   
            }
            const friendships = await FriendshipModel.getAll(IdOne);
            return res.status(200).json({success:true, friendships:friendships});
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success:false, message: `Server Error: ${error.message}`})
        }
    },
    async friendSearch(req,res){
        try {
            let IdSelf = req.session.userId;
            if(!req.body.text || req.body.text.length < 3){
                return res.status(400).json({success: false});
            }
            let text = req.body.text.trim().split(/\s+/)
            let firstName = text[0];
            let lastName = text.length > 1 ? text[1] : undefined;
            const users = await FriendshipModel.friendSearch(IdSelf, firstName, lastName);
            return res.status(200).json({success: true, users:users});
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success:false, message: `Server Error: ${error.message}`})
        }
    }
}

module.exports = FriendshipController;