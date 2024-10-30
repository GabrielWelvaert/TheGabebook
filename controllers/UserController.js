const UserModel = require("../models/UserModel.js")

const UserController = {
    async registerUser(req, res){
        console.log("entered registerUser() in UserController.js")
        const { firstName, lastName, email, password, birthday } = req.body;
        if(!firstName || !lastName || !email || !password || !birthday){
            return res.status(400).json({success: false, message:"All fields are required"});
        }
        try {
            const existingUser = await UserModel.findUserByEmail(email);
            if (existingUser){
                return res.status(400).json({success: false, message: "Email already registered"});
            }

            const newUser = await UserModel.createUser(req.body);
            return res.status(201).json({success: true, message:"User registered successfully", user: newUser}); 
        } catch (error){
            console.error("Error registering user: ", error);
            return res.status(500).json({success: false, message: "Server Error"});
        }
    }
}

module.exports = UserController;