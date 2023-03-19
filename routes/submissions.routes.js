const Submissions = require("../controllers/submissions.controllers");
const auth = require("../middlewares/authJwt")

module.exports = (app) => {
    // Endpoint for retrieving all submissions 
    app.get("/submissions/getAll/", auth, Submissions.findAll);
    // Endpoint to check if form  exist
    app.get("/submit/",  Submissions.findForm);
    // Endpoint for insert a new submission
    app.post("/submissions/send/", Submissions.insert);
    // Endpoint for delete a submission
    app.delete("/submissions/delete/", auth, Submissions.delete);
};