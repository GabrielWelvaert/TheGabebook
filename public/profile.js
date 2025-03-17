// window.onload = function() {
//     const divs = document.querySelectorAll('div');
//     divs.forEach(div => {
//         div.style.border = '1px solid red';
//     });
// };

// user/profile (profile.js) is for viewing one's own profile
// user/profile?hash(id) is for viewing another person's profile


const pageHeaderName = document.getElementById("header-name");
const profileContentHeaderName = document.getElementById("profile-content-header-name");
const gabeBookButton = document.getElementById("gabebook-icon")
const postContainer = document.getElementById("posts-get-appended-here");
import {getBlobOfSavedImage, isValidImage, validImageMIMETypes, startsWithVowel, capitalizeFirstLetter, formatDateTime, timeAgo, get_csrfValue, styleDisplayBlockHiddenSwitch, removeTabsAndNewlines} from './clientUtils.js';
let _csrf;
let profilePic;
const blobCache = {};

async function updateNamesAndPictures(){
    let firstName = capitalizeFirstLetter(localStorage.getItem('firstName'));
    let lastName = capitalizeFirstLetter(localStorage.getItem('lastName'));
    pageHeaderName.innerHTML = `${firstName} ${lastName}`;
    profileContentHeaderName.innerHTML = `${firstName} ${lastName}`;

    const profilePicElement = document.getElementById('profile-pic');
    const getProfilePicLocator = await fetch(`/user/getProfilePicLocator`);
    const profilePicData = await getProfilePicLocator.json();
    profilePic = await getBlobOfSavedImage(blobCache, profilePicData.profilePic);
    profilePicElement.src = profilePic;

    const headerPicElement = document.getElementById('profile-header');
    const getHeaderPicLocator = await fetch(`/user/getHeaderPicLocator`);
    const headerPicData = await getHeaderPicLocator.json();
    const headerPic = await getBlobOfSavedImage(blobCache, headerPicData.headerPic);
    headerPicElement.style.backgroundImage = `url("${headerPic}")`;
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

// places where we should use a or an
function fixIndefiniteArticle(){
    const workedAs = document.getElementById('profile-content-body-left-about-occupation');
    const occupationText = document.getElementById('occupation-text');
    if(startsWithVowel(occupationText.innerText)){
        // must not use innerText as this overrides child nodes!
        workedAs.childNodes[0].nodeValue = "Works as an ";
    } else {
        workedAs.childNodes[0].nodeValue = "Works as a ";
    }
    workedAs.offsetHeight; // trigger reflow so changes render!
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

// change UI so that user may edit their about section
async function aboutAreaChange(){
    const updateInfoButton = document.getElementById("updateInfoButton");
    // occupation
    const occupationText = document.getElementById('occupation-text');
    const occupationTextArea = document.getElementById('occupation-textarea');
    const occupationButon = document.getElementById('occupation-button');
    // education
    const schoolText = document.getElementById('school-text');
    const schoolTextArea = document.getElementById('school-textarea');
    const schoolButon = document.getElementById('school-button');
    // location
    const locationText = document.getElementById('location-text');
    const locationTextArea = document.getElementById('location-textarea');
    const locationButon = document.getElementById('location-button');
    // home town
    const hometownText = document.getElementById('hometown-text');
    const hometownTextArea = document.getElementById('hometown-textarea');
    const hometownButon = document.getElementById('hometown-button');

    const profilePic = document.getElementById('profile-pic');
    const profilePicUpload = document.getElementById('profilePicInput');
    const headerDiv = document.getElementById('profile-header');
    const headerPicUpload = document.getElementById('headerPicInput');

    const updateInfoErrorMessage = document.getElementById("update-info-error-text");

    let editMode = false;
    if(updateInfoButton.innerHTML == "Edit Profile"){ // enter edit mode
        editMode = true;
        updateInfoButton.innerHTML = "Save Changes";
    } else { // exit edit mode
        updateInfoButton.innerHTML = "Edit Profile";
    }

    const buttons = [occupationButon, schoolButon, locationButon, hometownButon]
    const textAreas = [occupationTextArea, schoolTextArea, locationTextArea, hometownTextArea]
    const text = [occupationText, schoolText, locationText, hometownText]

    styleDisplayBlockHiddenSwitch(profilePic, true);
    styleDisplayBlockHiddenSwitch(profilePicUpload, true);
    styleDisplayBlockHiddenSwitch(headerPicUpload, true);
    
    const pictureUploads = [profilePicUpload, headerPicUpload];
    let imageUpdated = false; 

    // error text from previous attemp already exists...
    if(updateInfoErrorMessage.innerText){
        updateInfoErrorMessage.innerText = "";
    }

    // profile and header images
    for(let i = 0; i < 2; i++){
        let validImage = true;
        const file = pictureUploads[i].files[0];
        if(editMode){
            headerDiv.style.backgroundSize = "0"; // hide the header div's background
        } else { // exiting edit mode, must check for new profile or header image
            if(file){
                // client side image verificaiton!
                let route = "";
                let headerOrProfile = "";
                switch(i){
                    case 0:{ 
                        route = '/user/updateProfilePic';
                        headerOrProfile = "Profile picture";
                    } break;
                    case 1:{ 
                        route = '/user/updateHeaderPic';
                        headerOrProfile = "Header picture";
                    } break;
                }

                if(!isValidImage(file)){
                    validImage = false;
                    updateInfoErrorMessage.innerText = `${headerOrProfile} file must be ` + Object.values(validImageMIMETypes).flat().join(", ");
                } else if(file.size >= 100000000){ // 0.1 gigabytes
                    console.error(file.size);
                    validImage = false;
                    updateInfoErrorMessage.innerText = `${headerOrProfile} file must be less than 100MB`;
                }
                if(validImage){
                    imageUpdated = true;
                    const formData = new FormData();
                    formData.append("file", file);
                    fetch(route, {
                        method: 'POST',
                        headers:{
                            'X-CSRF-Token': _csrf
                        },
                        body: formData
                    }).then(response => response.json().then(data=>({response,data}))).then(({response,data })=>{
                        if(response.ok){
                                   
                        } else {
                            switch(response.status){
                                case 401:{
                                    if(data.message == "Session expired"){
                                        let globalError = {status:true, message: "Session Expired"};
                                        sessionStorage.setItem('globalError', JSON.stringify(globalError));
                                        window.location.href = '/';
                                    }  
                                }
                            }
                        }
                    }).catch(error => {
                        updateInfoErrorMessage.innerText = `Server Error: ${error.message}`;
                        console.error(`error: ${error.message}`);
                    });
                }
            }
            pictureUploads[i].value = "";
            headerDiv.style.backgroundSize = "100% 100%"; // show the header div's background
        }
    }


    for(let i = 0; i < 4; i++){
        styleDisplayBlockHiddenSwitch(textAreas[i], true);
        if(editMode){ // update now visible textareas
            text[i].dataset.oldText = text[i].innerText;
            textAreas[i].value = text[i].innerText;
            text[i].innerText = " ";
        } else { // save potential changes from textareas
            let value = textAreas[i].value;
            if(text[i].dataset.oldText != value){ // is there a change to save?
                value = value.length > 45 ? value.slice(0, 45) : value;
                value = removeTabsAndNewlines(value);
                fetch('/user/updateInfo', {
                    method: 'POST',
                    headers:{
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': _csrf
                    },
                    body: JSON.stringify({
                        text: value, 
                        infoNumber: i
                    })
                }).then(response => response.json().then(data=>({response,data}))).then(({response,data })=>{
                    if(response.ok){
                        if(i == 0){ // occupation a or an
                            fixIndefiniteArticle();
                        }        
                    } else {
                        switch(response.status){
                            case 401:{
                                if(data.message == "Session expired"){
                                    let globalError = {status:true, message: "Session Expired"};
                                    sessionStorage.setItem('globalError', JSON.stringify(globalError));
                                    window.location.href = '/';
                                }  
                            }
                        }
                    }
                }).catch(error => {
                    console.error(`error: ${error.message}`);
                });
            }
            text[i].innerText = value; // even if it wasn't changed!
        }
    }
    if(!editMode && imageUpdated){ // refresh page so new pictures render!
        window.location.href = '/user/profile';    
    }
}

function initializeEventListeners(){
    let postButton = document.getElementById("submit-post-button");
    postButton.addEventListener('click', () => post());
    
    let updateInfoButton = document.getElementById("updateInfoButton");
    updateInfoButton.addEventListener('click', () => {
        aboutAreaChange();
    })

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
            const writeCommentDiv = document.getElementById(`write-comment-${postId}`);
            styleDisplayBlockHiddenSwitch(writeCommentDiv);
        } else if(event.target.classList.contains("submit-comment-button")){
            submitComment(postId);
        } else if(event.target.classList.contains("delete-comment-button")){
            deleteComment(commentId);
        } else if(event.target.classList.contains("post-comment-like-button")){
            likeComment(commentId);
        }
    });

}

async function populateInfo(){
    const occupationText = document.getElementById('occupation-text');
    const schoolText = document.getElementById('school-text');
    const locationText = document.getElementById('location-text');
    const hometownText = document.getElementById('hometown-text');
    fetch("/user/getInfo").then(response => response.json().then(data=>({response,data}))).then(({response,data })=>{
        if(response.ok){
            occupationText.innerText = data.job;
            schoolText.innerText = data.education;
            locationText.innerText = data.location;
            hometownText.innerText = data.hometown;
        } else {
            switch(response.status){
                case 401:{
                    if(data.message == "Session expired"){
                        let globalError = {status:true, message: "Session Expired"};
                        sessionStorage.setItem('globalError', JSON.stringify(globalError));
                        window.location.href = '/';
                    }  
                } break;
            }
        }

    }).catch(error => {
        console.error(`error: ${error.message}`);
    });

    fixIndefiniteArticle();
}

async function populatePosts(){
    let firstName = capitalizeFirstLetter(localStorage.getItem('firstName'));
    let lastName = capitalizeFirstLetter(localStorage.getItem('lastName'));

    const response = await fetch("/post/getPosts");
    const data = await response.json();

    if(!data.success){
        if(data.message == "Session expired"){
            let globalError = {status:true, message: "Session Expired"};
            sessionStorage.setItem('globalError', JSON.stringify(globalError));
            window.location.href = '/';
        }
    }

    for(const postData of data.posts){
        let HTMLcomments = [""]
        if(postData.comments[0]){
            for (const commentData of postData.comments) {
                let pluralOrSingular = commentData.commentLikeCount !== 1 ? "s" : "";
                let likeOrUnlike = commentData.userLikedComment ? "Unlike" : "Like";
                let image = await getBlobOfSavedImage(blobCache, commentData.authorProfilePic);
                let comment = `<div class="post-comments post-bottom regular-border data-commentId="${commentData.commentId}">
                                    <div class="post-comment post-bottom regular-border" >
                                        <div class="post-comment-left">
                                            <img src=${image} class="comment-profile-pic">
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
            }
        }
        let postNumLikes = postData.postNumLikes;
        let likeOrUnlike = postData.userLikedPost ? "Unlike" : "Like";
        let pluralOrSingular = postData.postNumLikes !== 1 ? "s" : ""; 
        let text = postData.text;
        let datetime = postData.datetime;
        let image = "/images/default-avatar.jpg";

        let post = `<div class="profile-content-body-right-feed regular-border">
                        <div class="profile-content-body-right-feed-post">
                            <div class="profile-content-body-right-feed-post-header">
                                <img src=${profilePic} class="post-profile-pic">
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
    }
}

async function resetErrors(){
    document.getElementById("post-error-message").innerHTML = "";
    document.getElementById("update-info-error-text").innerHTML = "";
}

async function loadPage(){
    _csrf = await get_csrfValue();
    await resetErrors();
    await updateNamesAndPictures();
    await populatePosts();
    await populateInfo();
    initializeEventListeners();    
}

loadPage();