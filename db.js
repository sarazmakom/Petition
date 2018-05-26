var spicedPg = require("spiced-pg");
const bcrypt = require("bcryptjs");

var db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
);

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

module.exports.saveProfile = function(age, city, url, userId) {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4) RETURNING id
`,
        [age || null, city || null, url || null, userId || null]
    );
};

module.exports.editUserProfiles = function(age, city, url, userId) {
    return db.query(
        `
        INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age=$1, city=$2, url=$3

`,
        [age || null, city || null, url || null, userId || null]
    );
};

module.exports.editUsers = function(first, last, email, id) {
    return db.query(
        `
        UPDATE users
        SET first = $1, last = $2, email = $3
        WHERE id = $4
        RETURNING first, last`,
        [first || null, last || null, email || null, id || null]
    );
};

// module.exports.upsert = function(age, city, url, userId){
//     `INSERT INTO user_profiles (age, city, url, userId)
//         VALUES ($1, $2, $3, $4)
//         ON CONFLICT (user_profiles.user_id = users.id)
//         DO UPDATE SET `
// }

module.exports.getSignersByCity = function(city) {
    return db.query(
        `
        SELECT users.first, users.last, age, city
        FROM users
        JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE LOWER(city) = LOWER($1)
        `,
        [city]
    );
};

module.exports.getSigners = function() {
    return db.query(`
        SELECT users.first, users.last, age, city, url
        FROM signatures
        LEFT JOIN user_profiles
        ON signatures.user_id = user_profiles.user_id
        LEFT JOIN users
        ON user_profiles.user_id = users.id
                    `);
};

module.exports.getCount = function() {
    return db.query(`SELECT COUNT(*) FROM signatures`);
};

module.exports.getSignatureById = function(sigId) {
    return db.query(`SELECT signature FROM signatures WHERE id = $1`, [sigId]);
};

module.exports.getUserByEmail = function getUserByEmail(email) {
    return db.query(
        `
        SELECT users.id as user_id, signatures.id as sig_id, signatures.user_id as sig_user, users.first, users.last, password
        FROM users
        LEFT JOIN signatures
        ON signatures.user_id = users.id
        WHERE email = $1`,
        [email]
    );
};

module.exports.getSigId = function(userId) {
    return db.query(`SELECT id FROM signatures WHERE user_id = $1`, [userId]);
};

module.exports.joinTables = function(userId) {
    return db.query(
        `SELECT * FROM user_profiles
            LEFT JOIN users
            ON user_profiles.user_id = users.id
            WHERE users.id = $1
        `,
        [userId]
    );
};

module.exports.updatePassword = function(first, last, email, password, userId) {
    return db.query(
        `UPDATE users
        SET first = $1, last = $2, email = $3, password = $4
        WHERE id = $5
        `,
        [first || null, last || null, email || null, password, userId]
    );
};

module.exports.deleteSignature = function(userId) {
    return db.query(
        `DELETE FROM signatures
        WHERE user_id = $1`,
        [userId]
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
