const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const validator = require('email-validator');
const nodemailer = require("nodemailer");

//used to set port to listen on
const port = 5622;

const app = express();
// Increase the maximum allowed payload size to 50MB
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Read in the contents of the secure.json file
const secureData = fs.readFileSync('secure.json');
const secure = JSON.parse(secureData);

//transporter to send emails with (for security reasons auth is held in a seperate json)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: secure.email.user,
        pass: secure.email.pass
    }
});



/*
 * The most important part of the code :), this tells express to listen on port 5622 of the local host
 * (our proxy will route the requests to us, if you need a refresher on that just look through the docs)
 */
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


//return a random string of a given length using the given character set
function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

//read an email at return the year
function getEmailYear(email) {
    const yearMatch = email.match(/\d{2}(?=@peddie\.org)/);
    if (yearMatch) {
        const year = parseInt(yearMatch[0]) + 2000;
        return year;
    } else {
        return 0;
    }
}


app.get('/getAllMembers', (req, res) => {
    var con = mysql.createConnection({
        host: "localhost",
        user: "admincs",
        password: "BeatBlair1864",
        database: "peddieCS",
        port: 3306
    });

    con.connect(function (err) {
        if (err) throw err;
        con.query("SELECT * FROM members", function (err, result, fields) {
            if (err) throw err;
            res.json({ "error": false, "message": result });
            return res.end();
        })
        con.end();
    })
});


//send an email confirmation for updating user info (saves image)
app.post('/submitMember', function (req, res) {
    const firstName = req.body.first_name;
    const lastName = req.body.last_name;
    const email = req.body.email;
    const year = getEmailYear(email);
    const username = email.substring(0, email.lastIndexOf("@"));

    //validate email before doing anything else
    if (email.endsWith("@peddie.org") && validator.validate(email)) {

        // Save image file if it exists
        if (req.body.image) {
            const image = req.body.image;
            // Create a buffer from the base64-encoded string
            const buffer = Buffer.from(image, 'base64');
            // Write the buffer to a file
            fs.writeFile(`../members/user-images/temp/${username}`, buffer, function (err) {
                if (err) {
                    console.log(err);
                    res.send({ error: 'true', message: 'Failed To Save Image' });
                } else {
                    console.log(`Image saved as ${username}`);
                }
            });
        }

        //create confimation code and save it to MySQl (2^48 possible codes, so don't worry about repetition)
        const verificationCode = randomString(8, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-');
        var con = mysql.createConnection({
            host: "localhost",
            user: "admincs",
            password: "BeatBlair1864",
            database: "peddieCS",
            port: 3306
        });
        con.connect(function (err) {
            if (err) throw err;
            //inserts user data into the table, overwritting it if there is already an entry with the same email
            var sql = "INSERT INTO tempMembers (first_name, last_name, email, year, verificationCode) VALUES ('" + firstName + "', '" + lastName + "', '" + email + "', " + year + ", '" + verificationCode + "') ON DUPLICATE KEY UPDATE first_name='" + firstName + "', last_name='" + lastName + "', year=" + year + ", verificationCode='" + verificationCode + "'";
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log(firstName + " " + lastName + " added to tempMembers");
                con.end();



                //send email to user
                const body = `
                    <script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
                    <h4>Click <a href='https://peddiecs.peddie.org/redirect.html?request=addMember&email=${email}&verificationCode=${verificationCode}'>HERE</a> to verify your account.</h4>
                    <p>${firstName} ${lastName}</p>
                    ${(req.body.image ? '<img src="cid:user" style="width:200px;">' : '')}
                    `;

                var mailOptions = {
                    from: 'compsciclub@peddie.org',
                    to: email,
                    subject: 'PeddieCS Verify Registration',
                    html: body
                };

                if (req.body.image) {
                    mailOptions = {
                        from: 'compsciclub@peddie.org',
                        to: email,
                        subject: 'PeddieCS Verify Registration ',
                        attachments: [{
                            filename: username,
                            path: '../members/user-images/temp/' + username,
                            cid: 'user'
                        }],
                        html: body
                    };
                }

                transporter.sendMail(mailOptions, function (err, info) {
                    if (err) {
                        console.log(err);
                        res.send({ error: 'true', message: 'Failed to send Email' });
                    } else {
                        console.log('Email Sent: ' + info.response);
                        res.send({ error: 'false', message: 'Success' })
                    }
                });
            });
        });

    } else {
        res.send({ error: 'true', message: 'Invalid Email' });
    }
});

//adds a member form tempMembers to members (verification code is required)
app.post('/addMember', function (req, res) {
    // Get member data from POST request
    const email = req.body.email;
    const verificationCode = req.body.verificationCode;

    //validate email before doing anything else
    if (email != null && email.endsWith("@peddie.org") && validator.validate(email)) {
        const username = email.substring(0, email.lastIndexOf("@"));
        var con = mysql.createConnection({
            host: "localhost",
            user: "admincs",
            password: "BeatBlair1864",
            database: "peddieCS",
            port: 3306
        });

        con.connect(function (err) {
            if (err) throw err;
            con.query("SELECT * FROM tempMembers WHERE verificationCode=" + "\"" + String(verificationCode) + "\";", function (err, result, fields) {
                if (err) throw err;
                if (result[0]==null || result[0].email != email) {
                    res.send({ "error": true, "message": "Email and Verification Code do not match." });
                } else {
                    //on success, add data to members, and remove from tempMembers
                    var user = result[0];
                    var sql = "INSERT INTO members (first_name, last_name, email, year) VALUES ('" + user.first_name + "', '" + user.last_name + "', '" + user.email + "', " + user.year + ") ON DUPLICATE KEY UPDATE first_name='" + user.first_name + "', last_name='" + user.last_name + "', year=" + user.year;
                    con.query(sql, function (err, result) {
                        if (err) throw err;

                        //if everything is still going fine, delete the entry from tempMembers
                        con.query('DELETE FROM tempMembers WHERE verificationCode="' + String(verificationCode + '";'), function (err, result) {
                            if (err) throw err;

                            res.send({ "error": false, "message": "Successfully made " + user.first_name + " a member." });
                            con.end();
                        });
                    });
                }
            })
        })

        //move user image from temp to regular folder
        const sourcePath = path.join(__dirname, '..', 'members', 'user-images', 'temp', username);
        const destPath = path.join(__dirname, '..', 'members', 'user-images', username);

        if (fs.existsSync(sourcePath)) {
            fs.rename(sourcePath, destPath, (err) => {
                if (err) {
                    console.log(`Error moving file: ${err}`);
                } else {
                    console.log(`File moved successfully from ${sourcePath} to ${destPath}`);
                }
            });
        } else {
            console.log(`Error: Source file does not exist: ${sourcePath}`);
        }

    } else {
        res.send({ "error": true, "message": 'Invalid Email' });
    }
});


// test to make sure it is working
app.get('/', (req, res) => {
    res.send('Hello World!');
});

