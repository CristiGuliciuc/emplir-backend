const CosmosClient = require('@azure/cosmos').CosmosClient;
const databaseConfig = require("../config/database.config");

const Database = require("./setup.db");

// !!! should also add a FORMS container
const usersContainerId = databaseConfig.usersContainer.id
const usersContainerPartitionKey = { kind: 'Hash', paths: ['/userId'] }

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

async function findAll(userId) {
    try {
        const querySpec = {
            query: `SELECT { 
            "formId": r.formId,
            "title": r.title,
            "dataRetentionPeriod": r.dataRetentionPeriod,
            "submissionsCount": r.submissionsCount 
        } FROM root r WHERE r.userId = @userId and r.type = "template"`,
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
        else return null;
    } catch (err) {
        console.log("In forms.db: " + err.message);
    }
}

async function findOne(userId, formId) {
    try {
        const querySpec = {
            query: `SELECT { 
            "formId": r.formId,
            "title": r.title,
            "dataRetentionPeriod": r.dataRetentionPeriod,
            "submissionsCount": r.submissionsCount,
            "fields": r.fields,
            "sections": r.sections
        } FROM root r WHERE r.userId = @userId AND r.formId = @formId AND r.type = "template"`,
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

module.exports = {
    findAll,
    createFormItem,
    findOne
};