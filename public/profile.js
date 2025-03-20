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
import * as clientUtils from './clientUtils.js';
let _csrf;
let profilePic;
const blobCache = {};
let firstName = "";
let lastName = ""; 

// this function loads the name, profile pic, and header pic for the profile page
async function loadProfileNamesImagesInfo(){ // todo update add param hash(userId)
    try {
        // updating firstName and lastName page variables 
        const getName = await clientUtils.networkRequestJson("/user/getName");
        if(getName.data.success){
            firstName = getName.data.firstName;
            lastName = getName.data.lastName;
            pageHeaderName.innerHTML = `${firstName} ${lastName}`;
            profileContentHeaderName.innerHTML = `${firstName} ${lastName}`;
        }

        // get blob for profile picture
        const getProfilePicLocator = await clientUtils.networkRequestJson(`/user/getProfilePicLocator`);
        profilePic = await clientUtils.getBlobOfSavedImage(blobCache, getProfilePicLocator.data.profilePic);
        document.getElementById('profile-pic').src = profilePic;

        // get blob for header picture (profile header, not page header)
        const getHeaderPicLocator = await clientUtils.networkRequestJson(`/user/getHeaderPicLocator`);
        const headerPic = await clientUtils.getBlobOfSavedImage(blobCache, getHeaderPicLocator.data.headerPic);
        document.getElementById('profile-header').style.backgroundImage = `url("${headerPic}")`;

        // update info area
        const occupationText = document.getElementById('occupation-text');
        const schoolText = document.getElementById('school-text');
        const locationText = document.getElementById('location-text');
        const hometownText = document.getElementById('hometown-text');
        
        const getInfo = await clientUtils.networkRequestJson("/user/getInfo");
        if(getInfo.data.success){
            occupationText.innerText = getInfo.data.job;
            schoolText.innerText = getInfo.data.education;
            locationText.innerText = getInfo.data.location;
            hometownText.innerText = getInfo.data.hometown;
        }
    
        employmentFixIndefiniteArticle();
    } catch (error){
        console.error(`error: ${error.message}`);
    }
}

// this function writes a post for the current session user
async function post(){
    try {
        const postErrorMessage = document.getElementById("post-error-message");
        const postTextArea = document.getElementById("post-text");
        let text = postTextArea.value
        if(text.length > 1500){
            postErrorMessage.innerHTML = `Excessive post length: ${text.length}/1000`;
            postTextArea.value = "";
            return; // reject this request early
        }

        const submitPost = await clientUtils.networkRequestJson('/post/submitPost', { 
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
                'X-CSRF-Token': _csrf
            },
            body: JSON.stringify({
                text
            })}
        );

        if(submitPost.data.success){
            window.location.reload(); 
        } else {
            let errorMessage = submitPost.data.message;
            if(submitPost.data.message == "Excessive post length"){
                errorMessage += `: ${text.length}/1000`;
            }
            postErrorMessage.innerHTML = errorMessage;
        }
    } catch (error){
        console.error(`error: ${error.message}`);
    }
}

// delete post attempt made by current session user
async function deletePost(postId){ 
    try {
        const deletePost = await clientUtils.networkRequestJson('/post/deletePost', { 
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
                'X-CSRF-Token': _csrf
            },
            body: JSON.stringify({
                postId,
            })}
        );

        if(deletePost.data.success){
            document.getElementById(`post-${postId}`).remove();
            // window.location.reload(); 
        }

    } catch (error){
        console.error(`error: ${error.message}`);
    }

}

// like post attemp made by current session user
async function likePost(postId){
    try {
        const likePost = await clientUtils.networkRequestJson('/likes/likePost', {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
                'X-CSRF-Token': _csrf // value obtained from clientUtils func clientUtils.get_csrfValue 
            },
            body: JSON.stringify({
                postId,
            })}
        );

        if(likePost.data.success){
            let likeButtonText = document.getElementById(`like-text-${postId}`);
            let likeButtonCountElement = document.getElementById(`like-count-${postId}`);
            let likeButtonCountValue = parseInt(likeButtonCountElement.innerText, 10);
            if(likePost.data.message == "Post liked"){ // user has liked the post
                likeButtonText.innerText = "Unlike";
                likeButtonCountValue++;
            } else { // user has disliked the post (removed their like)
                likeButtonText.innerText = "Like";
                likeButtonCountValue--;
            }
            likeButtonCountElement.innerText = likeButtonCountValue; 
            let likeButtonPluralOrSingular = document.getElementById(`like-plural-or-singular-${postId}`);
            likeButtonCountValue === 1 ? likeButtonPluralOrSingular.innerText = " like" : likeButtonPluralOrSingular.innerText = " likes";
        }
    } catch (error) {
        console.error(`error: ${error.message}`);
    }
}

// places where we should use a or an for the profile page
function employmentFixIndefiniteArticle(){
    const workedAs = document.getElementById('profile-content-body-left-about-occupation');
    const occupationText = document.getElementById('occupation-text');
    if(clientUtils.startsWithVowel(occupationText.innerText)){
        // must not use innerText as this overrides child nodes!
        workedAs.childNodes[0].nodeValue = "Works as an ";
    } else {
        workedAs.childNodes[0].nodeValue = "Works as a ";
    }
    workedAs.offsetHeight; // trigger reflow so changes render!
}

// likes (or unlikes) a comment as a sessionUser
async function likeComment(commentId){ // update to take hash(userId) as parameter
    try {
        const likeComment = await clientUtils.networkRequestJson('/likes/likeComment', { 
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
                'X-CSRF-Token': _csrf
            },
            body: JSON.stringify({
                commentId
            })}
        );
        if(likeComment.data.success){
            const likeButtonText = document.getElementById(`comment-like-text-${commentId}`);
            const likeButtonCountElement = document.getElementById(`comment-like-count-${commentId}`);
            let likeButtonCountValue = parseInt(likeButtonCountElement.innerText, 10);
            if(likeComment.data.message == "Comment liked"){ // user has liked the post
                likeButtonText.innerText = "Unlike";
                likeButtonCountValue++;
            } else { // user has disliked the post (removed their like)
                likeButtonText.innerText = "Like";
                likeButtonCountValue--;
            }
            likeButtonCountElement.innerText = likeButtonCountValue; 
            const likeButtonPluralOrSingular = document.getElementById(`comment-plural-or-singular-${commentId}`);
            likeButtonCountValue === 1 ? likeButtonPluralOrSingular.innerText = " like" : likeButtonPluralOrSingular.innerText = " likes";
        }
    } catch (error){
        console.error(`error: ${error.message}`);
    }
}

// deletes a comment as sessionUser
async function deleteComment(commentId){ // todo add hash(userId) as param to verify interaction
    try {
        const deleteComment = await clientUtils.networkRequestJson('/comment/deleteComment', {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
                'X-CSRF-Token': _csrf
            },
            body: JSON.stringify({
                commentId,
            })}
        );
        if(deleteComment.data.success){
            document.getElementById(`comment-${commentId}`).remove();
        }
    } catch (error){
        console.error(`error: ${error.message}`);
    }
}

// submit comment as sessionUser
async function submitComment(postId){ // todo add 
    const text = document.getElementById(`new-comment-textarea-${postId}`);
    const commentErrorMessage = document.getElementById(`new-comment-error-message-${postId}`);
    let textLength = parseInt(text.value.length);
    if(textLength > 200){
        commentErrorMessage.innerHTML = `Error: Comment length (${textLength}/200)`;
        commentErrorMessage.style.display = "block";
        text.value.value = "";
        return;
    }
    const submitComment = await clientUtils.networkRequestJson('/comment/submitComment', {
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
            'X-CSRF-Token': _csrf
        },
        body: JSON.stringify({
            text: text.value, 
            postId: postId
        })}
    );

    if(submitComment.data.success){
        window.location.reload();
    } else if(submitComment.data.status == 400){
        commentErrorMessage.style.display = "block";
        commentErrorMessage.innerHTML = `Error: ${data.message}`;
    }
}

// handles edit profile / save changes button for info area and pictures for profile page
// applies changes to session user
async function aboutAreaAndPicturesChange(){
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

    clientUtils.styleDisplayBlockHiddenSwitch(profilePic, true);
    clientUtils.styleDisplayBlockHiddenSwitch(profilePicUpload, true);
    clientUtils.styleDisplayBlockHiddenSwitch(headerPicUpload, true);

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

                if(!clientUtils.isValidImage(file)){
                    validImage = false;
                    updateInfoErrorMessage.innerText = `${headerOrProfile} file must be ` + Object.values(clientUtils.validImageMIMETypes).flat().join(", ");
                } else if(file.size >= 100000000){ // 0.1 gigabytes
                    console.error(file.size);
                    validImage = false;
                    updateInfoErrorMessage.innerText = `${headerOrProfile} file must be less than 100MB`;
                }
                if(validImage){
                    const formData = new FormData(); // image stuff...
                    formData.append("file", file);
                    try {
                        const updateImage = await clientUtils.networkRequestJson(route, {
                            method: 'POST',
                            headers:{
                                'X-CSRF-Token': _csrf
                            },
                            body: formData
                        });
                        
                        if(updateImage.data.success){
                            imageUpdated = true;
                        }
                    } catch (error){
                        console.error(`error: ${error.message}`);
                    }
                }
            }
            pictureUploads[i].value = "";
            headerDiv.style.backgroundSize = "100% 100%"; // show the header div's background
        }
    }
    
    for(let i = 0; i < 4; i++){
        clientUtils.styleDisplayBlockHiddenSwitch(textAreas[i], true);
        if(editMode){ // update now visible textareas
            text[i].dataset.oldText = text[i].innerText;
            textAreas[i].value = text[i].innerText;
            text[i].innerText = " ";
        } else { // save potential changes from textareas
            let value = textAreas[i].value;
            if(text[i].dataset.oldText != value){ // is there a change to save?
                value = value.length > 45 ? value.slice(0, 45) : value;
                value = clientUtils.removeTabsAndNewlines(value);
                try {
                    const updateInfo = await clientUtils.networkRequestJson('/user/updateInfo', {
                        method: 'POST',
                        headers:{
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': _csrf
                        },
                        body: JSON.stringify({
                            text: value, 
                            infoNumber: i
                        })
                    });
                    if(updateInfo.data.success && i == 0){
                        text[i].innerText = value; // make sure its available for indefinite article check
                        employmentFixIndefiniteArticle();
                    }
                } catch (error){
                    console.error(`error: ${error.message}`);
                }
            }
            text[i].innerText = value; // even if it wasn't changed!
        }
    }
    if(!editMode && imageUpdated){ // refresh page so new pictures render!
        window.location.reload();    
    }

}

function initializeEventListeners(){
    let postButton = document.getElementById("submit-post-button");
    postButton.addEventListener('click', () => post());
    
    let updateInfoButton = document.getElementById("updateInfoButton");
    updateInfoButton.addEventListener('click', () => {
        aboutAreaAndPicturesChange();
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
            clientUtils.styleDisplayBlockHiddenSwitch(writeCommentDiv);
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
    const response = await fetch("/post/getPosts");
    const data = await response.json();

    if(!data.success){
        if(data.message == "Session expired"){
            let globalError = {status:true, message: "Session Expired"};
            sessionStorage.setItem('globalError', JSON.stringify(globalError));
            window.location.href = '/';
        }
    }
    if(data.posts){
        for(const postData of data.posts){
            let HTMLcomments = [""]
            if(postData.comments[0]){
                postData.comments.sort((a, b) => new Date(a.commentDatetime) - new Date(b.commentDatetime));
                for (const commentData of postData.comments) {
                    let pluralOrSingular = commentData.commentLikeCount !== 1 ? "s" : "";
                    let likeOrUnlike = commentData.userLikedComment ? "Unlike" : "Like";
                    let image = await clientUtils.getBlobOfSavedImage(blobCache, commentData.authorProfilePic);
                    let comment = `<div class="post-comments post-bottom regular-border data-commentId="${commentData.commentId}" id=comment-${commentData.commentId}>
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
                                                    <div class="post-comment-date post-comment-small-text">${clientUtils.timeAgo(commentData.commentDatetime)}</div>
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

            let post = `<div class="profile-content-body-right-feed regular-border" id="post-${postData.postId}">
                            <div class="profile-content-body-right-feed-post">
                                <div class="profile-content-body-right-feed-post-header">
                                    <img src=${profilePic} class="post-profile-pic">
                                    <div class="post-profile-nametime">
                                        <div class="post-profile-name post-profile-header-text">${firstName} ${lastName}</div>
                                        <div class="post-profile-time post-profile-header-text">${clientUtils.formatDateTime(datetime)} (${clientUtils.timeAgo(datetime)})</div>
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
}

async function resetErrors(){
    document.getElementById("post-error-message").innerHTML = "";
    document.getElementById("update-info-error-text").innerHTML = "";
}

async function loadPage(){
    _csrf = await clientUtils.get_csrfValue();
    await resetErrors();
    await loadProfileNamesImagesInfo();
    await populatePosts();
    initializeEventListeners();    
}

loadPage();