var mysql = require('mysql');
// var express = require('express');
// var router = express.Router();

var con = mysql.createConnection({
    host: "localhost",
    user: "admincs",
    password: "BeatBlair1864",
    database: "pets",
    port: 3306
});

console.log("RUN")

write();

function read() {
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");

        con.query("SELECT * FROM cats", function (err, result, fields) {
            if (err) throw err;
            console.log(result);
        });
    });
}

function write() {
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = "INSERT INTO customers (name, address) VALUES ('Company Inc', 'Highway 37')";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
        });
    });
}

// function test(){
//     console.log("Tested");
// }

// function parseJSON(json) {
//     return JSON.parse(json);
// }

// function addMember(firstName, lastName, email) {
//     con.connect(function (err) {
//         if (err) throw err;
//         console.log("Connected!");
//         var sql = "INSERT INTO `cats` (`id`, `name`, `owner`, `birth`) VALUES ";
//         var str = sql + "(" + "\'" + firstName + "\', " + "\'" + lastName + "\', " + "\'" + email + "\'" + ");";
//         console.log(str);
//         con.query(str, function (err, result) {
//             if (err) throw err;
//             console.log("Number of records inserted: " + result.affectedRows);
//         });
//     });
// }

// router.post('/test', function(req, res) {
//     console.log("reached test method")
//     res.json({"message":"success"});
//     res.end();
// });