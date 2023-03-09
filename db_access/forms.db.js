const CosmosClient = require('@azure/cosmos').CosmosClient;
const databaseConfig = require("../config/database.config");

const Database = require("./setup.db");

const containerId = databaseConfig.usersContainer.id
const partitionKey = { kind: 'Hash', paths: ['/userId'] }

 const client = Database.client;

async function findAll(userId) {
    const querySpec = {
        query: `SELECT f.formId
                       ,f.title
                       ,f.dataRetentionPeriod
                       ,f.submissionsCount 
                FROM USERS u join f IN u.Forms
                WHERE u.userId = @userId`,
        parameters: [
            { name: '@userId', value: `${userId}` }
        ]
    }

    const { resources: results } = await client
        .database(Database.databaseId)
        .container(containerId)
        .items.query(querySpec)
        .fetchAll()
    return results;
}

module.exports = {
    findAll
};