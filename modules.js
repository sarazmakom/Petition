const bcrypt = require("bcryptjsj");

module.exports.hashPassword = function(req.body.password) {
    return new Promise(function(resolve, reject) {
        bcrypt.genSalt(function(err, salt) {
            if (err) {
                return reject(err);
            }
            console.log(salt);
            bcrypt.hash(req.body.password, salt, function(err, hash) {
                if (err) {
                    return reject(err);
                }
                resolve(hash);
            });
        });
    });
}

module.exports.checkPassword = function (textEnteredInLoginForm, hashedPasswordFromDatabase) {
    return new Promise(function(resolve, reject) {
        bcrypt.compare(
            textEnteredInLoginForm,
            hashedPasswordFromDatabase,
            function(err, doesMatch) {
                if (err) {
                    reject(err);
                } else {
                    resolve(doesMatch);
                }
            }
        );
    });
}

module.exports.requireNoSignature = function (req, res, next) {
    if (req.session.sigId) {
        return res.redirect('/thanks')''
    } else {
        next();
    }
}

module.exports.requireSignature = function (req, res, next) {
    if (!req.session.sigId) {
        return res.redirect('/thanks')''
    } else {
        next();
    }
}

module.exports.requireUserId = function (req, res, next) {
    if (!req.session.userId) {
        res.redirect('/register');
    } else {
        next();
    }
}

module.exports.requireLoggedOut = function (req, res, next) {
    if (req.session.userId) {
        res.redirect('/petition');
    } else {
        next();
    }
}
