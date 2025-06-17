const UserModel = require("../models/UserModel.js");
const path = require('path');
const bcrypt = require('bcrypt');
const ServerUtils = require('./serverUtils.js');
const { v4: uuidv4 } = require('uuid');
const FileController = require('./FileController.js');
const serverUtils = require("./serverUtils.js");
const PasstokenModel = require("../models/PasstokenModel.js");
const emailValidator = require('validator');

const UserController = {
    async registerUser(req, res){ // only possible for self
        // ensure names and emails dont have trailing/leading spaces
        req.body.values.firstName.trim();
        req.body.values.lastName.trim();
        req.body.values.email.trim();
        const userUUID = uuidv4();
        let {firstName, lastName, email, password, confirmedPassword, birthday} = req.body.values;
        firstName = ServerUtils.sanitizeInput(firstName);
        lastName = ServerUtils.sanitizeInput(lastName);
        const smallVarCharSize = parseInt(process.env.SMALL_VARCHAR_SIZE);
        const passwordVarCharSize = parseInt(process.env.PASSWORD_VARCHAR_SIZE);
        try {

            // check if any forms were left empty
            if(!firstName || !lastName || !email || !password || !birthday){
                return res.status(400).json({success: false, message:"All fields are required"});
            }

            // validate birthday
            if(birthday.length != 10 || !ServerUtils.validBirthday(birthday)){
                return res.status(400).json({success:false, message:"Birthday Format Error!"});
            }

            if(serverUtils.detectSlurs(firstName) || serverUtils.detectSlurs(lastName)){
                return res.status(400).json({success:false, message:"Censored word detected in name"});
            }

            if(!emailValidator.isEmail(email)){
                return res.status(400).json({success:false, message:"Invalid email format"});
            }
            
            // todo check size of small var char fields            
            if(firstName.length > smallVarCharSize || lastName.length > smallVarCharSize || email.length > smallVarCharSize){
                return res.status(400).json({success:false, message:"Name and email fields must not be more than 45 characters in length"})
            }

            // check if this email is already registered
            const existingUser = await UserModel.findUserByEmail(email);
            if(existingUser){
                return res.status(400).json({success: false, message: "Email already registered; log-in instead!"});
            }

            // check if password and confirmed password match
            if(confirmedPassword !== password){
                return res.status(400).json({success: false, message:"Passwords do not match"});
            }
  
            if(/^(.)\1*$/.test(password) || password.length <= 3) {
                return res.status(400).json({success: false, message:"Password must have at least 2 unique characters and have a length of at least 4"});
            } 

            // hash the passwords in the req.body after it is confirmed to match
            password = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));
            if(password.length > passwordVarCharSize){
                return res.status(400).json({success: false, message:"Critical Error: Hashed Password is too long. Try using a shorter password. If you believe this is an error, contact an Admin"});
            } 

            // register new user if no issues found!
            const newUser = await UserModel.createUser({userUUID, firstName, lastName, email, password, birthday});
            if(!newUser){
                return res.status(400).json({success: false, message:"Failed to genereate user"});
            }
            UserModel.cullUsersIfThereAreTooMany();
            serverUtils.getFriendRequestFromGabe(newUser)
            return res.status(201).json({success: true, message:"User registered successfully", user: newUser}); 
        } catch (error){
            console.error("Error registering user: ", error);
            return res.status(500).json({success: false, message: "Server Error"});
        }
    },
    async resetPassword(req,res){
        try {
            const token = req.params.token;
            const password1 = req.body.password1;
            const password2 = req.body.password2;
            if(!token){
                return res.status(400).json({success: false, message:"Token missing"});
            }
            if(!password1 || !password2){
                return res.status(400).json({success: false, message:"Both passwords required"});
            }
            if(password1 != password2){
                return res.status(400).json({success: false, message:"Passwords do not match"});
            }
            if(/^(.)\1*$/.test(password1) || password1.length <= 3) {
                return res.status(400).json({success: false, message:"Password must have at least 2 unique characters and have a length of at least 4"});
            } 
            const validToken = await PasstokenModel.isValidResetToken(token);
            if(!validToken){
                return res.status(400).json({success: false, message:"Token Invalid or Expired. Get a new one!"});
            }
            const password = await bcrypt.hash(password1, parseInt(process.env.SALT_ROUNDS));
            const passwordVarCharSize = parseInt(process.env.PASSWORD_VARCHAR_SIZE);
            if(password.length > passwordVarCharSize){
                return res.status(400).json({success: false, message:"Critical Error: Hashed Password is too long. Try using a shorter password..."});
            } 
            const userId = validToken.userId;
            const resetPassword = await UserModel.resetPassword(userId, password);
            if(!resetPassword){
                return res.status(400).json({success: false, message:"Server Error"});
            }
            return res.redirect('/?message=password-reset');
        } catch (error){
            console.error("Error resetting pw: ", error);
            return res.status(500).json({success: false, message: "Server Error"});
        }
    },
    async loginUser(req, res){ // only possible for self
        const {email,password} = req.body.values;
        try{
            // check if any forms are empty
            if(!email || !password){
                return res.status(400).json({success: false, message:"All fields are required"});
            }
            // check if this email is registered
            const existingUser = await UserModel.findUserByEmail(email);
            if(!existingUser){
                return res.status(400).json({success: false, message: "Email not registered; Sign-Up below"});
            }

            if(!existingUser.confirmed){
                return res.status(403).json({success: false, message: "Account not confirmed. Check email"});
            }

            const userId = await UserModel.getUserIdFromEmail(email);
            if(!userId){
                return res.status(400).json({success: false, message: "Email not registered; Sign-Up below"});
            }
            // check if password was incorrect
            const correctPassword = await UserModel.validatePassword(email, password);
            if(correctPassword){ 
                req.session.userId = userId;
                console.log(`${email} logged in`);
                return res.status(200).json({success: true, message:"Successful login", firstName: existingUser.firstName, lastName: existingUser.lastName, userUUID: existingUser.userUUID}); 
            } else {
                console.error("incorrect password")
                return res.status(401).json({success: false, message: "Incorrect password"});
            }
        }catch (error){
            return res.status(500).json({success: false, message: `Server Error: ${error}`});
        }
    },
    async profilePage(req, res){ // static. does not need UUID. just providing HTML
        const userUUID = req.params.userUUID;
        if(userUUID){ // are we attempting to view another user's profile?
            let userid;
            try {
                userId = await UserModel.getUserIdFromUUID(userUUID);    
            } catch (error){
                userId = undefined;
            }
            if(!userId){
                res.sendFile(path.join(__dirname, '..', 'public', '404.html'));
            }
        }
        res.sendFile(path.join(__dirname, '..', 'views', 'profile.html')); // automatically sets status to 200
    },
    async updateInfo(req,res){ // only possible for self
        try {
            let infoNumber = req.body.infoNumber;
            let text = req.body.text.length > 45 ? req.body.text.slice(0, 45) : req.body.text;
            if(!text){
                return res.status(400).json({success: false, message: "Text Error"});
            }
            text = ServerUtils.removeTabsAndNewlines(text);
            text = ServerUtils.removeSlurs(text);
            text = ServerUtils.sanitizeInput(text);
            let userId = req.session.userId;
            if(infoNumber < 0 || infoNumber > 3){
                return res.status(400).json({success: false, message: "Invalid Info Number"});
            }
            let column = ServerUtils.userInfoNumberToColumnName[infoNumber];
            const success = await UserModel.updateInfo(column,text,userId);
            if(success){
                return res.status(200).json({success: true, text:text});
            } else {
                return res.status(400).json({success: false, message: "Update Info Failure"});
            }
        } catch (error){
            return res.status(500).json({success: false, message: `Server Error: ${error}`});
        }
    }, 
    async getInfo(req,res){ // possible for self and others
        try {
            let userId = req.params.userUUID ? await UserModel.getUserIdFromUUID(req.params.userUUID) : req.session.userId;
            let values = await UserModel.getInfo(userId);
            if(values){
                return res.status(200).json({success: true, job:values.job, education:values.education, location:values.location, hometown:values.hometown});
            } else {
                return res.status(400).json({success: false, message: "Get Info Failure"});
            }
        } catch (error){
            return res.status(500).json({success: false, message: `Server Error: ${error}`});
        }
    },
    async getName(req,res){ // possible for self and others
        try {
            let userId = req.params.userUUID ? await UserModel.getUserIdFromUUID(req.params.userUUID) : req.session.userId;
            let values = await UserModel.getName(userId);
            let self = req.params.userUUID ? false : true; 
            if(values){
                return res.status(200).json({success: true, firstName:values.firstName, lastName:values.lastName, self:self});
            } else {
                return res.status(400).json({success: false, message: "Get Info Failure"});
            }
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success: false, message: `Server Error: ${error}`});
        }
    },
    async updateProfilePic(req,res){ // possible for self only
        try {
            let userId = req.session.userId;
            let oldProfilePic = await UserModel.getProfilePic(userId);
            let fileLocator = path.basename(req.file.path);
            if(oldProfilePic.profilePic != null && fileLocator != oldProfilePic.profilePic){ // if user never had profile pic, its null
                serverUtils.deleteFile(oldProfilePic.profilePic); // delete file
            }
            let success = await UserModel.updateProfilePic(userId, fileLocator);
            if(success){
                return res.status(200).json({success: true});
            } else {
                return res.status(400).json({success: false, message: "Update Profile Pic Failure"});
            }
        } catch (error){
            console.error(`updateProfilePic controller error: ${error.message}`);
            return res.status(500).json({success: false, message: `Server Error: ${error.message}`});
        }
    },
    async updateHeaderPic(req,res){ // possible for self only
        try {
            let userId = req.session.userId;
            let oldHeaderPic = await UserModel.getHeaderPic(userId);
            let fileLocator = path.basename(req.file.path);
            if(oldHeaderPic.headerPic != null && fileLocator != oldHeaderPic.headerPic){ // if user never had profile pic, its null
                serverUtils.deleteFile(oldHeaderPic.headerPic); // delete file
            }
            let success = await UserModel.updateHeaderPic(userId, fileLocator)
            if(success){
                return res.status(200).json({success: true});
            } else {
                return res.status(400).json({success: false, message: "Update Header Pic Failure"});
            }
        } catch (error){
            return res.status(500).json({success: false, message: `Server Error: ${error}`});
        }
    },
    async getProfileLocator(req,res){ // possible for self and others
        try {
            let userId = req.params.userUUID ? await UserModel.getUserIdFromUUID(req.params.userUUID) : req.session.userId;
            let values = await UserModel.getProfilePic(userId);
            if(values){
                return res.status(200).json({success: true, profilePic: values.profilePic});
            } else {
                return res.status(400).json({success: false, message: "Get Profile Pic Failure"});
            }
        } catch (error){
            return res.status(500).json({success: false, message: `Server Error: ${error}`});
        }
    },
    async getHeaderLocator(req,res){ // possible for self and others
        try {
            let userId = req.params.userUUID ? await UserModel.getUserIdFromUUID(req.params.userUUID) : req.session.userId;
            let values = await UserModel.getHeaderPic(userId);
            if(values){
                return res.status(200).json({success: true, headerPic: values.headerPic});
            } else {
                return res.status(400).json({success: false, message: "Get Header Pic Failure"});
            }
        } catch (error){
            return res.status(500).json({success: false, message: `Server Error: ${error}`});
        }
    },
    async UUIDMatchesUserId(req, res){ // checks if passed userUUID matches session user ID
        try {
            let userUUID = req.params.userUUID;
            let sessionUserId = req.session.userId;
            if(!userUUID){ // this is an ambiguous case. assume its false
                return res.status(200).json({success: true, self: false});
            }
            let userIdFromUUID = await UserModel.getUserIdFromUUID(userUUID);
            if(userIdFromUUID){
                if(userIdFromUUID == sessionUserId){
                    return res.status(200).json({success: true, self: true});
                } else {
                    return res.status(200).json({success: true, self: false});
                }
            } else {
                return res.status(400).json({success: false, message: "UUIDMatchesUserId faillure"});
            }

        } catch (error){
            return res.status(500).json({success: false, message: `Server Error: ${error}`});
        }
    },
    async deletePage(req, res){ // redirecting
        try {
            res.sendFile(path.join(__dirname, '..', 'views', 'deleteProfile.html')); // automatically sets status to 200
        } catch (error){
            return res.status(500).json({success: false, message: `Server Error: ${error}`});
        }
    },
    async delete(req, res){ // actual account deletion!
        try {
            let userId = req.session.userId;
            let password = req.body.password;
            let correctPassword = await UserModel.validatePasswordFromUserId(password, userId);
            // validate password
            if(!correctPassword){
                return res.status(401).json({success: false, message: "Incorrect Password"});
            }
            // destroy session
            req.session.destroy((err) => {
                if(err){                   
                    console.error(err.message);
                    return res.status(500).json({success: false, message: `Server Error: ${err.message}`});
                }
            });
            // delete profile/header pictures 
            const headerPic = await UserModel.getHeaderPic(userId);
            const profilePic = await UserModel.getProfilePic(userId);
            if(!headerPic || !profilePic){
                console.error("headerpic or profilepic returned from model as undefined");
                return res.status(500).json({success: false});
            }
            if(headerPic.headerPic){ // if user never saved one, its null!
                const deletedHeaderPic = await ServerUtils.deleteFile(headerPic.headerPic);
                if(!deletedHeaderPic){
                    console.error("header pic deletion failure!");
                    return res.status(500).json({success: false});
                }
            }
            if(profilePic.profilePic){ // if user never saved one, its null!
                const deletedProfilePic = await ServerUtils.deleteFile(profilePic.profilePic);
                if(!deletedProfilePic){
                    console.error("profile pic deletion failure!");
                    return res.status(500).json({success: false});
                }
            }
            // delete entry in user table
            const deletedUser = await UserModel.deleteUser(userId);
            if(!deletedUser){
                console.error("user deletion error");
                return res.status(500).json({success: false});
            }
            res.clearCookie('connect.sid'); 
            return res.redirect(302, '/');
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success: false, message: `Server Error: ${error}`});
        }
    },
    async logout(req,res){
        try{
            req.session.destroy((err) => {
                if(err){                   
                    console.error(err.message);
                    return res.status(500).json({success: false, message: `Server Error: ${err.message}`});
                }
            });
            res.clearCookie('connect.sid'); 
            return res.redirect(302, '/');
        } catch(error){
            console.error(error.message);
            return res.status(500).json({success: false});
        }
    },
    async searchUser(req,res){
        try {
            if(!req.body.text || req.body.text.length < 3){
                return res.status(400).json({success: false});
            }
            let text = req.body.text.trim().split(/\s+/)
            let firstName = text[0];
            let lastName = text.length > 1 ? text[1] : undefined;
            const users = await UserModel.searchUser(firstName, lastName);
            return res.status(200).json({success: true, users:users});
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success: false});
        }
    }

}

module.exports = UserController;