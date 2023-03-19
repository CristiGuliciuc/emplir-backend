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

        const { item2 } = await client
            .database(Database.databaseId)
            .container(formsContainerId)
            .items.upsert(itemBody)

        console.log(`Created form with id:\n${itemBody.formId}\n`);
        return true;
    } catch (err) {
        console.log("In forms.db: " + err.message);
        return false;
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
        
        let forms = [];
        for( let i =0 ; i< results.length; i++)
        {
            forms[i] = results[i]['$1'];
        }
        return forms;

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
            return results[0]['$1'];
        else return null;
    } catch (err) {
        console.log("In forms.db: " + err.message);
    }
}

async function findOneWithoutAuth(formId) {
    try {
        console.log(`Get complete data for form whit id:${formId}`);
        const querySpec = {
            query: `SELECT * FROM root r WHERE r.type="form" AND r.formId = @formId`,
            parameters: [
                { name: '@formId', value: `${formId}` }
            ]
        }
        const { resources: results } = await client
            .database(Database.databaseId)
            .container(formsContainerId)
            .items.query(querySpec)
            .fetchAll()

            console.log(results);
        if (results.length > 0)
            return results[0];
        else return null;
    } catch (err) {
        console.log("In forms.db: " + err.message);
    }
}

async function deleteFormItem(userId, formIdToDelete) {
    const deleted = await deleteForm(userId, formIdToDelete, formsContainerId) &&
       await deleteForm(userId, formIdToDelete, usersContainerId);
    if(deleted){
        await deleteSubmissions(userId, formIdToDelete, null);
        return true;
    }
    return false;
}

async function deleteForm(userId, formIdToDelete, containerId) {
    try {
        const database = client.database(Database.databaseId);
        const container = database.container(containerId);
        const { resources: forms } = await container.items.readAll().fetchAll();
        const form = forms.find((t) => t.formId == formIdToDelete && t.userId == userId && t.type == "form");
        console.log("formId: " +formIdToDelete +" userId: " + userId + " form: " + form);

        if (form) {
            if (containerId == usersContainerId)
                await container.item(form.id, form.userId).delete();
            else
                await container.item(form.id, form.formId).delete();
            console.log(`Form with id: ${formIdToDelete} was deleted successfully from ${containerId} container!`);
            return true;
        } else {
            console.log(`Form with id: ${formIdToDelete} was not found in ${containerId} container!`);
            return false;
        }

    } catch (error) {
        console.error("Error deleting form:", error);
        return false;
    }
}
async function deleteSubmissions(userId, formId, submissionId) {
    try {
        const database = client.database(Database.databaseId);
        const container = database.container(formsContainerId);

        const { resources: submissions } = await container.items.readAll().fetchAll();
        let submissionsToDelete;

        if (submissionId) {
            submissionsToDelete = submissions.filter((t) => /*t.formId == formId /*&& t.userId == userId &&*/ t.submissionId == submissionId && t.type == "submission");
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
                return true;
            }

            // decrement submissionsCount for form with formId
            await updateFormItem(submissionsCount, formId, "decrementCountSubmissions");
        } else {
            console.log(`No submissions with formid: ${formId} and userid: ${userId} were found in ${formsContainerId} container!`);
            return false;
        }
    } catch (error) {
        console.error("Error deleting submissions:", error);
        return false;
    }
}
module.exports = {
    findAll,
    createFormItem,
    updateFormItem,
    deleteSubmissions,
    findOne,
    deleteFormItem,
    findOneWithoutAuth
};