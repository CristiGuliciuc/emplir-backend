const databaseConfig = require("../config/database.config");
const Database = require("./setup.db");
const { v4: uuidv4 } = require('uuid');
const Forms = require("../db_access/form.db");

const formsContainerId = databaseConfig.formsContainer.id
const client = Database.client;

async function findAll(formId) {
    try {
        console.log(`Get all submissions forms for form with id: ${formId}`);

        const querySpec = {
            query: `SELECT { 
            "submissionId": r.submissionId,
            "date": r.date,
            "fields": r.fields
        } FROM root r WHERE r.formId = @formId and r.type='submission'`,
            parameters: [
                { name: '@formId', value: formId }
            ]
        };

        const { resources: submissions } = await client
            .database(Database.databaseId)
            .container(formsContainerId)
            .items.query(querySpec)
            .fetchAll();

        if (submissions.length > 0) {
            const modifiedSubmissions = submissions.map((submission) => {
                const fields = submission.$1.fields.length > 5 ? submission.$1.fields.slice(0, 5) : submission.$1.fields;
                return { submissionId: submission.$1.submissionId, date: submission.$1.date, fields };
            });
            return modifiedSubmissions;
        } else {
            console.log(`Submissions with formid: ${formId} was not found in ${formsContainerId} container!`);
            return null;
        }
    } catch (err) {
        console.log(`Error in findAllSubmissions: ${err.message}`);
        return null;
    }
}

async function insert(itemBody) {
    try {
        // add submissions 
        const sections = itemBody.sections.map((section) => {
            return {
                ...section,
                sectionId: uuidv4()
            };
        });
        const filds = itemBody.fields.map((field) => {
            return {
                ...field,
                fieldId: uuidv4()
            };
        });

        itemBody.sections = sections;
        itemBody.fields = filds;

        const { item } = await client
            .database(Database.databaseId)
            .container(formsContainerId)
            .items.upsert(itemBody)

        console.log(`Insert submissions with id: ${itemBody.submissionId}`);

        // increment submissionsCount for form with formId
        const increment = {
            incrementValue: 1,
          };
        Forms.updateFormItem(increment, itemBody.formId, "incrementSubmissionsCount");
    } catch (err) {
        console.log("In forms.db: " + err.message);
    }
}

module.exports = {
    findAll,
    insert
};