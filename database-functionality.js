const CosmosClient = require('@azure/cosmos').CosmosClient;
const databaseConfig = require("./database-config");

// set db client
const endpoint = databaseConfig.endpoint;
const key = databaseConfig.key;

const databaseId = databaseConfig.database.id
const containerId = databaseConfig.testContainer.id
const partitionKey = { kind: 'Hash', paths: ['/partitionKey'] }

const options = {
      endpoint: endpoint,
      key: key,
      userAgentSuffix: 'emplir-database'
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

/**
 * Read the database definition
 */
async function readDatabase() {
    const { resource: databaseDefinition } = await client
        .database(databaseId)
        .read()
    return databaseDefinition;
    console.log(`Reading database:\n${databaseDefinition.id}\n`)
}

// /**
//  * Create the containers if it does not exist
//  */
// async function createTestContainer() {
//     const { container } = await client
//         .database(databaseId)
//         .containers.createIfNotExists(
//             { id: containerId, partitionKey }
//         )
//     console.log(`Created containers:\n${databaseConfig.testContainer.id}\n`)
// }

// /**
//  * Read the container definition
//  */
// async function readTestContainer() {
//     const { resource: containerDefinition } = await client
//         .database(databaseId)
//         .container(containerId)
//         .read()
//     console.log(`Reading container:\n${containerDefinition.id}\n`)
// }

// async function createTestItem() {
//     const { item } = await client
//         .database(databaseId)
//         .container(containerId)
//         .items.upsert(databaseConfig.testItems.test)
//     console.log(`Created test item with id:\n${databaseConfig.testItems.test.id}\n`)
// }

// async function queryTestContainer() {
//     const querySpec = {
//         query: 'SELECT * FROM TestContainer'
//     }
//     const { resources: results } = await client
//         .database(databaseId)
//         .container(containerId)
//         .items.query(querySpec)
//         .fetchAll()
//     return results;
// }

module.exports = {
    createDatabase,
    readDatabase,
    // createTestContainer,
    // readTestContainer,
    // createTestItem,
    // queryTestContainer,
};