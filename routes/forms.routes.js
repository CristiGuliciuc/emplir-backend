const Forms = require("../controllers/forms.controllers");
const auth = require("../middlewares/authJwt")

module.exports = (app) => {
    app.get(
        "/forms/getAll",
        Forms.findAll
    );
    app.post("/forms/create/", auth, Forms.create);
};