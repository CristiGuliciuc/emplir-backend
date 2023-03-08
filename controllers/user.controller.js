const User = require("../db_access/user.db");
const { v4: uuidv4 } = require('uuid');

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