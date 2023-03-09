const Forms = require("../controllers/forms.controllers");

module.exports = (app) => {
    app.get(
        "/forms/getAll",
        Forms.findAll
    );
};