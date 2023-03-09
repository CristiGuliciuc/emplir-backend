const User = require("../controllers/user.controller");

module.exports = (app) => {
    // Endpoint for creating a new user
    app.post("/users/signup/", User.create);
    // Endpoint for login
    app.post("/users/login/", User.login);
    // Endpoint to refresh token when it expires
    app.get("/refresh-token/", User.refreshToken);
}