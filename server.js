const express = require("express");
const app = express();

const db = require("./db");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

const hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(require("cookie-parser")());

app.use(express.static(__dirname + "/public"));

app.use(
    bodyParser.urlencoded({
        extended: false
    })
);

app.use(cookieParser());

app.use(
    cookieSession({
        secret: `Deepest of all the secrets`,
        maxAge: 1000 * 60 * 60 * 24 * 30
    })
);

app.use(csurf());

app.use(function(req, res, next) {
    res.setHeader("X-Frame-Options", "DENY");
    res.locals.csrfToken = req.csrfToken();
    next();
});
//
// app.get("/login", requireLoggedOut, function(req, res) {});
//
// app.post("/login", requireLoggedOut, function(req, res) {});
//
// app.get("/register", requireLoggedOut, function(req, res) {});
//
// app.post("/register", requireLoggedOut, function(req, res) {});
//
// app.get('/petition'), requireUserId, requireNoSignature, function(req, res){
//
// }
//
// app.post('/petition'), requireUserId, requireNoSignature, function(req, res){
//
// }

app.get("/", (req, res) => {
    if (req.session.sigId) {
        return res.redirect("/thanks");
    }
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    if (req.session.sigId) {
        res.redirect("/thanks");
    }
    res.render("home", {
        layout: "main"
    });
});

app.post("/petition", (req, res) => {
    db
        .signPetition(req.body.first, req.body.last, req.body.signature)
        .then(function(result) {
            req.session.sigId = result.rows[0].id;
            res.redirect("/thanks");
        })
        .catch(function(err) {
            console.log(err);
            res.render("home", {
                layout: "main",
                error: "error"
            });
        });
});

app.get("/thanks", (req, res) => {
    Promise.all([db.getSignatureById(req.session.sigId), db.getCount()])
        .then(function([sigResult, countResult]) {
            res.render("thanks", {
                layout: "main",
                number: countResult.rows[0].count,
                signature: sigResult.rows[0].signature
            });
        })
        .catch(function(err) {
            console.log(err);
        });
});

app.get("/signers", (req, res) => {
    //add requireUserId, requireSignature
    db
        .getSigners(`SELECT first, last FROM petition`)
        .then(function(result) {
            res.render("signers", {
                layout: "main",
                signers: result.rows
            });
        })
        .catch(function(err) {
            console.log(err);
        });
});

app.get("/logout", function(req, res) {
    req.session = null;
    res.redirect("/login");
});

app.get("*", function(req, res) {
    res.redirect("/");
});

app.listen(8080, () => console.log("Listening..."));
