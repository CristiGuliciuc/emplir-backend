const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const CosmosClient = require('@azure/cosmos').CosmosClient;
require("dotenv").config();

const HOST = "0.0.0.0";
const PORT = process.env.PORT;

const app = express();

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// set db client
const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;

const databaseId = process.env.COSMOS_DB_DATABASE
const containerId = process.env.COSMOS_DB_CONTAINER
const partitionKey = { kind: 'Hash', paths: ['/partitionKey'] }

const options = {
      endpoint: endpoint,
      key: key,
      userAgentSuffix: 'CosmosDBEmplir'
    };

const client = new CosmosClient(options)

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
 * Exit the app with a prompt
 * @param {string} message - The message to display
 */
function exit(message) {
  console.log(message)
  console.log('Press any key to exit')
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.on('data', process.exit.bind(process, 0))
}

createDatabase()
  .then(() => {
    exit(`Database setup successfully`)
  })
  .catch(error => {
    exit(`Completed with error ${JSON.stringify(error)}`)
  })

app.get("/", (req, res) => {
  res.send("Hello User!\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening at http://${HOST}:${PORT}`);
});