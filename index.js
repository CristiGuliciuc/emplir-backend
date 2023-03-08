const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerConfig = require('./config/swagger.config')
require("dotenv").config();

const HOST = process.env.HOST;
const PORT = process.env.PORT || 3000;

const swaggerSpec = swaggerJSDoc(swaggerConfig.optionsSwagger);

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

const app = express()

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

  /**
   *  @swagger
   * /:
   *  get:
   *    summary: This api is used to check if get method is working or not
   *    description: This api is used to check if get method is working or not
   *    responses:
   *      200:
   *          description: To test Get method
   */
app.get('/', (req, res) => {
  res.send('Hello User!');
})

require("./routes/forms.routes")(app);

require("./routes/user.routes")(app);

app.listen(PORT, () => {
  console.log(`Example app listening at http://${HOST}:${PORT}`)
})