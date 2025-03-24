import * as clientUtils from './clientUtils.js';

// global references
const pageHeaderName = document.getElementById("header-name");
const profileContentHeaderName = document.getElementById("profile-content-header-name");
const gabeBookButton = document.getElementById("gabebook-icon")
const postContainer = document.getElementById("posts-get-appended-here");

// global local variables for client viewage
let _csrf;
let profilePic; // profile pic for the profile current viewed
let sessionProfilePic; // profile pic for the session user
const blobCache = {};
let ProfileFirstName = "";
let ProfileLastName = "";
// UUID passed as optional get param
const userUUID = await clientUtils.getProfilePageUUIDParameter(); 
const viewingOwnProfile = !userUUID;

async function loadTopHeaderName(){
    pageHeaderName.innerHTML = `${localStorage.getItem("firstName")} ${localStorage.getItem("lastName")}`; 
}

// this function loads the name, profile pic, and header pic for the profile page. also sets some global variables. call it early enough
async function loadProfileNamesImagesInfo(){
    try {
        // updating firstName and lastName page variables 
        if(viewingOwnProfile){ // name already stored in localStorage
            ProfileFirstName = localStorage.getItem("firstName");
            ProfileLastName = localStorage.getItem("lastName");
        } else {
            const getName = await clientUtils.networkRequestJson(`/user/getName`, userUUID); // getting name of profile viewed
            if(getName.data.success){
                ProfileFirstName = getName.data.firstName;
                ProfileLastName = getName.data.lastName;
            }
        }
        const getSessionProfilePic = await clientUtils.networkRequestJson(`/user/getProfilePicLocator`, undefined);
        sessionProfilePic = await clientUtils.getBlobOfSavedImage(blobCache, getSessionProfilePic.data.profilePic);
        profileContentHeaderName.innerHTML = `${ProfileFirstName} ${ProfileLastName}`; // profile name next to profile picture

        // get blob for profile picture
        const getProfilePicLocator = await clientUtils.networkRequestJson(`/user/getProfilePicLocator`, userUUID);
        profilePic = await clientUtils.getBlobOfSavedImage(blobCache, getProfilePicLocator.data.profilePic);
        document.getElementById('profile-pic').src = profilePic;

        // get blob for header picture (profile header, not page header)
        const getHeaderPicLocator = await clientUtils.networkRequestJson(`/user/getHeaderPicLocator`, userUUID);
        const headerPic = await clientUtils.getBlobOfSavedImage(blobCache, getHeaderPicLocator.data.headerPic);
        document.getElementById('profile-header').style.backgroundImage = `url("${headerPic}")`;

        // update info area
        const occupationText = document.getElementById('occupation-text');
        const schoolText = document.getElementById('school-text');
        const locationText = document.getElementById('location-text');
        const hometownText = document.getElementById('hometown-text');
        
        const getInfo = await clientUtils.networkRequestJson("/user/getInfo", userUUID);
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

        const submitPost = await clientUtils.networkRequestJson('/post/submitPost', userUUID, { 
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
            let post = submitPost.data.post;
            let postHTML = await clientUtils.getPostHTML(blobCache, profilePic, null, post, ProfileFirstName, ProfileLastName);
            document.getElementById('post-textarea-div').insertAdjacentHTML('afterend', postHTML);
            postTextArea.value = "";
            ShowSelfOnlyElements();
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
async function deletePost(postUUID){ 
    try {
        const deletePost = await clientUtils.networkRequestJson('/post/deletePost', userUUID, { 
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
                'X-CSRF-Token': _csrf
            },
            body: JSON.stringify({
                postUUID,
            })}
        );

        if(deletePost.data.success){
            document.getElementById(`post-${postUUID}`).remove();
        }

    } catch (error){
        console.error(`error: ${error.message}`);
    }

}

// like post attemp made by current session user
async function likePost(postUUID){
    try {
        const likePost = await clientUtils.networkRequestJson('/likes/likePost', userUUID, {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
                'X-CSRF-Token': _csrf // value obtained from clientUtils func clientUtils.get_csrfValue 
            },
            body: JSON.stringify({
                postUUID,
            })}
        );

        if(likePost.data.success){
            let likeButtonText = document.getElementById(`like-text-${postUUID}`);
            let likeButtonCountElement = document.getElementById(`like-count-${postUUID}`);
            let likeButtonCountValue = parseInt(likeButtonCountElement.innerText, 10);
            if(likePost.data.message == "Post liked"){ // user has liked the post
                likeButtonText.innerText = "Unlike";
                likeButtonCountValue++;
            } else { // user has disliked the post (removed their like)
                likeButtonText.innerText = "Like";
                likeButtonCountValue--;
            }
            likeButtonCountElement.innerText = likeButtonCountValue; 
            let likeButtonPluralOrSingular = document.getElementById(`like-plural-or-singular-${postUUID}`);
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
async function likeComment(commentUUID){ // update to take hash(userId) as parameter
    try {
        const likeComment = await clientUtils.networkRequestJson('/likes/likeComment', userUUID, { 
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
                'X-CSRF-Token': _csrf
            },
            body: JSON.stringify({
                commentUUID
            })}
        );
        if(likeComment.data.success){
            const likeButtonText = document.getElementById(`comment-like-text-${commentUUID}`);
            const likeButtonCountElement = document.getElementById(`comment-like-count-${commentUUID}`);
            let likeButtonCountValue = parseInt(likeButtonCountElement.innerText, 10);
            if(likeComment.data.message == "Comment liked"){ // user has liked the post
                likeButtonText.innerText = "Unlike";
                likeButtonCountValue++;
            } else { // user has disliked the post (removed their like)
                likeButtonText.innerText = "Like";
                likeButtonCountValue--;
            }
            likeButtonCountElement.innerText = likeButtonCountValue; 
            const likeButtonPluralOrSingular = document.getElementById(`comment-plural-or-singular-${commentUUID}`);
            likeButtonCountValue === 1 ? likeButtonPluralOrSingular.innerText = " like" : likeButtonPluralOrSingular.innerText = " likes";
        }
    } catch (error){
        console.error(`error: ${error.message}`);
    }
}

// deletes a comment as sessionUser
async function deleteComment(commentUUID){ // todo add hash(userId) as param to verify interaction
    try {
        const deleteComment = await clientUtils.networkRequestJson('/comment/deleteComment', userUUID, {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
                'X-CSRF-Token': _csrf
            },
            body: JSON.stringify({
                commentUUID,
            })}
        );
        if(deleteComment.data.success){
            document.getElementById(`comment-${commentUUID}`).remove();
        }
    } catch (error){
        console.error(`error: ${error.message}`);
    }
}

// submit comment as sessionUser
async function submitComment(postUUID){ 
    const text = document.getElementById(`new-comment-textarea-${postUUID}`);
    const commentErrorMessage = document.getElementById(`new-comment-error-message-${postUUID}`);
    let textLength = parseInt(text.value.length);
    if(textLength > 200){
        commentErrorMessage.innerHTML = `Error: Comment length (${textLength}/200)`;
        commentErrorMessage.style.display = "block";
        text.value.value = "";
        return;
    }
    const submitComment = await clientUtils.networkRequestJson('/comment/submitComment', userUUID, {
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
            'X-CSRF-Token': _csrf
        },
        body: JSON.stringify({
            text: text.value, 
            postUUID: postUUID
        })}
    );

    if(submitComment.data.success){
        let comment = submitComment.data.comment;
        let commentHTML = await clientUtils.getCommentHTML(blobCache, comment, localStorage.getItem("firstName"), localStorage.getItem("lastName"), sessionProfilePic, true);
        document.getElementById(`post-comments-${postUUID}`).insertAdjacentHTML('beforeend', commentHTML);
        const writeCommentDiv = document.getElementById(`write-comment-${postUUID}`);
        clientUtils.styleDisplayBlockHiddenSwitch(writeCommentDiv);
        document.getElementById(`new-comment-textarea-${postUUID}`).value = "";
        ShowSelfOnlyElements();
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
                let oldBlobURL = "";
                switch(i){
                    case 0:{ 
                        route = '/user/updateProfilePic';
                        headerOrProfile = "Profile picture";
                        oldBlobURL = profilePic.src;
                    } break;
                    case 1:{ 
                        route = '/user/updateHeaderPic';
                        headerOrProfile = "Header picture";
                        oldBlobURL = headerDiv.style.backgroundImage.slice(5, -2)
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
                        const updateImage = await clientUtils.networkRequestJson(route, userUUID, {
                            method: 'POST',
                            headers:{
                                'X-CSRF-Token': _csrf
                            },
                            body: formData
                        });
                        
                        if(updateImage.data.success){
                            URL.revokeObjectURL(oldBlobURL); // delete old blob, new one to be allocated
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
                    const updateInfo = await clientUtils.networkRequestJson('/user/updateInfo', userUUID, {
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
    if(!editMode && imageUpdated){
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

    // temporarily goes to userid = 3's profile for testing view of other persons profile
    document.getElementById('friend-icon-button').addEventListener('click', () => {
        window.location.href = `/user/profile/019bee1e-febd-4c1a-b107-eb6a479b9ae4`;
    })

    const postContainer = document.getElementById("posts-get-appended-here");
    // posts and everything inside of them should be handlded like this (DOM updates here cause reference breaks)
    postContainer.addEventListener("click", (event) => {
        if(!event.target){
            return
        }
        const postUUID = event.target.dataset.id; 
        const commentUUID = event.target.dataset.commentUuid;
        // postId will be undefined here if you click in the post container not on a button
        if(event.target.classList.contains("delete-post-button")) {
            deletePost(postUUID);
        } else if(event.target.classList.contains("like-button")) {
            likePost(postUUID);
        } else if(event.target.classList.contains("comment-button")){
            const writeCommentDiv = document.getElementById(`write-comment-${postUUID}`);
            clientUtils.styleDisplayBlockHiddenSwitch(writeCommentDiv);
        } else if(event.target.classList.contains("submit-comment-button")){
            submitComment(postUUID);
        } else if(event.target.classList.contains("delete-comment-button")){
            deleteComment(commentUUID);
        } else if(event.target.classList.contains("post-comment-like-button")){
            likeComment(commentUUID);
        }
    });

}

// generates HTML for posts and their comments. gets all posts for currently viewed profile page
async function populatePosts(){
    const getPosts = await clientUtils.networkRequestJson("/post/getPosts", userUUID);
    if(getPosts.data.success && getPosts.data.posts){
        for(const postData of getPosts.data.posts){ // for each post
            let HTMLComments = [""] // comments are part of a post; to be unpacked later
            if(postData.comments[0]){ // does this post have at least one comment?
                postData.comments.sort((a, b) => new Date(a.commentDatetime) - new Date(b.commentDatetime));
                for(const commentData of postData.comments){ // for each comment 
                    let comment = await clientUtils.getCommentHTML(blobCache, commentData);
                    HTMLComments.push(comment);
                }
            }
            let post = await clientUtils.getPostHTML(blobCache, profilePic, HTMLComments, postData, ProfileFirstName, ProfileLastName);
            postContainer.insertAdjacentHTML('beforeend', post);
        }
    }
}

function ShowSelfOnlyElements(){
    if(!userUUID){ // make self-only things visible
        document.querySelectorAll('.self-only').forEach(element => element.style.display = 'block');
    }
}

async function resetErrors(){
    document.getElementById("post-error-message").innerHTML = "";
    document.getElementById("update-info-error-text").innerHTML = "";
}

async function loadPage(){
    _csrf = await clientUtils.get_csrfValue();
    await loadTopHeaderName();
    await resetErrors();
    await loadProfileNamesImagesInfo();
    await populatePosts();
    initializeEventListeners();
    ShowSelfOnlyElements();    
}

loadPage();