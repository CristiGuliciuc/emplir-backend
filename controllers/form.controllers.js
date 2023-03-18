const Forms = require("../db_access/form.db");
const User = require("../db_access/user.db");
const { v4: uuidv4 } = require('uuid');

exports.create = async (req, res) => {
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
      if (!fields[i].type || (
        fields[i].type != "Text" && fields[i].type != "Number" &&
        fields[i].type != "Decimal" && fields[i].type != "Date" &&
        fields[i].type != "Single-choice" &&
        fields[i].type != "Multiple-choice"))
        return res.status(400).json({ fieldIndex: i, msg: "Invalid field type. Valid types are: Text/Number/Decimal/Date/Single-choice/Multiple-choice" });
      if (!fields[i].mandatory /*|| typeof fields[i].mandatory != Boolean*/)
        return res.status(400).json({ fieldIndex: i, msg: "Invalid field mandatory. Should be a boolean" });
      if ((fields[i].type == "Multiple-choice" || fields[i].type == "Single-choice") &&
        (!fields[i].options || fields[i].options.length < 1))
        return res.status(400).json({ fieldIndex: i, msg: "Invalid field options. You should provide at least one option for single/multiple-choice field types" });
    };
    // validate sections
    for (let i = 0; i < sections; i++) {
      if (!sections[i].content || sections[i].content.length == 0 || sections[i].content > 20000)
        return res.status(400).json({ sectionIndex: i, msg: "Invalid section content: it cannot be empty nor contain more that 20000 chars" });
      if (sections[i].scanDocType && (sections[i].scanDocType.length == 0 || sections[i].scanDocType.length > 25))
        return res.status(400).json({ sectionIndex: i, msg: "Invalid scan doc type: cannot be empty nor contain more that 25 chars" });
    }

    console.log(req.user);
    const newForm = {
      type: "form",
      formId: uuidv4(),
      userId: req.rawHeaders[req.rawHeaders.indexOf('Authorization') + 1],
      title,
      dataRetentionPeriod,
      fields,
      sections,
      countSubmissions: "0"
    };

    await Forms.createFormItem(newForm);
    // not functional this part yet
    //  await User.increaseCountCreatedForms(newForm.userId);
    return res.status(201).send(newForm.formId.toString());

  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}

exports.update = async (req, res) => {
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
      if (!fields[i].type || (
        fields[i].type != "Text" && fields[i].type != "Number" &&
        fields[i].type != "Decimal" && fields[i].type != "Date" &&
        fields[i].type != "Single-choice" &&
        fields[i].type != "Multiple-choice"))
        return res.status(400).json({ fieldIndex: i, msg: "Invalid field type. Valid types are: Text/Number/Decimal/Date/Single-choice/Multiple-choice" });
      if (!fields[i].mandatory /*|| typeof fields[i].mandatory != Boolean*/)
        return res.status(400).json({ fieldIndex: i, msg: "Invalid field mandatory. Should be a boolean" });
      if ((fields[i].type == "Multiple-choice" || fields[i].type == "Single-choice") &&
        (!fields[i].options || fields[i].options.length < 1))
        return res.status(400).json({ fieldIndex: i, msg: "Invalid field options. You should provide at least one option for single/multiple-choice field types" });
    };
    // validate sections
    for (let i = 0; i < sections; i++) {
      if (!sections[i].content || sections[i].content.length == 0 || sections[i].content > 20000)
        return res.status(400).json({ sectionIndex: i, msg: "Invalid section content: it cannot be empty nor contain more that 20000 chars" });
      if (sections[i].scanDocType && (sections[i].scanDocType.length == 0 || sections[i].scanDocType.length > 25))
        return res.status(400).json({ sectionIndex: i, msg: "Invalid scan doc type: cannot be empty nor contain more that 25 chars" });
    }

    const newForm = {
      title,
      dataRetentionPeriod,
      fields,
      sections,
    };

    await Forms.updateFormItem(newForm, req.query.formId, "all");
    return res.status(201).send("Form update successful!");
  }
  catch (err) {
    return res.status(500), send({ message: err.message });
  }
}

//Get all forms by userId
exports.findAll = async (req, res) => {
  try {
    let forms = {};
    const userId = req.rawHeaders[req.rawHeaders.indexOf('Authorization') + 1];
    forms = await Forms.findAll(userId);
    return res.status(200).send(forms);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

//Get form by userId and formId
exports.findOne = async (req, res) => {
  try {
    let forms = {};
    const userId = req.rawHeaders[req.rawHeaders.indexOf('Authorization') + 1];
    const formId = req.query.formId;
    forms = await Forms.findOne(userId, formId);
    return res.status(200).send(forms);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

// Delete a form by userId and formId
exports.delete = async (req, res) => {
  try {
    const userId = req.rawHeaders[req.rawHeaders.indexOf('Authorization') + 1];
    const formIdToDelete = req.query.formId;
    await Forms.deleteFormItem(userId, formIdToDelete);
    return res.status(200).send(`Form with id: ${formIdToDelete} was delete successful!`)
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};