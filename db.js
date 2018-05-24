var spicedPg = require("spiced-pg");
const bcrypt = require("bcryptjs");

var db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.signPetition = function(first, last, sig, user_id) {
    return db.query(
        `
    INSERT INTO signatures (first, last, signature, user_id)
    VALUES ($1, $2, $3, $4) RETURNING id
    `,
        [first || null, last || null, sig || null, user_id || null]
    );
};

module.exports.signUp = function(first, last, email, password) {
    return db.query(
        `INSERT INTO users (first, last, email, password)
    VALUES ($1, $2, $3, $4) RETURNING id
    `,
        [first || null, last || null, email || null, password || null]
    );
};

module.exports.insertPass = function(hashedPass) {
    return db.query(
        `INSERT INTO users password VALUES $1
        `,
        [hashedPass]
    );
};

module.exports.getCityAgeUrl = function() {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4) RETURNING id
`,
        [age || null, city || null, url || null, user_id || null]
    );
};

module.exports.getCity = function() {
    return db.query(
        `SELECT city FROM user_profile
`,
        [age || null, city || null, url || null, user_id || null]
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

module.exports.getUserByEmail = function(email) {
    return db.query(`SELECT * FROM users WHERE email = $1`, [email]);
};

module.exports.getSign = function(sigId) {
    return db.query(`SELECT signature FROM signatures WHERE user_id = $1`, [
        sigId
    ]);
};

module.exports.getSignersByCity = function(city) {
    return db.query(
        `
        SELECT first, last
        FROM signatures
        LEFT JOIN user_profile
        WHERE LOWER(city) = LOWER($1)
        `,
        [city]
    );
};

module.exports.hashPassword = function(plainTextPassword) {
    return new Promise(function(resolve, reject) {
        bcrypt.genSalt(function(err, salt) {
            if (err) {
                return reject(err);
            }
            console.log(salt);
            bcrypt.hash(plainTextPassword, salt, function(err, hash) {
                if (err) {
                    return reject(err);
                }
                resolve(hash);
            });
        });
    });
};

module.exports.checkPassword = function(
    textEnteredInLoginForm,
    hashedPasswordFromDatabase
) {
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
};
