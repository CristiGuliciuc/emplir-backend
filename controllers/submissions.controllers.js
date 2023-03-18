const Forms = require("../db_access/form.db");
const Submissions = require("../db_access/submissions.db");
const { v4: uuidv4 } = require('uuid');

// Get all submissions forms by formId
exports.findAll = async (req, res) => {
  try {
    let forms = {};
    const formId = req.query.formId;
    forms = await Submissions.findAll(formId);
    return res.status(200).send(forms);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

// insert submission 
exports.insert = async (req, res) => {
  try {
    const {
      title,
      dataRetentionPeriod,
      fields,
      sections,
    } = req.body;

    // VALIDATIONS
    if (title < 3 && title > 255)
      return res.status(400).json({ msg: "Invalid title: minimum 3 and maximum 255 characters" });
    if (isNaN(dataRetentionPeriod))
      return res.status(400).json({ msg: "Invalid data retention period: should be a number 1-60" });
    if (dataRetentionPeriod < 1 || dataRetentionPeriod > 60)
      return res.status(400).json({ msg: "Invalid data retention period: should be a number 1-60" });
    // validate fields
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].placeholder || fields[i].placeholder.length < 1 || fields[i].placeholder.length > 20)
        return res.status(400).json({ fieldIndex: i, msg: "Invalid field placeholder" });
      // validate values
      if(fields[i].mandatory && !fields[i].value )
        return res.status(400).json({ fieldIndex: i, msg: "Field is mandatory" });
      if((fields[i].type == "Number" || fields[i].type == "Decimal") && fields[i].value.isNaN)
        return res.status(400).json({ fieldIndex: i, msg: "Field should be a number" });
    };
    // validate sections
    for (let i = 0; i < sections; i++) {
      if (!sections[i].content || sections[i].content.length == 0 || sections[i].content > 20000)
        return res.status(400).json({ sectionIndex: i, msg: "Invalid section content: it cannot be empty nor contain more that 20000 chars" });
    }

    // get current data in the format "YYYY-MM-DD"
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // add padding zero if needed
    const day = currentDate.getDate().toString().padStart(2, '0'); // add padding zero if needed

    const newSubmission = {
      type: "submission",
      submissionId: uuidv4(),
      formId: req.query.formId,
   //   userId: req.userId,
      title,
      dataRetentionPeriod,
      data: `${year}-${month}-${day}`,
      fields,
      sections,
    };

    await Submissions.insert(newSubmission);
    return res.status(201).send(newSubmission.submissionId.toString());
  }
  catch (err) {
    return res.status(500), send({ message: err.message });
  }
};

// Delete a form by userId and formId
exports.delete = async (req, res) => {
  try {
    const userId = req.user.id;
    const formId = req.query.formId;
    const submissionIdToDelete = req.query.submissionId;
    await Submissions.deleteSubmissionItem(userId, formId, submissionIdToDelete);
    return res.status(200).send(`Submission with id: ${submissionIdToDelete} was delete successful!`)
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

//Get form by userId and formId
exports.findForm = async (req, res) => {
  try {
    let forms = {};
    const userId = req.user.id;
    const formId = req.query.formId;
    const form = await Forms.findOne(userId, formId);
    if (form)
      return res.status(200).send();
    else
      return res.status(400).json({ msg: `Form whit id: ${formId} doesn't  exist` });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};
