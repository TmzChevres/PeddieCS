function displayProfile(user) {
    getProfile(user);
}

//requests user data from the MySQL database
function getProfile(user) {
    if (window.jQuery) {
        $.get("https://peddiecs.peddie.org/nodejs/getMemberData", {
            "email": user.email
        }, function (res) {
            if (res.message == "failed") {
                console.log("Failed to get member data")
            } else {
                console.log(res);
                displayMemberProfile(res);
            }
        });
    }
}

function displayMemberProfile(json) {
    var name = json.first_name + " " + json.last_name;
    var email = json.email;
    var username = email.substring(0, email.indexOf("@"));
    console.log("Loading data for " + name);

    //add user display-icon
    var img = document.getElementById('image');
    img.src = '/members/user-images/' + username;
    img.addEventListener('error', function () { img.src = '/members/user-images/missing.jpg'; });
    document.getElementById('name').innerText = name + (json.year != '0' ? (" '" + json.year.toString().slice(-2)) : '');
    document.getElementById('info').innerHTML += `<li>${email}</li>` + (json.university ? `<li>${json.university}</li>` : '');

    //center icon if no bio
    if (json.bio || json.groups) {
        document.getElementById('icon').style = "grid-column:1";
        //add bio
        if (json.bio) {
            document.getElementById('bio').innerText = decodeURIComponent(json.bio).replace(/\n/g, '<br>');
            document.getElementById('counter').innerText = `${json.bio.length}/1000`;
        }
        //add groups (not a thing yet)
        if (json.groups) {
            document.getElementById('groups').innerHTML = `<h3>Club Groups</h3><p>${json.groups}</p>`
        }
    }

    //load projects
    if (json.projects.length > 0) {
        var projects = document.getElementById('projects');
        if (json.articles.length == 0) { projects.style = "grid-column:1/-1"; }

        projects.innerHTML = `<h1>Projects</h1><div class="list"></div>`;
        var list = projects.getElementsByClassName("list")[0];
        for (var i = 0; i < json.projects.length; i++) {
            list.innerHTML += `<button class="item" onclick="window.location.href='/projects/project.html?id=${json.projects[i].id}'"><h3>${json.projects[i].name}</h3><p>${json.projects[i].description}</p></button>`
        }
    }

    //load articles
    if (json.articles.length > 0) {
        var articles = document.getElementById('articles');
        if (json.projects.length == 0) { projects.style = "grid-column:1/-1"; }

        articles.innerHTML = `<h1>Articles</h1><div class="list"></div>`;
        var list = articles.getElementsByClassName("list")[0];
        for (var i = 0; i < json.articles.length; i++) {
            list.innerHTML += `<button class="item" onclick="window.location.href='/articles/article.html?id=${json.articles[i].id}'"><h3>${json.articles[i].name}</h3><p>${json.articles[i].body}</p></button>`
        }
    }


    //autosave Bio
    // Set the delay time (in milliseconds)
    const delay = 5000;
    // Initialize the timer variable
    let timerId = null;
    document.getElementById("bio").addEventListener("input", function () {
        //update status
        document.getElementById("status").innerText = "unsaved"
        // Clear the previous timer
        clearTimeout(timerId);
        // Start a new timer
        timerId = setTimeout(function () {
            // Run your function here
            console.log("Function executed after 5 seconds of inactivity");
            document.getElementById("status").innerText = "saving"

            $.post("https://peddiecs.peddie.org/nodejs/updateBio", {
                token: getCookie('credential'),
                bio: encodeURIComponent(document.getElementById('bio').value)
            }, function (res) {
                if (res.message == "success") {
                    console.log("success");
                    document.getElementById("status").innerText = "saved"
                } else {
                    console.log("failed")
                    document.getElementById("status").innerText = "unsaved"
                }
            });
        }, delay);
    });
}
