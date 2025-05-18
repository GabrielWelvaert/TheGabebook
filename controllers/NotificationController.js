const path = require('path');
const ServerUtils = require('./serverUtils.js');
const { v4: uuidv4 } = require('uuid');
const NotificationModel = require('../models/NotificationModel.js');
const UserModel = require('../models/UserModel.js');
const PostModel = require('../models/PostModel.js');
const CommentModel = require('../models/CommentModel.js');

const NotificationController = {
    async createNotification(req,res){ // sessionUser generating notification for recipient
        const recipientUUID = req.body.recipientUUID;
        let subjectUUID = req.body.subjectUUID; // UUID of the subject interacted with (comment, post, user) 
        let linkObjectUUID = req.body.linkObjectUUID; // appended into link. (either a user UUID to go to page or a post UUID to go to post) 
        const action = req.body.action; 
        const senderId = req.session.userId;

        if(action == "acceptfriendrequest"){
            const sessionUserUUID = await UserModel.getUUIDFromUserId(senderId);
            subjectUUID = sessionUserUUID; 
            linkObjectUUID = sessionUserUUID;
        }

        const datetime = ServerUtils.getCurrentDateTime();
        const notificationUUID = uuidv4();
        const recipientId = await UserModel.getUserIdFromUUID(recipientUUID);
        if(!recipientId){
            return res.status(400).json({success: false, message:"Recipient not found"});
        }

        // there are 4 types of notifications
        const getSenderName = await UserModel.getName(senderId);
        const senderFullName = `${getSenderName.firstName} ${getSenderName.lastName}`;
        let link, text;
        switch(action){ 
            case "likepost":{
                const postId = await PostModel.getPostIdFromUUID(subjectUUID);
                if(!postId){
                    return res.status(400).json({success: false, message:"Subject does not exist"});
                }
                text = `${senderFullName} liked your post`;
                link = `/post/view/${linkObjectUUID}`; 
            } break;
            case "comment":{
                const commentId = await CommentModel.getCommentIdFromUUID(subjectUUID);
                if(!commentId){
                    return res.status(400).json({success: false, message:"Subject does not exist"});
                }
                text = `${senderFullName} commented on your post`;
                link = `/post/view/${linkObjectUUID}`; 
            } break;
            case "likecomment":{
                const commentId = await CommentModel.getCommentIdFromUUID(subjectUUID);
                if(!commentId){
                    return res.status(400).json({success: false, message:"Subject does not exist"});
                }
                text = `${senderFullName} liked your comment`;
                link = `/post/view/${linkObjectUUID}`; 
            } break;
            case "acceptfriendrequest":{
                // no need to verify -- friednship middleware has already done so
                text = `${senderFullName} accepted your friend request`;
                link = `/user/profile/${subjectUUID}`; 
            } break;
        }

        // check for too many requests -- is there a notificaiton between these two users with same subject and text within X seconds?
        const lastNotification = await NotificationModel.getTimeOfLastNotificationForSubjectBetweenTwoUsers(senderId, recipientId, subjectUUID, datetime)
        if(lastNotification){
            const now = new Date(datetime).getTime();
            const lastNotificationTime = new Date(lastNotification.datetime).getTime();
            const spamThresholdSeconds = 90; 
            // may appear to not work for spam likes since duplicate likes are also blocked
            if(lastNotification.text == text && now - lastNotificationTime <= spamThresholdSeconds * 1000){
                console.log("blocking spam");
                return res.status(429).json({success: false, message:"Spam detected"});
            }
        }

        // does this "like" notification already exist? if so, do not notify recipient
        if(action == "likepost" || action == "likecomment"){ // does a notification already exist with matching sender, recipient, and subject?
            const likeNotificationExists = await NotificationModel.likeNotificationAlreadyExistsForSubjectBetweenTwoUsers(senderId, recipientId, subjectUUID);
            if(likeNotificationExists){
                return res.status(409).json({success: false, message:"Rejecting duplicate like notification"});
            }
        }

        const success = NotificationModel.createNotification(link, datetime, senderId, recipientId, notificationUUID, text, subjectUUID);
        if(success){
            NotificationModel.cullNotifications(recipientId);
            return res.status(201).json({success: true, notificationUUID:notificationUUID});
        } 
        return res.status(400).json({success: false, message:"Notification Model Failure"});

    },
    async seen(req,res){

    },
    async getNotifications(req,res){
        
    }
};

module.exports = NotificationController;