var spicedPg = require("spiced-pg");

var db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.signPetition = function(first, last, sig) {
    return db.query(
        `
    INSERT INTO signatures (first, last, signature)
    VALUES ($1, $2, $3) RETURNING id
    `,
        [first || null, last || null, sig || null]
    );
};

module.exports.getSigners = function() {
    return db.query(`SELECT first, last FROM signatures`);
};

module.exports.getCount = function() {
    return db.query(`SELECT COUNT(*) FROM signatures`);
};

module.exports.getSignatureById = function(sigId) {
    return db.query(`SELECT signature FROM signatures WHERE id = $1`, [sigId]);
};
