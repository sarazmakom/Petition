exports.requireNoSignature = function requireNoSignature(req, res, next) {
    if (req.session.sigId) {
        return res.redirect("/thanks");
    } else {
        next();
    }
};

exports.requireSignature = function requireSignature(req, res, next) {
    if (!req.session.sigId) {
        return res.redirect("/petition");
    } else {
        next();
    }
};

exports.requireUserId = function requireUserId(req, res, next) {
    if (!req.session.userId) {
        res.redirect("/register");
    } else {
        next();
    }
};

exports.requireLoggedOut = function requireLoggedOut(req, res, next) {
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        next();
    }
};
