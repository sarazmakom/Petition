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

app.get("/", (req, res) => {
    if (req.session.userId) {
        return res.redirect("/thanks");
    } else if (!req.session.userId) {
        res.redirect("/petition");
    } else {
        res.redirect("/register");
    }
});

app.get("/login", function(req, res) {
    res.render("login", {
        layout: "main"
    });
});

app.post("/login", function(req, res) {
    let userId;
    let first;
    let last;
    let sigId;

    db
        .getUserByEmail(req.body.email)
        .then(function(data) {
            if (data.rows[0].sig_id) {
                sigId = data.rows[0].sig_id;
            }
            first = data.rows[0].first;
            last = data.rows[0].last;
            userId = data.rows[0].user_id;
            return db.checkPassword(req.body.password, data.rows[0].password);
        })
        .then(function(data) {
            if (data == false) {
                throw new Error();
            } else {
                req.session.userId = userId;
                req.session.first = first;
                req.session.last = last;
                req.session.sigId = sigId;
            }
        })
        .then(function() {
            if (!req.session.sigId) {
                res.redirect("/petition");
            } else {
                res.redirect("/thanks");
            }
        })
        .catch(function(err) {
            console.log(err);
            res.render("login", {
                layout: "main",
                error: "error"
            });
        });
});

app.get("/register", requireLoggedOut, function(req, res) {
    res.render("register", {
        layout: "main"
    });
});

app.post("/register", function(req, res) {
    db
        .hashPassword(req.body.password)
        .then(function(hashedPass) {
            return db.signUp(
                req.body.first,
                req.body.last,
                req.body.email,
                hashedPass
            );
        })
        .then(function(userId) {
            req.session.userId = userId.rows[0].id;
            req.session.first = req.body.first;
            req.session.last = req.body.last;
            res.redirect("/profile");
        })
        .catch(function(err) {
            console.log(err);
            res.render("register", {
                layout: "main",
                error: "error"
            });
        });
});

app.get("/petition", requireUserId, requireNoSignature, (req, res) => {
    res.render("petition", {
        layout: "main"
        // name: `${req.session.first} ${req.session.last}`
    });
});

app.post("/petition", requireNoSignature, (req, res) => {
    db
        .signPetition(
            req.session.first,
            req.session.last,
            req.body.signature,
            req.session.userId
        )
        .then(function(result) {
            req.session.sigId = result.rows[0].id;
            res.redirect("/thanks");
        })
        .catch(function(err) {
            console.log(err);
            res.render("petition", {
                layout: "main",
                error: "error"
            });
        });
});

app.get("/profile", function(req, res) {
    res.render("profile", {
        layout: "main"
    });
});

app.post("/profile", function(req, res) {
    db
        .saveProfile(
            req.body.age,
            req.body.city,
            req.body.url,
            req.session.userId
        )
        .then(function(data) {
            res.redirect("/petition");
        })
        .catch(function(err) {
            console.log(err);
            res.render("petition", {
                layout: "main",
                error: "error"
            });
        });
});

app.get("/profile/edit", requireUserId, requireSignature, function(req, res) {
    // console.log(req.session.userId);
    return db
        .joinTables(req.session.userId)
        .then(function(data) {
            res.render("edit", {
                layout: "main",
                userInfo: data.rows[0]
            });
        })
        .catch(function(err) {
            console.log(err);
        });
});

app.post("/profile/edit", function(req, res) {
    if (req.body.password) {
        db
            .hashPassword(req.body.password)
            .then(function(hashedPass) {
                Promise.all([
                    db.updatePassword(
                        req.body.first,
                        req.body.last,
                        req.body.email,
                        hashedPass,
                        req.session.userId
                    ),
                    db.editUserProfiles(
                        req.body.age,
                        req.body.city,
                        req.body.url,
                        req.session.userId
                    )
                ]);
            })
            .then(function() {
                res.redirect("/signers");
            })
            .catch(function(err) {
                console.log(err);
            });
    } else {
        Promise.all([
            db.editUsers(
                req.body.first,
                req.body.last,
                req.body.email,
                req.session.userId
            ),
            db.editUserProfiles(
                req.body.age,
                req.body.city,
                req.body.url,
                req.session.userId
            )
        ])
            // // .then(function([data1, data2]) {
            // //     req.session.first = data1.rows[0].first;
            // //     req.session.last = data1.rows[0].last;
            // })
            .then(function() {
                res.redirect("/thanks");
            })
            .catch(function(err) {
                // res.redirect("/profile/edit");
                console.log(err);
            });
    }
});
app.get("/thanks", requireUserId, requireSignature, (req, res) => {
    Promise.all([db.getSignatureById(req.session.sigId), db.getCount()])
        .then(function([sigResult, countResult]) {
            res.render("thanks", {
                layout: "main",
                number: countResult.rows[0].count,
                signature: sigResult.rows[0].signature,
                first: req.session.first
            });
        })
        .catch(function(err) {
            console.log(err);
        });
});

app.post("/thanks", function(req, res) {
    db.deleteSignature(req.session.userId).then(function() {
        req.session.sigId = null;
        res.redirect("/petition");
    });
});

app.get("/signers", requireUserId, requireSignature, (req, res) => {
    db
        .getSigners(`SELECT first, last FROM petition`)
        .then(function(data) {
            res.render("signers", {
                layout: "main",
                signers: data.rows
            });
        })
        .catch(function(err) {
            console.log(err);
        });
});

app.get("/signers/:city", function(req, res) {
    db
        .getSignersByCity(req.params.city)
        .then(function(result) {
            res.render("city", {
                layout: "main",
                signers: result.rows,
                city: req.params.city
            });
        })
        .catch(function(err) {
            console.log(err);
        });
});

app.get("/logout", requireUserId, function(req, res) {
    req.session = null;
    res.redirect("/login");
});

app.get("*", function(req, res) {
    res.redirect("/");
});

app.listen(process.env.PORT || 8080, () => console.log("Listening..."));

function requireNoSignature(req, res, next) {
    if (req.session.sigId) {
        return res.redirect("/thanks");
    } else {
        next();
    }
}

function requireSignature(req, res, next) {
    if (!req.session.sigId) {
        return res.redirect("/petition");
    } else {
        next();
    }
}

function requireUserId(req, res, next) {
    if (!req.session.userId) {
        // console.log("inside requireUserId, redirect to register");

        res.redirect("/register");
    } else {
        next();
    }
}

function requireLoggedOut(req, res, next) {
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        next();
    }
}
