const databaseConfig = require("../config/database.config");
const Database = require("./setup.db");
const { v4: uuidv4 } = require('uuid');
const Forms = require("../db_access/form.db");

const formsContainerId = databaseConfig.formsContainer.id
const usersContainerId = databaseConfig.usersContainer.id
const client = Database.client;

async function findAll(formId) {
    try {
        console.log(`Get all submissions forms for form with id: ${formId}`);

        const querySpec = {
            query: `SELECT { 
            "submissionId": r.submissionId,
            "data": r.data,
            "fields": r.fields,
            "sections": r.sections
        } FROM root r WHERE r.formId = @formId and r.type='submission'`,
            parameters: [
                { name: '@formId', value: formId }
            ]
        };

        const { resources: results } = await client
            .database(Database.databaseId)
            .container(formsContainerId)
            .items.query(querySpec)
            .fetchAll();

        // if (submissions.length > 0) {
        //     return submissions;
        // } else {
        //     console.log(`Submissions with formid: ${formId} was not found in ${formsContainerId} container!`);
        //     return null;
        // }
        let forms = [];
        for( let i =0 ; i< results.length; i++)
        {
            forms[i] = results[i]['$1'];
        }
        return forms;
    } catch (err) {
        console.log(`Error in findAllSubmissions: ${err.message}`);
        return null;
    }
}

async function insert(itemBody) {
    try {
        const database = client.database(Database.databaseId);
        const container = database.container(formsContainerId);
        const { resources: forms } = await container.items.readAll().fetchAll();
        let form = forms.filter((t) => t.formId == itemBody.formId /*&& t.userId == itemBody.userId*/ && t.type == "form");
        if (form.length > 0) {
            const { item } = await client
                .database(Database.databaseId)
                .container(formsContainerId)
                .items.upsert(itemBody)
            if (item) {
                console.log(`Insert submissions with id: ${itemBody.submissionId}`);
                // increment submissionsCount for form with formId
                const submissionsCount = {
                    incrementValue: 1,
                };
                Forms.updateFormItem(submissionsCount, itemBody.formId, "incrementCountSubmissions");
            } else {
                console.log(`Insert submission have failed`);
            }
        } else {
            console.log(`Form whit id: ${itemBody.formId} don't exists to create a submissions`);
            throw new Error(`Form with id: ${itemBody.formId} doesn't exist to create submissions`);
        }
    } catch (err) {
        console.log("In forms.db: " + err.message);
    }
}

async function deleteSubmissionItem(userId, formId, submissionIdToDelete) {

    return await Forms.deleteSubmissions(userId, formId, submissionIdToDelete);
}

module.exports = {
    findAll,
    insert,
    deleteSubmissionItem,
};
