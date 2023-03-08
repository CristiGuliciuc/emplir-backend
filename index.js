const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const databaseFunctionality = require("./database-functionality");
require("dotenv").config();

const HOST = 'localhost';
const PORT = process.env.PORT || 3000

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

const app = express()

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

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

databaseFunctionality.createDatabase()
  .then(() => {
    exit(`Database setup successfully`)
  })
  .catch(error => {
    exit(`Completed with error ${JSON.stringify(error)}`)
  })

app.get('/', (req, res) => {
  databaseFunctionality.readDatabase().then((results) => {
    res.send(`Database ${JSON.stringify(results.id)} setup successfully`);
  }).catch((error) => {
    res.send(`Database error: ${error}`);
  });
})

require("./routes/user.routes")(app);

app.listen(PORT, () => {
  console.log(`Example app listening at http://${HOST}:${PORT}`)
})
