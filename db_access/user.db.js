const CosmosClient = require('@azure/cosmos').CosmosClient;
const databaseConfig = require("../config/database.config");

const Database = require("./setup.db");

const userContainerId = databaseConfig.usersContainer.id
const usersContainerPartitionKey = { kind: 'Hash', paths: ['/userId'] }

 const client = Database.client;


/**
 * Create user
 */
async function createUserItem(itemBody) {
    const { item } = await client
      .database(Database.databaseId)
      .container(userContainerId)
      .items.upsert(itemBody)
    console.log(`Created user with id:\n${itemBody.userId}\n`)
}

async function emailExists(email) {
try{
    console.log(`Querying container:\n${userContainerId} to find email ${email}`)
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
    .container(userContainerId)
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
    console.log(`Querying container: ${userContainerId} to find accountName ${accountName}`)
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
    .container(userContainerId)
    .items.query(querySpec)
    .fetchAll()
    
    if(results.length > 0) 
        return true;
    else return false;
} catch (err) {
    console.log("In user.accountNameExists: " + err.message);
  }
}

async function getUser(email) {
    try{
        console.log(`Querying container:\n${userContainerId} to find account with email ${email}`)
        const querySpec = {
            query : `SELECT {
                "userId": r.userId,
                "emailAddress": r.emailAddress,
                "password": r.password
            } FROM root r WHERE r.emailAddress = @email`,
            parameters: [
                {
                    name: '@email',
                    value: email
                }
            ]
        }
        const { resources: results } = await client
        .database(Database.databaseId)
        .container(userContainerId)
        .items.query(querySpec)
        .fetchAll()
        
        if(results.length > 0)
            return results[0]['$1'];
        else return null;

    } catch (err) {
        console.log("In user.getUser: " + err.message);
    }
}

async function increaseCountCreatedForms(userId) {
    try{
        console.log(`Querying container:\n${userContainerId} to find countCreatedForms for user with id ${userId}`)
        const querySpec = {
            query : `SELECT * FROM root r WHERE r.userId = @userId`,
            parameters: [
                {
                    name: '@userId',
                    value: userId
                }
            ]
        }
        const { resources: results } = await client
        .database(Database.databaseId)
        .container(userContainerId)
        .items.query(querySpec)
        .fetchAll()

        if(results.length > 0)
        {
            console.log(`Querying container:\n${userContainerId} to increase countCreatedForms for user with id ${userId}`)
            results[0].countCreatedForms +=1;
            const { item } = await client
            .database(Database.databaseId)
            .container(userContainerId)
            .item(results[0].userId, results[0].partitionKey)
            .replace(results[0])
        }
    } catch (err) {
        console.log("In user.increaseUserCountCreatedForms: " + err.message);
    }
}

module.exports = {
    createUserItem,
    emailExists,
    accountNameExists,
    getUser,
    increaseCountCreatedForms
};