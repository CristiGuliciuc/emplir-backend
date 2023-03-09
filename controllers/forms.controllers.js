const Forms = require("../db_access/forms.db");

//Get all forms by userId
exports.findAll = async (req, res) => {
  try {
    let forms = {};
    const userId = req.query.userId;
    forms = await Forms.findAll(userId);
    return res.status(200).send(forms);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};