const User = require("../controllers/user.controller");

module.exports = (app) => {
    // Endpoint for creating a new user
    app.post("/users/signup/", User.create);
}