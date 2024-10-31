const UserModel = require("../models/UserModel.js")

const UserController = {
    async registerUser(req, res){
        const { firstName, lastName, email, password, confirmedPassword, birthday } = req.body;
        try {

            // check if any forms were left empty
            if(!firstName || !lastName || !email || !password || !birthday){
                return res.status(400).json({success: false, message:"All fields are required"});
            }

            // check if this email is already registered
            const existingUser = await UserModel.findUserByEmail(email);
            if(existingUser){
                return res.status(400).json({success: false, message: "Email already registered"});
            }

            // check if password and confirmed password match
            if(confirmedPassword !== password){
                return res.status(400).json({success: false, message:"Passwords do not match"});
            }

            // register new user if no issues found!
            const newUser = await UserModel.createUser(req.body);
            return res.status(201).json({success: true, message:"User registered successfully", user: newUser}); 
        } catch (error){
            console.error("Error registering user: ", error);
            return res.status(500).json({success: false, message: "Server Error"});
        }
    },
    async loginUser(req, res){
        const {email,password} = req.body;
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
            // todo check if password was incorrect
            const correctPassword = await UserModel.validatePassword(email, password);
            if(correctPassword){
                return res.status(200).json({success: true, message:"Successful login"}); 
            } else {
                return res.status(401).json({success: false, message: "Incorrect password"});
            }
        }catch (error){
            return res.status(500).json({success: false, message: "Server Error"});
        }
    }
}

module.exports = UserController;