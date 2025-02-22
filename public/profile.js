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
const gabeBookButton = document.getElementById("gabebook-icon")
const postContainer = document.getElementById("posts-get-appended-here");
import {capitalizeFirstLetter, formatDateTime, timeAgo, get_csrfValue} from './clientUtils.js';
let _csrf;

async function updateNames(){
    let firstName = capitalizeFirstLetter(localStorage.getItem('firstName'));
    let lastName = capitalizeFirstLetter(localStorage.getItem('lastName'));
    pageHeaderName.innerHTML = `${firstName} ${lastName}`;
    profileContentHeaderName.innerHTML = `${firstName} ${lastName}`;
}

function post(){
    let postErrorMessage = document.getElementById("post-error-message");
    let text = document.getElementById("post-text").value;
    const values = {
        text
    }
    // if length is outrageous, dont attempt to send request
    if(text.length > 1500){
        postErrorMessage.innerHTML = "Extreme post length detected; rejecting request!";
        postText.value = "";
        return;
    }
    fetch('/post/submitPost', { // prefix with / for absolute path
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
            'X-CSRF-Token': _csrf
        },
        body: JSON.stringify({
            values: values,
        })
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
    fetch('/post/deletePost', { // prefix with / for absolute path
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
            'X-CSRF-Token': _csrf
        },
        body: JSON.stringify({
            values: values,
        })
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

function likePost(postId){
    const values = {
        postId
    }
    fetch('/likes/likePost', { // prefix with / for absolute path
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
            'X-CSRF-Token': _csrf // value obtained from clientUtils func get_csrfValue 
        },
        body: JSON.stringify({
            values: values,
        })
    }).then(response => {
        const status = response.status;
        return response.json().then((data) => ({ status, data }));
    }).then(({ status, data }) => {
        if(data.success){
            let likeButtonText = document.getElementById(`like-text-${postId}`);
            let likeButtonCountElement = document.getElementById(`like-count-${postId}`);
            let likeButtonCountValue = parseInt(likeButtonCountElement.innerText, 10);
            if(data.message == "Post liked"){ // user has liked the post
                likeButtonText.innerText = "Unlike";
                likeButtonCountValue++;
            } else { // user has disliked the post (removed their like)
                likeButtonText.innerText = "Like";
                likeButtonCountValue--;
            }
            likeButtonCountElement.innerText = likeButtonCountValue; 
            let likeButtonPluralOrSingular = document.getElementById(`like-plural-or-singular-${postId}`);
            likeButtonCountValue === 1 ? likeButtonPluralOrSingular.innerText = " like" : likeButtonPluralOrSingular.innerText = " likes";
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

// adds the textarea to the bottom of a post so user may leave comment
function addWriteCommentDivToPost(postId){
    const writeCommentDiv = document.getElementById(`write-comment-${postId}`);
    if(writeCommentDiv.style.display == "block"){
        writeCommentDiv.style.display = "none";
    } else {
        writeCommentDiv.style.display = "block";    
    }
}

function likeComment(commentId){
    const values = {
        commentId
    }
    fetch('/likes/likeComment', { 
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
            'X-CSRF-Token': _csrf // value obtained from clientUtils func get_csrfValue 
        },
        body: JSON.stringify({
            values: values,
        })
    }).then(response => {
        const status = response.status;
        return response.json().then((data) => ({ status, data }));
    }).then(({ status, data }) => {
        if(data.success){
            let likeButtonText = document.getElementById(`comment-like-text-${commentId}`);
            let likeButtonCountElement = document.getElementById(`comment-like-count-${commentId}`);
            let likeButtonCountValue = parseInt(likeButtonCountElement.innerText, 10);
            if(data.message == "Comment liked"){ // user has liked the post
                likeButtonText.innerText = "Unlike";
                likeButtonCountValue++;
            } else { // user has disliked the post (removed their like)
                likeButtonText.innerText = "Like";
                likeButtonCountValue--;
            }
            likeButtonCountElement.innerText = likeButtonCountValue; 
            let likeButtonPluralOrSingular = document.getElementById(`comment-plural-or-singular-${commentId}`);
            likeButtonCountValue === 1 ? likeButtonPluralOrSingular.innerText = " like" : likeButtonPluralOrSingular.innerText = " likes";
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
            console.error(data.message);
        }
    }).catch(error => {
        console.error('like comment failure', error);
    })
}

function deleteComment(commentId){
    const values = {
        commentId
    }
    fetch('/comment/deleteComment', { // prefix with / for absolute path
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
            'X-CSRF-Token': _csrf
        },
        body: JSON.stringify({
            values: values,
        })
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

function submitComment(postId){
    const text = document.getElementById(`new-comment-textarea-${postId}`);
    const commentErrorMessage = document.getElementById(`new-comment-error-message-${postId}`);
    // block request if its too long
    let textLength = parseInt(text.value.length);
    // block request if its too long
    if(textLength > 200){
        let extraChars = textLength;
        commentErrorMessage.innerHTML = `Error: Comment length (${extraChars}/200)`;
        commentErrorMessage.style.display = "block";
        text.value.value = "";
        return;
    }
    fetch('/comment/submitComment', { // prefix with / for absolute path
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
            'X-CSRF-Token': _csrf
        },
        body: JSON.stringify({
            text: text.value, 
            postId: postId
        })
    }).then(response => {
        const status = response.status;
        return response.json().then((data) => ({ status, data }));
    }).then(({ status, data }) => {
        if(data.success){
            window.location.href = '/user/profile';
        } else {
            switch(status){
                case 400:{ // display error to user
                    commentErrorMessage.style.display = "block";
                    commentErrorMessage.innerHTML = `Error: ${data.message}`;
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



function initializeEventListeners(){
    let postButton = document.getElementById("submit-post-button");
    postButton.addEventListener('click', () => post());
    
    const postContainer = document.getElementById("posts-get-appended-here");

    // posts and everything inside of them should be handlded like this (DOM updates here cause reference breaks)
    postContainer.addEventListener("click", (event) => {
        if(!event.target){
            return
        }
        const postId = event.target.dataset.id; 
        const commentId = event.target.dataset.commentId;
        // postId will be undefined here if you click in the post container not on a button
        if(event.target.classList.contains("delete-post-button")) {
            deletePost(postId);
        } else if(event.target.classList.contains("like-button")) {
            likePost(postId);
        } else if(event.target.classList.contains("comment-button")){
            addWriteCommentDivToPost(postId);
        } else if(event.target.classList.contains("submit-comment-button")){
            submitComment(postId);
        } else if(event.target.classList.contains("delete-comment-button")){
            deleteComment(commentId);
        } else if(event.target.classList.contains("post-comment-like-button")){
            likeComment(commentId);
        }
    });

}

async function populatePosts(){
    let firstName = capitalizeFirstLetter(localStorage.getItem('firstName'));
    let lastName = capitalizeFirstLetter(localStorage.getItem('lastName'));

    fetch("/post/getPosts").then(response => response.json()).then(data => {
        
        if(!data.success){
            if(data.message == "Session expired"){
                let globalError = {status:true, message: "Session Expired"};
                sessionStorage.setItem('globalError', JSON.stringify(globalError));
                window.location.href = '/';
            }
        }
        data.posts.forEach(postData => { // foreach post
            let HTMLcomments = [""]
            if(postData.comments[0]){
                postData.comments.forEach(commentData => { // foreach comment: formulate html comment and push back to comments array
                    let pluralOrSingular = commentData.commentLikeCount !== 1 ? "s" : "";
                    let likeOrUnlike = commentData.userLikedComment ? "Unlike" : "Like";
                    let comment = `<div class="post-comments post-bottom regular-border data-commentId="${commentData.commentId}">
                                        <div class="post-comment post-bottom regular-border" >
                                            <div class="post-comment-left">
                                                <img src="/images/default-avatar.jpg" class="comment-profile-pic">
                                            </div>
                                            <div class="post-comment-right">
                                                <div class="post-comment-name-text">
                                                    <div class="post-comment-profile-name">
                                                        ${commentData.authorFirstName} ${commentData.authorLastName}
                                                    </div>
                                                    <div class="delete-comment-button-div">
                                                        <button class="delete-comment-button" data-comment-id="${commentData.commentId}">Delete</button>
                                                    </div>
                                                </div>
                                                <div class="post-comment-text">
                                                    ${commentData.commentText}
                                                </div>
                                                <div class="post-comment-date-likes">
                                                    <div class="post-comment-date post-comment-small-text">${timeAgo(commentData.commentDatetime)}</div>
                                                    <div class="post-comment-like-button" data-comment-id="${commentData.commentId}" id=comment-like-text-${commentData.commentId}>${likeOrUnlike}</div>    
                                                    <div class="post-comment-num-likes post-comment-small-text">
                                                        <span class="comment-like-count" id=comment-like-count-${commentData.commentId}>${commentData.commentLikeCount}</span><span class="like-text" id=comment-plural-or-singular-${commentData.commentId}> like${pluralOrSingular}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>`
                    HTMLcomments.push(comment); 
                }) // end foreach comment
            }
            let postNumLikes = postData.postNumLikes;
            let likeOrUnlike = postData.userLikedPost ? "Unlike" : "Like";
            let pluralOrSingular = postData.postNumLikes !== 1 ? "s" : ""; 
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
                                            <button class="post-button regular-border like-button" id=like-text-${postData.postId} data-id=${postData.postId}>${likeOrUnlike}</button>
                                            <button class="post-button regular-border comment-button" data-id=${postData.postId}>Comment</button>
                                        </div>
                                        <div class="post-likes post-content regular-border post-bottom">
                                            <span class="like-count" id=like-count-${postData.postId}>${postNumLikes}</span><span class="like-text" id=like-plural-or-singular-${postData.postId}> like${pluralOrSingular}</span> 
                                        </div>
                                        <div class="post-comments post-bottom post-content regular-border">
                                            ${HTMLcomments.join("")}
                                        </div>
                                        <div class="write-comment-gets-appended-here" id=write-comment-${postData.postId} style="display: none;">
                                            <div class="post-write-comment post-bottom regular-border post-content">
                                                <textarea class="post-write-comment-textarea" placeholder="Write a comment..." id="new-comment-textarea-${postData.postId}"></textarea>
                                                <button class="profile-content-header-extra-buttons submit-comment-button" data-id="${postData.postId}">Comment</button>
                                            </div>
                                            <span class="error-text write-comment-error-message" id="new-comment-error-message-${postData.postId}" style="display: none;"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`
            postContainer.insertAdjacentHTML('beforeend', post);
        })
    }).catch(error => {
        console.error(`error: ${error.message}`);
    });
}

async function resetErrors(){
    let postErrorMessage = document.getElementById("post-error-message");
    postErrorMessage.innerHTML = "";
}

async function loadPage(){
    _csrf = await get_csrfValue();
    await resetErrors();
    await updateNames();
    await populatePosts();
    initializeEventListeners();    
}

loadPage();