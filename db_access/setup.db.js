const CosmosClient = require('@azure/cosmos').CosmosClient;
const databaseConfig = require("../config/database.config");
require("dotenv").config();

// set db client
const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;

const databaseId = process.env.COSMOS_DB_DATABASE;
const usersContainerId = databaseConfig.usersContainer.id
const usersContainerPartitionKey = { kind: 'Hash', paths: ['/userId'] }

const options = {
      endpoint: endpoint,
      key: key,
      userAgentSuffix: 'smartforms'
};

const client = new CosmosClient(options);

/**
 * Create the database if it does not exist
 */
async function createDatabase() {
    const { database } = await client.databases.createIfNotExists({
        id: databaseId
    })
    console.log(`Created database:\n${database.id}\n`)
}

module.exports = {
    client,
    databaseId,
    usersContainerId,
    usersContainerPartitionKey,
    createDatabase
};