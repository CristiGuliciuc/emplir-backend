const CosmosClient = require('@azure/cosmos').CosmosClient;
const databaseConfig = require("../database-config");

const Database = require("./setup.db");

const containerId = databaseConfig.usersContainer.id
const partitionKey = { kind: 'Hash', paths: ['/userId'] }

 const client = Database.client;


/**
 * Create user
 */
async function createUserItem(itemBody) {
    const { item } = await client
      .database(Database.databaseId)
      .container(containerId)
      .items.upsert(itemBody)
    console.log(`Created user with id:\n${itemBody.userId}\n`)
}

async function emailExists(email) {
try{
    console.log(`Querying container:\n${containerId} to find email ${email}`)
    const querySpec = {
        query: 'SELECT VALUE r.emailAddress FROM root r WHERE r.emailAddress = @email',
        parameters: [
            {
                name: '@email',
                value: email
            }
        ]
    }
    const { resources: results } = await client
    .database(Database.databaseId)
    .container(containerId)
    .items.query(querySpec)
    .fetchAll()
    
    if(results.length > 0)
        return true;
    else return false;
} catch (err) {
    console.log("In user.emailExists: " + err.message);
}
}

async function accountNameExists(accountName) {
try{
    console.log(`Querying container: ${containerId} to find accountName ${accountName}`)
    const querySpec = {
        query: 'SELECT VALUE r.accountName FROM root r WHERE r.accountName = @accountName',
        parameters: [
            {
                name: '@accountName',
                value: accountName
            }
        ]
    }
    const { resources: results } = await client
    .database(Database.databaseId)
    .container(containerId)
    .items.query(querySpec)
    .fetchAll()
    
    console.log(JSON.stringify(results) + " " + results.length)
    if(results.length > 0) 
        return true;
    else return false;
} catch (err) {
    console.log("In user.accountNameExists: " + err.message);
  }
}

  module.exports = {
    createUserItem,
    emailExists,
    accountNameExists
};