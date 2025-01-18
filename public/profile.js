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
const postText = document.getElementById("post-text")
const gabeBookButton = document.getElementById("gabebook-icon")
const postContainer = document.getElementById("posts-get-appended-here");
import {capitalizeFirstLetter, formatDateTime, timeAgo} from './clientUtils.js';

async function updateNames(){
    let firstName = capitalizeFirstLetter(JSON.parse(localStorage.getItem('firstName')));
    let lastName = capitalizeFirstLetter(JSON.parse(localStorage.getItem('lastName')));
    pageHeaderName.innerHTML = `${firstName} ${lastName}`;
    profileContentHeaderName.innerHTML = `${firstName} ${lastName}`;
}

function post(){
    let postErrorMessage = document.getElementById("post-error-message");
    let text = postText.value;
    const values = {
        text
    }
    // if length is outrageous, dont attempt to send request
    if(text.length > 1500){
        postErrorMessage.innerHTML = "Extreme post length detected; rejecting request!";
        postText.value = "";
        return;
    }
    fetch('/csrf-token')
    .then(response => response.json())  // first fetch for CSRF token
    .then(data => {
        const csrfToken = data.csrfToken; 

        return fetch('/post/submitPost', { // prefix with / for absolute path
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
        const status = response.status;
        return response.json().then((data) => ({ status, data }));
    }).then(({ status, data }) => {
        if(data.success){
            window.location.href = '/user/profile';
        } else {
            switch(status){
                case 413:{
                    postErrorMessage.innerHTML = "Extreme post length detected; rejecting request!";
                } break;
                case 400:{ // display error to user
                    postErrorMessage.innerHTML = data.message;
                    if(data.message == "Text too long"){
                        postErrorMessage.innerHTML += ` ${text.length}/1000`; // hopefully this += doesnt break any DOM functionality
                    }
                } break;
                case 401:{ // redirect to homepage
                    if(data.message == "Session expired"){
                        let globalError = {status:true, message: "Session Expired"};
                        sessionStorage.setItem('globalError', JSON.stringify(globalError));
                        window.location.href = '/';
                    }  
                }
            }
        }
    }).catch(error => {
        console.error('post failure', error);
    })
}

function deletePost(postId){
    const values = {
        postId
    }
    fetch('/csrf-token')
    .then(response => response.json())  // first fetch for CSRF token
    .then(data => {
        const csrfToken = data.csrfToken; 

        return fetch('/post/deletePost', { // prefix with / for absolute path
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
        const status = response.status;
        return response.json().then((data) => ({ status, data }));
    }).then(({ status, data }) => {
        if(data.success){
            window.location.href = '/user/profile';
        } else {
            switch(status){
                case 401:{ // redirect to homepage
                    if(data.message == "Session expired"){
                        let globalError = {status:true, message: "Session Expired"};
                        sessionStorage.setItem('globalError', JSON.stringify(globalError));
                        window.location.href = '/';
                    }  
                }
            }
        }
    }).catch(error => {
        console.error('post delete failure', error);
    })
}

function initializeEventListeners(){
    let postButton = document.getElementById("submit-post-button");
    postButton.addEventListener('click', () => post());
    
    const postContainer = document.getElementById("posts-get-appended-here");

    postContainer.addEventListener("click", (event) => {
        if(event.target && event.target.classList.contains("delete-post-button")) {
            const postId = event.target.dataset.id; 
            deletePost(postId);
        }
    });

}

async function populatePosts(){

    let firstName = capitalizeFirstLetter(JSON.parse(localStorage.getItem('firstName')));
    let lastName = capitalizeFirstLetter(JSON.parse(localStorage.getItem('lastName')));

    fetch("/post/getPosts")
    .then(response => response.json())
    .then(data => {
        if(!data.success){
            if(data.message == "Session expired"){
                let globalError = {status:true, message: "Session Expired"};
                sessionStorage.setItem('globalError', JSON.stringify(globalError));
                window.location.href = '/';
            }
        } else if(data.posts) {
            data.posts.forEach(postData => {
                let text = postData.text;
                let datetime = postData.datetime;
                let post = `<div class="profile-content-body-right-feed regular-border">
                    <div class="profile-content-body-right-feed-post">
                        <div class="profile-content-body-right-feed-post-header">
                        
                            <img src="/images/default-avatar.jpg" class="post-profile-pic">
                            <div class="post-profile-nametime">
                                <div class="post-profile-name post-profile-header-text">${firstName} ${lastName}</div>
                                <div class="post-profile-time post-profile-header-text">${formatDateTime(datetime)} (${timeAgo(datetime)})</div>
                            </div>
                            <div class="delete-post-button-div">
                                <button class="delete-post-button" data-id=${postData.postId}>Delete</button>
                            </div>
                        </div>
                        <div class="post-textarea post-content post-element">
                            ${text}
                        </div>
                        <div class="post-bottom regular-border">
                            <div class="post-bottom-internal">
                                <div class="post-buttons post-content">
                                    <button class="post-button regular-border" >Like</button>
                                    <button class="post-button regular-border">Comment</button>
                                </div>
                                <div class="post-likes post-content regular-border post-bottom">
                                    <span>Bob</span>
                                    <span> and 5 others liked this</span>
                                </div>
                                <div class="post-comments regular-border post-bottom post-content">
                                    Comments will go here
                                    <div class="post-comment"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
                postContainer.insertAdjacentHTML('beforeend', post);
            })
        }
    }).catch(error => {
        console.error(`error: ${error.message}`);
    })
}

async function resetErrors(){
    let postErrorMessage = document.getElementById("post-error-message");
    postErrorMessage.innerHTML = "";
}

async function loadPage(){
    await resetErrors();
    await updateNames();
    await populatePosts();
    initializeEventListeners();    
}

loadPage();