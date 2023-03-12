const Forms = require("../controllers/forms.controllers");
const auth = require("../middlewares/authJwt")

module.exports = (app) => {
    // Endpoint for retrieving all forms
    app.get("/forms/getAll/", Forms.findAll);
    // Endpoint for retrieving a single form
    app.get("/forms/getOne/", Forms.findOne);
    // Endpoint for creating a new form
    app.post("/forms/create/", Forms.create);
};