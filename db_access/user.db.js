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
    try {
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

        if (results.length > 0)
            return true;
        else return false;
    } catch (err) {
        console.log("In user.emailExists: " + err.message);
    }
}

async function accountNameExists(accountName) {
    try {
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

        if (results.length > 0)
            return true;
        else return false;
    } catch (err) {
        console.log("In user.accountNameExists: " + err.message);
    }
}

async function getUser(email) {
    try {
        console.log(`Querying container:\n${userContainerId} to find account with email ${email}`)
        const querySpec = {
            query: `SELECT {
                "userId": r.userId,
                "accountType": r.accountType,
                "accountName": r.accountName,
                "emailAddress": r.emailAddress,
                "password": r.password
            } FROM root r WHERE r.type = "user" AND r.emailAddress = @email`,
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

        if (results.length > 0)
            return results[0]['$1'];
        else return null;

    } catch (err) {
        console.log("In user.getUser: " + err.message);
    }
}

async function getUserById(id) {
    try {
        console.log(`Querying container:\n${userContainerId} to find  user with id ${id}`)
        const querySpec = {
            query: `SELECT * FROM root r WHERE r.type="user" AND r.userId = @userId`,
            parameters: [
                {
                    name: '@userId',
                    value: id
                }
            ]
        }
        const { resources: results } = await client
            .database(Database.databaseId)
            .container(userContainerId)
            .items.query(querySpec)
            .fetchAll()

        if (results.length > 0)
            return results[0];
        else return null;

    } catch (err) {
        console.log("In user.getUserById: " + err.message);
    }
}

async function increaseCountCreatedForms(userId) {
    try {
        const database = client.database(Database.databaseId);
        const container = database.container(userContainerId);
        const { resources: containerResources } = await container.items.readAll().fetchAll();
        const user = containerResources.find((t) => t.userId == userId && t.type == "user");

        if (user) {
            user.countCreatedForms = parseInt(user.countCreatedForms) + 1;
            const { resource: userUpdate } = await container.items.upsert(user);
            if (userUpdate) {
                console.log(`User with id: ${userId} updated countCreatedForms successfully in ${userContainerId} container!`);
            } else {
                console.log(`Error updating user with id: ${userId} in ${userContainerId} container!`);
            }
        } else {
            console.log(`User with id: ${userId} was not found in ${userContainerId} container!`);
        }
    } catch (error) {
        console.error(`Error updating user item in ${userContainerId} container:`, error);
    }
}

async function decreaseCountCreatedForms(userId) {
    try {
        const database = client.database(Database.databaseId);
        const container = database.container(userContainerId);
        const { resources: containerResources } = await container.items.readAll().fetchAll();
        const user = containerResources.find((t) => t.userId == userId && t.type == "user");

        if (user) {
            user.countCreatedForms = parseInt(user.countCreatedForms) - 1;
            const { resource: userUpdate } = await container.items.upsert(user);
            if (userUpdate) {
                console.log(`User with id: ${userId} updated countCreatedForms successfully in ${userContainerId} container!`);
            } else {
                console.log(`Error updating user with id: ${userId} in ${userContainerId} container!`);
            }
        } else {
            console.log(`User with id: ${userId} was not found in ${userContainerId} container!`);
        }
    } catch (error) {
        console.error(`Error updating user item in ${userContainerId} container:`, error);
    }
}

// async function getUserProfile(userId) {
//     try {
//     } catch (err) {
//         console.log("In forms.db: " + err.message);
//     }
// }

module.exports = {
    createUserItem,
    emailExists,
    accountNameExists,
    getUser,
    increaseCountCreatedForms,
    decreaseCountCreatedForms,
    getUserById
};