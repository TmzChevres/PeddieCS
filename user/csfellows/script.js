//runs once user is validated
var userData;
function load(user) {
    const permissions = user.permissions.replace(' ', '').split(',');
    userData = user;
    if (permissions.includes('csfellow')) {
        loadMonth(new Date(), true);
        // loadZoomLink();
    }
    else {
        window.location.href = '/user/'
    }
}


//load calendar
const currentDate = new Date;
const saveDate = new Date;
var displayTodaysFellows = false;

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

var scheduleJSON;
loadScheduleJSON().then((result) => { scheduleJSON = result })

async function loadScheduleJSON() {
    const response = await fetch('https://peddiecs.peddie.org/csfellows/schedule.json');
    const data = await response.json();
    return data;
};

function loadCalendarDates(date) {
    console.log(date);
    //load month
    const calendar = document.getElementById("calendar");
    calendar.getElementsByClassName("month")[0].innerHTML = `<h1>${monthNames[date.getMonth()]}</h1><h2>${date.getFullYear()}</h2>`;
    [].forEach.call(document.querySelectorAll('.day'), function (day) { day.parentNode.removeChild(day); });
    //load days
    //note leap year exceptions if (year%4==0 && year%100=0 && year%400!=0)
    var d = new Date(date.getTime());
    var days = [];
    d.setDate(1);
    for (var i = d.getDay(); i > 0; i--) {
        days.push(monthDays[(((d.getMonth() - 1) % 12) + 12) % 12] - i + 1);
    }
    if (d.getMonth() == 2 && d.getFullYear() % 4 == 0) days.push(29);
    for (var i = 0; days.length < 42; i++) {
        days.push(i % (monthDays[d.getMonth()] + ((d.getMonth() == 1 && d.getFullYear() % 4 == 0) ? 1 : 0)) + 1)
    }
    for (var i = 0; i < days.length; i++) {
        //behold; the single worst line of code I have ever written:
        document.getElementById('calendar-body').innerHTML += `<div class="day${((i < 7 && days[i] > 14) || (i > 21 && days[i] < 14)) ? ' off' : ''}${currentDate.getDate() == i - d.getDay() + 1 && currentDate.toDateString() == date.toDateString() ? ' today' : ''}"${((i < 7 && days[i] > 14) || (i > 21 && days[i] < 14)) ? '' : 'id="day-' + days[i] + '"'}${((i < 7 && days[i] > 14) || (i > 21 && days[i] < 14)) ? '' : 'onclick="selectCalendarDate(this,\'' + date.getFullYear() + ',' + (date.getMonth() + 1) + ',' + days[i] + '\')"'}>${days[i]}</div>`;

    }
    //load next month
    document.getElementById("prev-month").innerText = '\u25c0 ' + monthNames[((d.getMonth() - 1) % 12 + 12) % 12];//weird stuff to deal with negatives
    document.getElementById("prev-month").onclick = function onclick() { saveDate.setMonth(saveDate.getMonth() - 1); loadCalendarDates(saveDate); loadMonth(saveDate); };
    document.getElementById("next-month").innerText = monthNames[(d.getMonth() + 1) % 12] + ' \u25b6';
    document.getElementById("next-month").onclick = function onclick() { saveDate.setMonth(saveDate.getMonth() + 1); loadCalendarDates(saveDate); loadMonth(saveDate); };
}

const loadedMonths = new Map();
//add events to calendar
function loadMonth(date, firstLoad) {
    console.log([date.getMonth(), date.getFullYear()].toString());
    if (loadedMonths.has([date.getFullYear(), date.getMonth()].toString())) {
        addCalendarEvents(date.getYear(), date.getMonth(), loadedMonths.get([date.getFullYear(), date.getMonth()].toString()));
    } else {
        console.log('loading data');
        $.get('https://peddiecs.peddie.org/nodejs/csfellows/schedule', {
            date: date
        }, function (res) {
            console.log(res);
            loadedMonths.set([date.getFullYear(), date.getMonth()].toString(), res.schedule)
            addCalendarEvents(date.getYear(), date.getMonth(), loadedMonths.get([date.getFullYear(), date.getMonth()].toString()), firstLoad);
        });
    }
}

function addCalendarEvents(year, month, data, firstLoad) {
    // console.log({ year: year, month: month, data: data });
    for (var i = 0; i < data.length; i++) {
        var event = data[i]
        var eventDate = new Date(event.date.substring(0, event.date.length - 1));
        // console.log(eventDate);
        document.getElementById('day-' + eventDate.getDate()).innerHTML += `<div class="event" id="event-${event.id}" style="background-color:${stringToColor(event.email)}; border-color:#00000000" >${event.name}</div>`;
        //removed onclick="loadPopup('${event.email}','${event.name}','${eventDate.getHours()}','${eventDate.getMinutes()}')" from above

        if (eventDate.toDateString() == currentDate.toDateString() && firstLoad) {
            loadPreview(event.email, event.name, eventDate.toString(), event.duration, event.location, event.id);
        };
    }
}

function loadPopup(email, name, hour, minute) {
    const popup = document.getElementById("calendar-popup");

    let hour2 = (hour % 12) + 1;
    hour = ((parseInt(hour) + 11) % 12) + 1;

    const time = (hour) + ':' + (minute < 10 ? '0' : '') + minute + '-' + (hour2) + ':' + (minute < 10 ? '0' : '') + minute

    popup.querySelector('#popup-img').src = '/members/user-images/' + email.substring(0, email.indexOf("@"));
    popup.querySelector('#popup-name').innerText = name;
    popup.querySelector('#popup-time').innerText = time;

    popup.style = "display:block";
}

function loadPreview(email, name, datetime, duration, location, id, hideDelete) {
    datetime = new Date(datetime);
    let hour = datetime.getHours() % 12;
    let minute = datetime.getMinutes();
    datetime.setMinutes(datetime.getMinutes() + duration);
    let hour2 = datetime.getHours() % 12;
    let minute2 = datetime.getMinutes();
    // console.log(datetime, hour,hour2,minute)

    document.getElementById('fellows-preview').innerHTML +=
        `<div class="icon" id="fellow-${id}">
            <div class="memberItem">
                <img src="/members/user-images/${email.substring(0, email.indexOf("@"))}" alt="member image"onError="this.onerror=null;this.src='/members/user-images/missing.jpg';">
                <a>${name}</a>
                <p>${(hour) + ':' + (minute < 10 ? '0' : '') + minute + '-' + (hour2) + ':' + (minute2 < 10 ? '0' : '') + minute2} ${datetime.getHours() < 12 ? 'AM' : 'PM'}</p>
                ${location ? '<p>' + location + '</p>' : ''}
                ${email == userData.email && !hideDelete ? '<button class="fellows-remove delete memberItem" onclick="cancelEvent(' + id + ');">Cancel Sign Up</button>' : ''}
            </div>
        </div>`;
}


//not needed
function displayPreview() {
    if (!displayTodaysFellows) {
        displayTodaysFellows = true;
        document.getElementById('info-fellows').style = 'display:block;'
    }
}

function stringToColor(text) {
    var hash = stringToHash(text);
    let r = 127 + ((hash & 0xFF0000) >> 16) / 2;
    let g = 127 + ((hash & 0x00FF00) >> 8) / 2;
    let b = 127 + ((hash & 0x0000FF)) / 2;

    //println(hash,r,g,b);
    return `rgb(${r},${g},${b})`;
}

function stringToHash(string) {
    var hash = 0;
    if (string.length == 0) return hash;
    for (i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

function loadZoomLink() {
    //add zoom link (sign in button)
    document.getElementById('info').innerHTML += `<h3>Connect to Zoom</h3><button class="join-zoom" id="join-zoom"><h3>Join</h3></button>`

    $.get("https://peddiecs.peddie.org/nodejs/csfellows/getZoomLink", {
        token: getCookie('credential')
    }, function (res) {
        if (res.message == "failed") {
            console.log("Failed to get zoom link")
        } else {
            document.getElementById('join-zoom').addEventListener("click", function () {
                window.location.href = res.link;
            });
        }
    });
}

//called when user clicks on the calendar to select a date
function selectCalendarDate(element, date) {
    if (element != null) {
        [].forEach.call(document.querySelectorAll('.active'), function (day) { day.classList.remove('active'); }); element.classList.add('active');
    }

    date = new Date(date);
    document.getElementById('signup-instruction').innerText = dayNames[date.getDay()] + ' ' + monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();

    document.getElementById('fellows-preview').innerHTML = "";

    var fellowsCount = 0;//number of fellows on a given day
    //var time8 = 0, time9 = 0;//number of fellows scheduled for 8:00pm or 9:00pm in a given day
    var userScheduled = false;
    var pastEvent = false;
    var loadedTimes = [];//keeps track of all loaded times
    if (new Date(date.toDateString()) < new Date(currentDate.toDateString())) pastEvent = true;

    [].forEach.call(loadedMonths.get([date.getFullYear(), date.getMonth()].toString()), function (event) {
        eventDate = new Date(event.date.substring(0, event.date.length - 1));
        // console.log(date, eventDate);
        if (eventDate.getDate() == date.getDate()) {
            // if (eventDate.getHours() == 20) time8++;
            // if (eventDate.getHours() == 21) time9++;
            // console.log(event);
            loadPreview(event.email, event.name, eventDate.toString(), event.duration, event.location, event.id, pastEvent);
            fellowsCount++;
            let timeMinutes = Math.round(eventDate.getHours() * 60 + eventDate.getMinutes());
            if (!loadedTimes[timeMinutes]) loadedTimes[timeMinutes] = 1;
            else loadedTimes[timeMinutes]++;
            if (event.email == userData.email) userScheduled = true;
        }
    });
    console.log(loadedTimes);

    //add signup buttons
    /* //OLD SYSTEM --- HARD CODED FOR 8:00 & 9:00 (BAD) 
    if(fellowsCount<4 && !pastEvent){
        let preview = document.getElementById('fellows-preview');
        let signup = document.createElement('div');
        signup.classList.add('icon');
        signup.innerHTML=`<div class="memberItem add-event" onclick="console.log('signup-8'); signup('${date}',20)"><h1>8:00</h1><a>Sign Up</a><p style="opacity:0">8:00</p></div>`
        if(time8<2){
            preview.insertBefore(signup, preview.childNodes[time8]);
        }
        signup = document.createElement('div');
        signup.onclick = `console.log('signup')`;
        signup.classList.add('icon');
        signup.innerHTML=`<div class="memberItem add-event" onclick="console.log('signup-9'); signup('${date}',21)"><h1>9:00</h1><a>Sign Up</a><p style="opacity:0">9:00</p></div>`;
        if(time9<2){
            preview.appendChild(signup);
        }        
    }*/

    //add signup buttons
    //loop for every session on a day
    if (!pastEvent) {//dont add signups for past days
        daySchedule = scheduleJSON.schedule[dayNames[date.getDay()]];
        console.log(daySchedule);
        daySchedule.forEach((session) => {
            let remainingSlots = (loadedTimes[Math.round(session.time * 60)] ? session.maxFellows - loadedTimes[Math.round(session.time * 60)] : session.maxFellows) //default 0 signed up
            if (remainingSlots > 0) {
                //only display signup button if available slots
                let sessionTimeString = new Date(date.toLocaleDateString() + " " + Math.floor(session.time) + ":" + Math.round((session.time % 1) * 60)).toLocaleTimeString('en-US');
                sessionTimeString = sessionTimeString.substring(0, sessionTimeString.lastIndexOf(":")) + sessionTimeString.substring(sessionTimeString.lastIndexOf(" "));

                console.log((date.toLocaleDateString() + " " + Math.floor(session.time) + ":" + Math.round((session.time % 1) * 60)), sessionTimeString);
                let preview = document.getElementById('fellows-preview');
                let signup = document.createElement('div');
                signup.classList.add('icon');
                signup.innerHTML = `<div class="memberItem add-event" onclick="console.log('signup-${session.time}'); signup('${date}',${session.time},${session.duration},'${session.location}')"><h1>${sessionTimeString}</h1><p>${(session.location ? session.location : "")}</p><a>Sign Up</a></div>`;
                preview.appendChild(signup);
            }
        })
    }
}


function cancelEvent(id) {
    $.post("https://peddiecs.peddie.org/nodejs/csfellows/schedule/cancel", {
        token: getCookie('credential'),
        id: id
    }, function (res) {
        console.log(res);
        if (res.message == "success") {
            var day = document.getElementById('event-' + id).parentElement;
            document.getElementById('event-' + id).remove();
            document.getElementById('fellow-' + id).remove();

            var events = loadedMonths.get([saveDate.getFullYear(), saveDate.getMonth()].toString());
            for (let i = events.length - 1; i >= 0; i--) {
                if (events[i].id == id) {
                    events.splice(i, 1);
                }
            }
            console.log("Removed event-" + id);
            day.click();//(there is a better way to do this) reload current day

        }
    });
}

function signup(date, hour, duration, location) {
    //over complicated b/c of how the date-time is saved in app.js (GMT+00:00) and then loaded, fix later
    date = new Date(date);
    date.setUTCHours(Math.floor(hour));
    date.setUTCMinutes(Math.round((hour % 1) * 60));
    console.log(date);

    $.post('https://peddiecs.peddie.org/nodejs/csfellows/schedule', {
        token: getCookie('credential'),
        name: userData.first_name + " " + userData.last_name,
        date: date,
        duration: duration,
        location: location
    }, function (res) {
        console.log(res);
        if (res.message == 'success') {
            var formatDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getUTCHours() + ':' + date.getUTCMinutes() + ':00.000';
            loadedMonths.get([date.getFullYear(), date.getMonth()].toString()).push({ 'name': userData.first_name + ' ' + userData.last_name, 'email': userData.email, 'date': formatDate, 'duration': duration, 'id': res.id });

            document.getElementById('day-' + date.getDate()).innerHTML += `<div class="event" id="event-${res.id}" style="background-color:${stringToColor(userData.email)}; border-color:#00000000" >${userData.first_name + ' ' + userData.last_name}</div>`;

            document.getElementById('day-' + date.getDate()).click();//again, this is a better way
        }
    });
}

function DEBUGfillCalendar(year, month) {
    var date;
    if (year && month) date = new Date(year, month);
    else date = new Date();
    console.log(date);

    //get all members
    $.get("/nodejs/admin/getAllMembers", {
        token: getCookie('credential')
    }, function (res) {
        var members = res.message;
        $.get('https://peddiecs.peddie.org/nodejs/csfellows/schedule', {
            date: date
        }, function (res) {
            var schedule = res.schedule;
            var month = [];
            for (let i = 0; i < monthDays[date.getMonth()]; i++) month[i] = 0;
            for (let i = 0; i < schedule.length; i++) month[new Date(schedule[i].date.substring(0, schedule[i].date.length - 1)).getDate() - 1]++;

            console.log(members);

            var newSchedule = [];
            for (let i = 0; i < month.length; i++) {
                newSchedule[i] = [];
                for (let j = 0; j < 4 - month[i]; j++) {
                    let r = Math.floor(Math.random() * members.length)
                    console.log(date);
                    newSchedule[i][j] = { name: members[r].first_name + ' ' + members[r].last_name, email: members[r].email, date: date }
                }
            }

            console.log(newSchedule);

            $.post('https://peddiecs.peddie.org/nodejs/csfellows/schedule/month', {
                token: getCookie('credential'),
                schedule: newSchedule
            }, function (res) {
                console.log(res);
            });
        });


    });
}