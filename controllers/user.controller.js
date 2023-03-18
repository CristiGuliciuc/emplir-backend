const jwt = require("jsonwebtoken");
const User = require("../db_access/user.db");
const { v4: uuidv4 } = require('uuid');
require("dotenv").config();

exports.create = async (req, res) => {
  try {
      const {
        accountType,
        accountName,
        fiscalCode,
        address,
        emailAddress,
        password,
        subscription
      } = req.body;
  
      //VALIDATIONS
      if(accountType != "Individual" && accountType != "Company" && accountType != "Public Institution")
      return res.status(400).json({ msg: "Invalid account type. Valid options are: Individual/Company/Public Institution" });
      if(accountName.length == 0 || accountName.length > 20 )
        return res.status(400).json({ msg: "Invalid accountName: maximum 20 characters" });
      const userExists = await User.accountNameExists(accountName);
      if(userExists)
        return res.status(400).json({ msg: "Invalid accountName: account name is already used "});
      if(accountType=="Company" && fiscalCode.length<0)
        return res.status(400).json({ msg: "Invalid fiscalCode: Company account require fiscal code "});
      if(address.length < 10 || address.length > 50)
        return res.status(400).json({ msg: "Invalid address: minimum 10 and maximum 50 characters" });
      const emailExists = await User.emailExists(emailAddress);
      if(emailExists)
        return res.status(400).json({ msg: "Invalid email: This email is already used" });
      var regex = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
      if (!regex.test(emailAddress) || emailAddress.length > 50) {
        return res.status(400).send({ message: "Invalid email format" });
      }
      if(password.length < 8 && password.length> 20)
        return res.status(400).json({ msg: "Invalid password: minimum 8 and maximum 20 characters" });
      // !! To add: bcrypt for password
  
      const newUser = {
        type : "user",
        userId : uuidv4(),
        accountType,
        accountName,
        fiscalCode,
        address,
        emailAddress,
        password,
        subscription,
        countCreatedForms : "0"
      };
     
      await User.createUserItem(newUser);
      return res.status(201).send(newUser.userId.toString());
  } catch (err) {
      return res.status(500).send({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try{
    const {
      emailAddress,
      password
    } = req.body;
    const user = await User.getUser(emailAddress);
    if(! user)
      return res.status(400).json({accessToken: null, msg: "There's no account for this email" });
    if(password != user.password)
      return res.status(400).json({ accessToken: null, msg: "Incorrect password" });
    // user data that will be sent to frontend
    const tokenUser = {id: user.userId};
    let accessToken = jwt.sign(tokenUser, process.env.ACCESS_SECRET_TOKEN, {
      expiresIn: "1d",
    });
    let refreshToken = jwt.sign(tokenUser, process.env.REFRESH_SECRET_TOKEN, {
      expiresIn: "7d",
    });
    return res.status(201).json({
      accessToken: accessToken,
      refreshToken: refreshToken,
      accountType: user.accountType,
      accountName: user.accountName,
      emailAddress: user.emailAddress,
    });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

// Refresh token controller - used when access token expires
exports.refreshToken = (req, res) => {
  try {
    const refreshToken = req.cookies.refresh;
    if (!refreshToken)
      return res.status(403).json({ msg: "You must log in or register" });
  
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err)
        return res.status(403).json({ msg: "You must log in or register" });
    
      const tokenUser = { id: user.userId };
      const accessToken = jwt.sign(tokenUser, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
    
      return res.status(201).json({ accessToken: accessToken });
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// exports.getUser = async (req, res) => {
//   try {
//     let user = {};
//     const userId = req.rawHeaders[req.rawHeaders.indexOf('Authorization') + 1];
//     user = await Forms.getUserProfile(userId);
//     return res.status(200).send(user);
//   } catch (err) {
//     return res.status(500).send({ message: err.message });
//   }
// };