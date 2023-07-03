const Forms = require("../db_access/form.db");
const User = require("../db_access/user.db");
const FormRecognizer = require("../formRecognizer/formRecognizer");
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
    if (title.length < 3 || title.length > 255)
      return res.status(400).json({ msg: "Invalid title: minimum 3 and maximum 255 characters" });
    if (isNaN(dataRetentionPeriod))
      return res.status(400).json({ msg: "Invalid data retention period: should be a number 1-60" });
    if (dataRetentionPeriod < 1 || dataRetentionPeriod > 60)
      return res.status(400).json({ msg: "Invalid data retention period: should be a number 1-60" });
    //validate fields
    if(fields.length == 0)
      return res.status(400).json({ msg: "Invalid fields: form should have at least one field" });
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label || fields[i].label.length < 1 || fields[i].label.length > 20)
        return res.status(400).json({ fieldIndex: i, msg: "Invalid field label" });
      if (!fields[i].placeholder || fields[i].placeholder.length < 1 || fields[i].placeholder.length > 20)
        return res.status(400).json({ fieldIndex: i, msg: "Invalid field placeholder" });
      if (!fields[i].type || (
        fields[i].type != "Text" && fields[i].type != "Number" &&
        fields[i].type != "Decimal" && fields[i].type != "Date" &&
        fields[i].type != "Single-choice" &&
        fields[i].type != "Multiple-choice"))
        return res.status(400).json({ fieldIndex: i, msg: "Invalid field type. Valid types are: Text/Number/Decimal/Date/Single-choice/Multiple-choice" });
      // if (!fields[i].isMandatory || typeof fields[i].isMandatory != Boolean)
      //   return res.status(400).json({ fieldIndex: i, msg: "Invalid field mandatory. Should be a boolean" });
      if ((fields[i].type == "Multiple-choice" || fields[i].type == "Single-choice") &&
        (!fields[i].options || fields[i].options.length < 1))
        return res.status(400).json({ fieldIndex: i, msg: "Invalid field options. You should provide at least one option for single/multiple-choice field types" });
    };
    // validate sections
    if(sections.length == 0)
      return res.status(400).json({ msg: "Invalid sections: form should have at least one section" });
    for (let i = 0; i < sections; i++) {
      if (!sections[i].content || sections[i].content.length == 0 || sections[i].content > 20000)
        return res.status(400).json({ sectionIndex: i, msg: "Invalid section content: it cannot be empty nor contain more that 20000 chars" });
      if (sections[i].scanDocType && (sections[i].scanDocType.length == 0 || sections[i].scanDocType.length > 25))
        return res.status(400).json({ sectionIndex: i, msg: "Invalid scan doc type: cannot be empty nor contain more that 25 chars" });
    }

    // check if maximum forms for subscription type have been reached
    const user = await User.getUserById(req.user.id);
    if(user && user.countCreatedForms == user.subscription.maxForms)
    {
        return res.status(400).json({ msg: `Maximum forms ${user.subscription.maxForms} created. Upgrade your subscription plan to create more forms`});
    }

    const newForm = {
      type: "form",
      formId: uuidv4(),
      userId: req.user.id,
      title,
      dataRetentionPeriod,
      fields,
      sections,
      countSubmissions: "0"
    };

    let created = await Forms.createFormItem(newForm);
    if(created)
    {
      await User.increaseCountCreatedForms(newForm.userId);
      return res.status(201).send(newForm.formId.toString());
    }
    else 
      return res.status(400).send({message: "Couldn't create new form"});

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
    if (title.length < 3 || title.length > 255)
      return res.status(400).json({ msg: "Invalid title: minimum 3 and maximum 255 characters" });
    if (isNaN(dataRetentionPeriod))
      return res.status(400).json({ msg: "Invalid data retention period: should be a number 1-60" });
    if (dataRetentionPeriod < 1 || dataRetentionPeriod > 60)
      return res.status(400).json({ msg: "Invalid data retention period: should be a number 1-60" });
    // validate fields
    if(fields.length == 0)
      return res.status(400).json({ msg: "Invalid fields: form should have at least one field" });
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label || fields[i].label.length < 1 || fields[i].label.length > 20)
        return res.status(400).json({ fieldIndex: i, msg: "Invalid field label" });
      if (!fields[i].placeholder || fields[i].placeholder.length < 1 || fields[i].placeholder.length > 20)
        return res.status(400).json({ fieldIndex: i, msg: "Invalid field placeholder" });
      if (!fields[i].type || (
        fields[i].type != "Text" && fields[i].type != "Number" &&
        fields[i].type != "Decimal" && fields[i].type != "Date" &&
        fields[i].type != "Single-choice" &&
        fields[i].type != "Multiple-choice"))
        return res.status(400).json({ fieldIndex: i, msg: "Invalid field type. Valid types are: Text/Number/Decimal/Date/Single-choice/Multiple-choice" });
      // if (!fields[i].isMandatory || typeof fields[i].isMandatory != Boolean)
      //   return res.status(400).json({ fieldIndex: i, msg: "Invalid field mandatory. Should be a boolean" });
      if ((fields[i].type == "Multiple-choice" || fields[i].type == "Single-choice") &&
        (!fields[i].options || fields[i].options.length < 1))
        return res.status(400).json({ fieldIndex: i, msg: "Invalid field options. You should provide at least one option for single/multiple-choice field types" });
    };
    // validate sections
    if(sections.length == 0)
      return res.status(400).json({ msg: "Invalid sections: form should have at least one section" });
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
    const userId = req.user.id;
    forms = await Forms.findAll(userId);
    return res.status(200).send(forms);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

//Get form by userId and formId
exports.findOne = async (req, res) => {
  try {
    let form = {};
    const userId = req.user.id;
    const formId = req.query.formId;
    form = await Forms.findOne(userId, formId);
    if(!form)
      return res.status(404).send(`Form not found`)
    return res.status(200).send(form);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

// Delete a form by userId and formId
exports.delete = async (req, res) => {
  try {
    const userId = req.user.id;
    const formIdToDelete = req.query.formId;
    let deleted = await Forms.deleteFormItem(userId, formIdToDelete);
    if(deleted){
      await User.decreaseCountCreatedForms(userId);
      return res.status(200).send(`Form with id: ${formIdToDelete} was deleted successful!`);
    } else return res.status(400).send(`Form with id: ${formIdToDelete} couldn't be deleted!`);

  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

exports.fillForm = async (req, res) => {
  try {
    let {
      fields,
      documentImg
    } = req.body;

    // fill the fields values 
    const keyValuePairs = await FormRecognizer.processFormUrl(documentImg);
    if(! keyValuePairs || keyValuePairs.length == 0) return res.status(200).send(fields);

    // check if any of the documentKeyword for each field is found in the extracted data
    for(let i=0; i< fields.length; i++){
      for(let j=0; j< fields[i].documentKeywords.length; j++){
        for(let k = 0; k<keyValuePairs.length; k++){
          let normalized = keyValuePairs[k].key.content.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          let upperCaseKey = normalized.toUpperCase();
          let upperCaseKeyword = fields[i].documentKeywords[j].toUpperCase();
          //if(keyValuePairs[k].key.content.includes(fields[i].documentKeywords[j]))
          if(upperCaseKey.includes(upperCaseKeyword) && keyValuePairs[k].value)
            fields[i].value = keyValuePairs[k].value.content;
        }
      }
    }
    
    return res.status(200).send(fields);

    // return res.status(400).send({message: "Couldn't create new form"});

  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}