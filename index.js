const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const HOST = "0.0.0.0";
const PORT = 8080;

const app = express();

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

  app.get("/", (req, res) => {
    res.send("Hello User!\n");
  });

app.listen(PORT, () => {
  console.log(`Example app listening at http://${HOST}:${PORT}`);
});