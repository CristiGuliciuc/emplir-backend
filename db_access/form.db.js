const databaseConfig = require("../config/database.config");
const Database = require("./setup.db");

const usersContainerId = databaseConfig.usersContainer.id
const formsContainerId = databaseConfig.formsContainer.id

const client = Database.client;

async function createFormItem(itemBody) {
    try {
        console.log(`Created form with id:\n${itemBody.formId}\n`);
        const { item1 } = await client
            .database(Database.databaseId)
            .container(usersContainerId)
            .items.upsert(itemBody)

        // const { item2 } = await client
        //     .database(Database.databaseId)
        //     .container(formsContainerId)
        //     .items.upsert(itemBody)

        console.log(`Created form with id:\n${itemBody.formId}\n`);
    } catch (err) {
        console.log("In forms.db: " + err.message);
    }
}

async function updateFormItem(itemBody, formIdToUpdate, typeUpdate) {
    try {
        await updateFormContainer(formsContainerId, itemBody, formIdToUpdate, typeUpdate);
        await updateFormContainer(usersContainerId, itemBody, formIdToUpdate, typeUpdate);
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
    switch (typeUpdate) {
        case "all":
            form.title = itemBody.title;
            form.dataRetentionPeriod = itemBody.dataRetentionPeriod;
            form.fields = itemBody.fields;
            form.sections = itemBody.sections;
            break;
        case "incrementCountSubmissions":
            form.countSubmissions = (parseInt(form.countSubmissions) + itemBody.incrementValue).toString();
            break;
        case "decrementCountSubmissions":
            form.countSubmissions = (parseInt(form.countSubmissions) - itemBody.decrementValue).toString();
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
            "countSubmissions": r.countSubmissions 
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
            "countSubmissions": r.countSubmissions,
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
    deleteSubmissions(userId, formIdToDelete, null);
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
async function deleteSubmissions(userId, formId, submissionId) {
    try {
        const database = client.database(Database.databaseId);
        const container = database.container(formsContainerId);

        const { resources: submissions } = await container.items.readAll().fetchAll();
        let submissionsToDelete;

        if (submissionId) {
            submissionsToDelete = submissions.filter((t) => t.formId == formId && t.userId == userId && t.submissionId == submissionId && t.type == "submission");
        } else {
            submissionsToDelete = submissions.filter((t) => t.formId == formId && t.userId == userId && t.type == "submission");
        }

        if (submissionsToDelete.length > 0) {
            const submissionsCount = {
                decrementValue: 0,
            };
            for (const submission of submissionsToDelete) {
                await container.item(submission.id, submission.formId).delete();
                submissionsCount.decrementValue++;
                console.log(`Submission with id: ${submission.id} was deleted successfully from ${formsContainerId} container!`);
            }

            // decrement submissionsCount for form with formId
            await updateFormItem(submissionsCount, formId, "decrementCountSubmissions");
        } else {
            console.log(`No submissions with formid: ${formId} and userid: ${userId} were found in ${formsContainerId} container!`);
        }
    } catch (error) {
        console.error("Error deleting submissions:", error);
    }
}
module.exports = {
    findAll,
    createFormItem,
    updateFormItem,
    deleteSubmissions,
    findOne,
    deleteFormItem,
};