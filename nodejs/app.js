var mysql = require('mysql');
// var express = require('express');
// var router = express.Router();

var con = mysql.createConnection({
    host: "localhost",
    user: "admincs",
    password: "BeatBlair1864",
    database: "peddieCS",
    port: 3306
});

console.log("RUN")

// addMember("Ananya", "Hari", "ahari-25@peddie.org", 2025);
// addMember("Sophia", "Wu", "swu-24@peddie.org", 2024);
// addMember("Ryan", "Rong", "rrong-24@peddie.org", 2024);

/*
    Allows user to pass arguments through command line
    for example:
    $ node app.js addMember Tomaz Chevres tchevres-24@peddie.org 2024
    will have values of "addMember" "Tomaz" "Chevres" "tchevres-24@peddie.org" 2024
*/
process.argv.forEach((value, index) => {
    console.log(index, value);
});

function read() {
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");

        con.query("SELECT * FROM members", function (err, result, fields) {
            if (err) throw err;
            console.log(result);
        });
    });
    con.end();
}

function addMember(first_name, last_name, email, year) {
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = "INSERT INTO members (first_name, last_name, email, year) VALUES ('" + first_name + "', '" + last_name + "', '" + email + "', " + year + ")";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
        });
        con.end();
        console.log("Ended");
    });
}