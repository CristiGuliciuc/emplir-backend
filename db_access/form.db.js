const databaseConfig = require("../config/database.config");
const Database = require("./setup.db");

const usersContainerId = databaseConfig.usersContainer.id
const formsContainerId = databaseConfig.formsContainer.id
const usersContainerPartitionKey = { kind: 'Hash', paths: ['/userId'] }
const formsContainerPartitionKey = { kind: 'Hash', paths: ['/formId'] }

const client = Database.client;

async function createFormItem(itemBody) {
    try {
        console.log(`Created form with id:\n${itemBody.formId}\n`);
        const { item } = await client
            .database(Database.databaseId)
            .container(usersContainerId)
            .items.upsert(itemBody)
        // should add it to both forms and users container; for now it is only in the users container
        console.log(`Created form with id:\n${itemBody.formId}\n`);
    } catch (err) {
        console.log("In forms.db: " + err.message);
    }
}

async function updateFormItem(itemBody, formIdToUpdate, typeUpdate) {
    try {
        updateFormContainer(formsContainerId, itemBody, formIdToUpdate, typeUpdate);
        updateFormContainer(usersContainerId, itemBody, formIdToUpdate, typeUpdate);
    } catch (error) {
        console.error("Error updating form in containers:", error);
    }
}
async function updateFormContainer(containerId, itemBody, formIdToUpdate, typeUpdate) {
    try {
        const database = client.database(Database.databaseId);
        const container = database.container(containerId);
        const { resources: containerResources } = await container.items.readAll().fetchAll();
        const form = containerResources.find((t) => t.formId == formIdToUpdate && t.type == "form");

        if (form) {
            updateForm(form, itemBody, typeUpdate);
            const { resource: formUpdate } = await container.items.upsert(form);

            if (formUpdate) {
                console.log(`Form with id: ${formIdToUpdate} was updated successfully in ${containerId} container!`);
            } else {
                console.log(`Error updating form with id: ${formIdToUpdate} in ${containerId} container!`);
            }
        } else {
            console.log(`Form with id: ${formIdToUpdate} was not found in ${containerId} container!`);
        }
    } catch (error) {
        console.error(`Error updating form item in ${containerId} container:`, error);
    }
}

function updateForm(form, itemBody, typeUpdate) {
    switch(typeUpdate) {
      case "all": 
        form.title = itemBody.title;
        form.dataRetentionPeriod = itemBody.dataRetentionPeriod;
        form.fields = itemBody.fields;
        form.sections = itemBody.sections;
        break;
      case "incrementSubmissionsCount":
        form.countSubmissions = (parseInt(form.countSubmissions) + itemBody.incrementValue).toString();
        break;
      default:
        console.log(`Unsupported typeUpdate value: ${typeUpdate}`);
    }
  }
  
async function findAll(userId) {
    try {
        console.log(`Get all forms for user whit id:${userId}`);
        const querySpec = {
            query: `SELECT { 
            "formId": r.formId,
            "title": r.title,
            "dataRetentionPeriod": r.dataRetentionPeriod,
            "submissionsCount": r.submissionsCount 
        } FROM root r WHERE r.userId = @userId`,
            parameters: [
                { name: '@userId', value: `${userId}` }
            ]
        }
        const { resources: results } = await client
            .database(Database.databaseId)
            .container(usersContainerId)
            .items.query(querySpec)
            .fetchAll()

        if (results.length > 0)
            return results;
        else
            return null;

    } catch (err) {
        console.log("In forms.db: " + err.message);
    }
}

async function findOne(userId, formId) {
    try {
        console.log(`Get complete date for form whit id:${formId} and user whit id:${userId}`);
        const querySpec = {
            query: `SELECT { 
            "formId": r.formId,
            "title": r.title,
            "dataRetentionPeriod": r.dataRetentionPeriod,
            "submissionsCount": r.submissionsCount,
            "fields": r.fields,
            "sections": r.sections
        } FROM root r WHERE r.userId = @userId AND r.formId = @formId`,
            parameters: [
                { name: '@userId', value: `${userId}` },
                { name: '@formId', value: `${formId}` }
            ]
        }
        const { resources: results } = await client
            .database(Database.databaseId)
            .container(usersContainerId)
            .items.query(querySpec)
            .fetchAll()

        if (results.length > 0)
            return results;
        else return null;
    } catch (err) {
        console.log("In forms.db: " + err.message);
    }
}

async function deleteFormItem(userId, formIdToDelete) {
    deleteForm(userId, formIdToDelete, formsContainerId);
    deleteForm(userId, formIdToDelete, usersContainerId);
    deleteSubmissionsRelatedToForm(userId, formIdToDelete);
}
async function deleteForm(userId, formIdToDelete, containerId) {
    try {
        const database = client.database(Database.databaseId);
        const container = database.container(containerId);
        const { resources: forms } = await container.items.readAll().fetchAll();
        const form = forms.find((t) => t.formId == formIdToDelete && t.userId == userId && t.type == "form");

        if (form) {
            if (containerId == usersContainerId)
                await container.item(form.id, form.userId).delete();
            else
                await container.item(form.id, form.formId).delete();
            console.log(`Form with id: ${formIdToDelete} was deleted successfully from ${containerId} container!`);
        } else {
            console.log(`Form with id: ${formIdToDelete} was not found in ${containerId} container!`);
        }

    } catch (error) {
        console.error("Error deleting form:", error);
    }
}
async function deleteSubmissionsRelatedToForm(userId, formId) {
    try {
        const database = client.database(Database.databaseId);
        const container = database.container(formsContainerId);
        const { resources: submissions } = await container.items.readAll().fetchAll();
        const submissionsToDelete = submissions.filter((t) => t.formId == formId && t.userId == userId && t.type == "submission");

        if (submissionsToDelete.length > 0) {
            for (const submission of submissionsToDelete) {
                await container.item(submission.id, submission.formId).delete();
                console.log(`Submission with id: ${submission.id} was deleted successfully from ${formsContainerId} container!`);
            }
        } else {
            console.log(`No submissions with formid: ${formId} were found in ${formsContainerId} container!`);
        }

    } catch (error) {
        console.error("Error deleting submissions:", error);
    }
}

module.exports = {
    findAll,
    createFormItem,
    updateFormItem,
    findOne,
    deleteFormItem
};