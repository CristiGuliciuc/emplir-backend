const CosmosClient = require('@azure/cosmos').CosmosClient;
const databaseConfig = require("../config/database.config");
const Database = require("./setup.db");

// !!! should also add a FORMS container
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

async function updateFormItem(updatedForm, formIdToUpdate) {
    try {
        const database = client.database(Database.databaseId);

        // update form in forms container
        const formsContainer = database.container(formsContainerId);
        const { resources: formsFormsContainer } = await formsContainer.items.readAll().fetchAll();
        const formFormsContainer = formsFormsContainer.find((t) => t.formId == formIdToUpdate);
        if (formFormsContainer) {
            updateForm(formFormsContainer, updatedForm);
            const { resource: updatedFormFormsContainer } = await formsContainer.items.upsert(formFormsContainer);
            if (updatedFormFormsContainer) {
                console.log(`Form with id: ${formIdToUpdate} was updated successfully in ${formsContainerId} container!`);
            } else {
                console.log(`Error updating form with id: ${formIdToUpdate} in form container!`);
            }
        } else {
            console.log(`Form with id: ${formIdToUpdate} was not found in ${formsContainerId} container!`);
        }

        // update form in users container
        const usersContainer = database.container(usersContainerId);
        const { resources: formsUserContainer } = await usersContainer.items.readAll().fetchAll();
        const formUsersContainer = formsUserContainer.find((t) => t.formId == formIdToUpdate);
        if (formUsersContainer) {
            updateForm(formUsersContainer, updatedForm);
            const { resource: updatedFormUsersContainer } = await usersContainer.items.upsert(formUsersContainer);

            if (updatedFormUsersContainer) {
                console.log(`Form with id: ${formIdToUpdate} was updated successfully in ${usersContainerId} container!`);
            } else {
                console.log(`Error updating form with id: ${formIdToUpdate} from ${usersContainerId} container!`);
            }
        } else {
            console.log(`Form with id: ${formIdToUpdate} was not found in ${usersContainerId} container!`);
        }
    } catch (error) {
        console.error("Error updating form item:", error);
    }
}

function updateForm(containerItem, updatedForm) {
    containerItem.title = updatedForm.title;
    containerItem.dataRetentionPeriod = updatedForm.dataRetentionPeriod;
    containerItem.fields = updatedForm.fields;
    containerItem.sections = updatedForm.sections;
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
            return JSON.stringify(results);
        else return null;
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
    try {
        const database = client.database(Database.databaseId);

        // delete form from forms container
        const formsContainer = database.container(formsContainerId);
        const { resources: formsFormsContainer } = await formsContainer.items.readAll().fetchAll();
        const formFormsContainer = formsFormsContainer.find((t) => t.formId == formIdToDelete && t.userId == userId);
        if (formFormsContainer) {
            await formsContainer.item(formFormsContainer.id, formFormsContainer.formId).delete();
            console.log(`Form with id: ${formIdToDelete} was deleted successfully from ${formsContainerId} container!`);
        } else {
            console.log(`Form with id: ${formIdToDelete} was not found in ${formsContainerId} container!`);
        }

        // delete form from forms container
        const usersContainer = database.container(usersContainerId);
        const { resources: formsUsersContainer } = await usersContainer.items.readAll().fetchAll();
        const formUsersContainer = formsUsersContainer.find((t) => t.formId == formIdToDelete && t.userId == userId);
        if (formUsersContainer) {
            await usersContainer.item(formUsersContainer.id, formUsersContainer.userId).delete();
            console.log(`Form with id: ${formIdToDelete} was deleted successfully from ${usersContainerId} container!`);
        } else {
            console.log(`Form with id: ${formIdToDelete} was not found in ${usersContainerId} container!`);
        }

    } catch (error) {
        console.error("Error deleting form:", error);
    }
}


module.exports = {
    findAll,
    createFormItem,
    updateFormItem,
    findOne,
    deleteFormItem
};