const Forms = require("../controllers/form.controllers");
const auth = require("../middlewares/authJwt")

module.exports = (app) => {
    // Endpoint for retrieving all forms
    app.get("/forms/getAll/", auth, Forms.findAll);
    // Endpoint for retrieving a single form
    app.get("/forms/getOne/", auth, Forms.findOne);
    // Endpoint for creating a new form
    app.post("/forms/create/", auth, Forms.create);
    // Endpoint for update a form
    app.post("/forms/update/", auth, Forms.update);
    // Endpoint for delete a form
    app.delete("/forms/delete/", auth, Forms.delete);
};