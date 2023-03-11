const CosmosClient = require('@azure/cosmos').CosmosClient;
const databaseConfig = require("../config/database.config");

const Database = require("./setup.db");

// !!! should also add a FORMS container
const containerId = databaseConfig.usersContainer.id
const partitionKey = { kind: 'Hash', paths: ['/userId'] }

const client = Database.client;

async function createFormItem(itemBody) {
    const { item } = await client
      .database(Database.databaseId)
      .container(containerId)
      .items.upsert(itemBody)
    // should add it to both forms and users container; for now it is only in the users container
    console.log(`Created form with id:\n${itemBody.formId}\n`)
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
            .container(containerId)
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
    createFormItem
};