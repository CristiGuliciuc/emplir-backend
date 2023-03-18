const Submissions = require("../controllers/submissions.controllers");
const auth = require("../middlewares/authJwt")

module.exports = (app) => {
    // Endpoint for retrieving all submissions 
    app.get("/submissions/getAll/", Submissions.findAll);
    // Endpoint for insert a new submission
    app.post("/submissions/send/", Submissions.insert);
    // Endpoint for delete a submission
    app.delete("/submissions/delete/", Submissions.delete);
};