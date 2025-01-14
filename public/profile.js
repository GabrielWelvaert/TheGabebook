// window.onload = function() {
//     const divs = document.querySelectorAll('div');
//     divs.forEach(div => {
//         div.style.border = '1px solid red';
//     });
// };

// user/profile (profile.js) is for viewing one's own profile
// user/profile/id (viewprofile.js) is for viewing another person's profile


const pageHeaderName = document.getElementById("header-name");
const profileContentHeaderName = document.getElementById("profile-content-header-name");
const postButton = document.getElementById("post-button");
const postText = document.getElementById("post-text")
const gabeBookButton = document.getElementById("gabebook-icon")

function getCurrentDateTime() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); 
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return formattedDateTime;
}

function capitalizeFirstLetter(str) {
    if(!str){
        return str;   
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function updateNames(){
    let firstName = capitalizeFirstLetter(JSON.parse(localStorage.getItem('firstName')));
    let lastName = capitalizeFirstLetter(JSON.parse(localStorage.getItem('lastName')));
    pageHeaderName.innerHTML = `${firstName} ${lastName}`;
    profileContentHeaderName.innerHTML = `${firstName} ${lastName}`;
}

function post(){
    let text = postText.value;
    let datetime = getCurrentDateTime();
    const values = {
        text,
        datetime
    }
    fetch('/csrf-token')
    .then(response => response.json())  // first fetch for CSRF token
    .then(data => {
        const csrfToken = data.csrfToken; 

        return fetch('/user/post', { // prefix with / for absolute path
            method: 'POST',
            headers:{
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: values,
                _csrf: csrfToken  // MUST be _csrf   
            })
        });
    }).then(response => {
        return response.json(); // make response avaiable in next then()
    }).then(data => {
        console.log(data.message);
    }).catch(error => {
        console.error('post failure', error);
    })
}

function gabeBookButtonEventHanlder(){

}

function initializeEventListeners(){
    postButton.addEventListener('click', () => post());
    gabeBookButton.addEventListener('click', () =>{
        gabeBookButtonEventHanlder();
    })
}

updateNames();
initializeEventListeners()
// todo redirect to login page if not logged in