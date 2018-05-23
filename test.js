var spicedPg = require("spiced-pg");

var db = spicedPg("postgres:postgres:postgres@localhost:5432/cities");

function addSignatures(first, last, sig) {
    db
        .query(
            `
    INSERT INTO signatures (first, last, sig)
    VALUES ($1, $2, $3)
    `[(first, last, sig)]
        )
        .then(function(result) {
            console.log(result.rows);
            db
                .query("SELECT * FROM signatures")
                .then(function(result) {
                    console.log(JSON.stringify(result.rows, null, 4));
                })
                .catch(function(err) {
                    console.log(err);
                });
        });
}

// VALUES ('Loserville', 1, 'Loserland')
