const path = require('path');
const ServerUtils = require('./serverUtils.js');
const { v4: uuidv4 } = require('uuid');
const NotificationModel = require('../models/NotificationModel.js');
const UserModel = require('../models/UserModel.js');

const NotificationController = {
    async createNotification(req,res){
        const recipientUUID = req.body.recipientUUID;
        const subjectUUID = req.body.subjectUUID;

        const datetime = ServerUtils.getCurrentDateTime();
        const notificationUUID = uuidv4();
        const recipientId = await UserModel.getUserIdFromUUID(recipientUUID);
        const senderId = req.session.userId;

        // there are 4 types of notifications
        const action = req.body.action;
        let senderName = "" // obtained from otherUUID
        let link, text;
        switch(action){ 
            case "likepost":{
                text = `${senderName} liked your post`;
                link = "todo go to post"; 
            } break;
            case "comment":{
                text = `${senderName} commented on your post`;
                link = "todo go to post"; 
            } break;
            case "likecomment":{
                text = `${senderName} liked your post`;
                link = "todo go to post"; 
            } break;
            case "acceptfriendrequest":{
                text = `${senderName} accepted your friend request`;
                link = `/user/profile/${subjectUUID}`; 
            } break;
        }
        const success = NotificationModel.createNotification(link, datetime, senderId, recipientId, notificationUUID, text);
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