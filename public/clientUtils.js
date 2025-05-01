// utility functions available to client-side files

export const urlPrefix = "http://localhost:3000";
const blobCache = {};

export function replaceUnderscoreWithSpace(string){
    return string.replace(/_/g, ' ');
}

// icon for a pre-existing conversation
export async function getMessagePeopleListHTML(otherUUID, name, image, extraInfo = ""){
    if(!otherUUID || !name || !image){
        return "";
    }
    let picture = await getBlobOfSavedImage(image);
    let underscoredName = name.replace(/\s+/g, '_');
    const conversationIcon = `<div class="search-result regular-border people-list-item" id="conversation-icon-${otherUUID}" data-otheruuid=${otherUUID} data-name=${underscoredName} data-image=${image}>
                                    <img class="search-result-image people-list-image" src=${picture} data-otheruuid=${otherUUID} data-name=${underscoredName} data-image=${image}>
                                    <div data-name=${underscoredName} data-image=${image}>
                                        <div class="search-result-name people-list-name" data-otheruuid=${otherUUID} data-name=${underscoredName} data-image=${image}>${name}</div>
                                        <div id="people-list-${otherUUID}" class="people-list-extra-info message-time" data-name=${underscoredName} data-otheruuid=${otherUUID} data-image=${image}>${extraInfo}</div>    
                                    </div>
                                    <div class="notification-ball-container">
                                        <div class="notification-ball" id="notification-ball-${otherUUID}">●</div>
                                    </div>
                                </div>`;
    return conversationIcon;
}

// html for active conversation 
export function getMessageHTML(text, datetime, isSender, messageUUID){
    const sentOrRecieved = isSender ? 'sent' : 'recieved'; 
    const message = `<div id="message-${messageUUID}" class="${sentOrRecieved}-message-container data-time=${datetime}">
                        <div class="message ${sentOrRecieved}-message">${text}</div>
                        <div class="${sentOrRecieved}-message-time message-time">${getMessageTime(datetime)}</div>
                    </div>`;
    return message;
}

// ex: friends are of profile page. its an image with their name that links to their profile
export async function getFriendHTML(otherUUID, name, image){
    if(!otherUUID || !name || !image){
        return "";
    }
    let picture = await getBlobOfSavedImage(image);
    let friend = `<div class="friend regular-border" data-otheruuid=${otherUUID}>
                    <img class="friend-image" id="friend-image" src=${picture}>
                    <span class="friend-name" id="friend-name">${name}</span>
                </div>`;
    return friend;
}

export async function getSearchResultHTML(otherUUID, name, image){
    if(!otherUUID || !name || !image){
        return "";
    }
    let underscoredName = name.replace(/\s+/g, '_');
    let picture = await getBlobOfSavedImage(image);
    let searchResult = `<div class="search-result regular-border" data-otheruuid=${otherUUID} data-name=${underscoredName} data-image=${image}>
                            <img class="search-result-image" src=${picture} data-otheruuid=${otherUUID}  data-name=${underscoredName} data-image=${image}>
                            <div class="search-result-name" id="search-result-${otherUUID}"data-otheruuid=${otherUUID} data-name=${underscoredName} data-image=${image}>${name}</div>
                        </div>`;
    return searchResult;
}

export function toggleNotification(type, hide = true){
    let id = type + "-notification";
    const element = document.getElementById(id);
    hide ? element.style.display = 'none' : element.style.display = 'block';
}

// route should be sendFriendRequest, acceptFriendRequest, or terminate
export async function friendPost(otherUUID, _csrf, route){
    await networkRequestJson(`/friendship/${route}`, otherUUID, {
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
            'X-CSRF-Token': _csrf
        },
        body: JSON.stringify({
            otherUUID
        })
    });
}

// gets the optional UUID from user/profile/UUID for the profilePage. only works if UUID is prefixed by two locations ex /1/2/UUID
export async function getProfilePageUUIDParameter(){
    const segments = window.location.pathname.split('/').filter(Boolean);
    return segments.length > 2 ? segments.pop() : undefined;
}

// returns comment as HTML string
// can be called as commentData is returned from /post/GetPosts's postData.comment (for each; already existing comments) [call with 2 parameters]
// can be called as commentData is returned from /submitComment (for a new comment) [call with 6 parameters]
export async function getCommentHTML(commentData, firstName = undefined, lastName = undefined, profilePic = undefined, authorized = undefined){
    const image = profilePic ?? await getBlobOfSavedImage(commentData.authorProfilePic);
    let fname = firstName ?? commentData.authorFirstName;
    let lname = lastName ?? commentData.authorLastName;
    let pluralOrSingular = commentData.commentLikeCount !== 1 ? "s" : "";
    let likeOrUnlike = commentData.userLikedComment ? "Unlike" : "Like";
    let text = commentData.commentText ?? commentData.text;
    let likeCount = commentData.commentLikeCount ?? 0;
    let time = commentData.commentDatetime ?? commentData.datetime;
    let commentAuthorUUID = commentData.commentAuthorUUID ?? "";
    authorized = authorized ? true : commentData.userIsAuthorized;
    let del = "";
    if(authorized){
        del = `<div class="delete-comment-button-div" id="delete-comment-div-${commentData.commentUUID}">
                    <button class="delete-comment-button" data-comment-UUID="${commentData.commentUUID}">Delete</button>
                </div>`
    }

    // todo add delete button only if author is authorized! 
    let comment = `<div class="post-comments post-bottom regular-border" data-commentUUID="${commentData.commentUUID}" id=comment-${commentData.commentUUID}>
                        <div class="post-comment post-bottom regular-border" >
                            <div class="post-comment-left">
                                <img src=${image} class="comment-profile-pic">
                            </div>
                            <div class="post-comment-right">
                                <div class="post-comment-name-text">
                                    <a href=${urlPrefix}/user/profile/${commentAuthorUUID} class="post-comment-profile-name anchor">
                                        ${capitalizeFirstLetter(fname)} ${capitalizeFirstLetter(lname)}
                                    </a>
                                    ${del}
                                </div>
                                <div class="post-comment-text">
                                    ${text}
                                </div>
                                <div class="post-comment-date-likes">
                                    <div class="post-comment-date post-comment-small-text">${timeAgo(time)}</div>
                                    <div class="post-comment-like-button" data-comment-UUID="${commentData.commentUUID}" id=comment-like-text-${commentData.commentUUID}>${likeOrUnlike}</div>    
                                    <div class="post-comment-num-likes post-comment-small-text">
                                        <span class="comment-like-count" id=comment-like-count-${commentData.commentUUID}>${likeCount}</span><span class="like-text" id=comment-plural-or-singular-${commentData.commentUUID}> like${pluralOrSingular}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`
    return comment;  
}

// returns HTML string for a post. postData expected as from /post/GetPosts's postData
// see call site for more info about params
export async function getPostHTML(profilePic, HTMLComments, postData, firstName = undefined, lastName = undefined){
    // todo logic to fetch name if its not passed as parameter?

    // profilePic will be passed as blob if on profile page, otherwise profilePic is fileLocator string
    let image = profilePic.substr(0,5) === "blob:" ? profilePic : await getBlobOfSavedImage(profilePic); 
    let postNumLikes = postData.postNumLikes || 0;
    let likeOrUnlike = postData.userLikedPost ? "Unlike" : "Like";
    let pluralOrSingular = postData.postNumLikes !== 1 ? "s" : ""; 
    let text = postData.text;
    let datetime = postData.datetime;
    let post = `<div class="profile-content-body-right-feed regular-border" id="post-${postData.postUUID}">
                    <div class="profile-content-body-right-feed-post">
                        <div class="profile-content-body-right-feed-post-header">
                            <img src=${image} class="post-profile-pic">
                            <div class="post-profile-nametime">
                                <a class="post-profile-name post-profile-header-text" href=${urlPrefix}/user/profile/${postData.postAuthorUUID}>${firstName} ${lastName}</a>
                                <div class="post-profile-time post-profile-header-text">${formatDateTime(datetime)} (${timeAgo(datetime)})</div>
                            </div>
                            <div class="delete-post-button-div">
                                <button class="delete-post-button self-only" data-id=${postData.postUUID}>Delete</button>
                            </div>
                        </div>
                        <div class="post-textarea post-content post-element">
                            ${text}
                        </div>
                        <div class="post-bottom regular-border">
                            <div class="post-bottom-internal">
                                <div class="post-buttons post-content">
                                    <button class="post-button regular-border like-button" id=like-text-${postData.postUUID} data-id=${postData.postUUID}>${likeOrUnlike}</button>
                                    <button class="post-button regular-border comment-button" data-id=${postData.postUUID}>Comment</button>
                                </div>
                                <div class="post-likes post-content regular-border post-bottom">
                                    <span class="like-count" id=like-count-${postData.postUUID}>${postNumLikes}</span><span class="like-text" id=like-plural-or-singular-${postData.postUUID}> like${pluralOrSingular}</span> 
                                </div>
                                <div class="post-comments post-bottom post-content regular-border" id="post-comments-${postData.postUUID}">
                                    ${HTMLComments ? HTMLComments.join("") : ""}
                                </div>
                                <div class="write-comment-gets-appended-here" id=write-comment-${postData.postUUID} style="display: none;">
                                    <div class="post-write-comment post-bottom regular-border post-content">
                                        <textarea class="post-write-comment-textarea" placeholder="Write a comment..." id="new-comment-textarea-${postData.postUUID}"></textarea>
                                        <button class="profile-content-header-extra-buttons submit-comment-button" data-id="${postData.postUUID}">Comment</button>
                                    </div>
                                    <span class="error-text write-comment-error-message" id="new-comment-error-message-${postData.postUUID}" style="display: none;"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
    return post;
}

// wrapper for network requests that return json to centralize session expiry logic
export async function networkRequestJson(url, UUIDParam = null, options = {}){
    try {
        url = UUIDParam ? `${url}/${UUIDParam}` : url
        const response = await fetch(url, options);
        if(response.redirected){
            window.location.href = response.url;
            return null;
        }
        const status = response.status;
        const data = await response.json();
        if(status === 401 && data.message === "Session expired") {
            sessionStorage.setItem('globalError', JSON.stringify({ status: true, message: "Session Expired" }));
            window.location.href = '/';
            return null; 
        }
        return {status, data};
    } catch (error) {
        console.error(`networkRequestJson failure: ${error.message}`);
        return {status: 500, data: {success: false, message: error.message}};
    }
}

// switches an element's style.display between "block" or "inline-block" and "none" to hide or not hide an element
export function styleDisplayBlockHiddenSwitch(HTMLelement, inlineblock = false){
    // assumes element doesn't have display set
    if(HTMLelement.style.display == "none"){ // switch to visible
        if(inlineblock){
            HTMLelement.style.display = "inline-block";    
        } else {
            HTMLelement.style.display = "block";        
        }
    } else { // switch to invisible
        HTMLelement.style.display = "none";
    }
}

// pass the value stored in the database to this funciton to
// generate a client-side blob (temporary file)
// blobCache should be an empty set defined at top of any client side file representing a given page
export async function getBlobOfSavedImage(fileLocator){
    if(blobCache[fileLocator]){
        return blobCache[fileLocator];
    } else {
        const response = await fetch(`/file/getFile/${fileLocator}`);
        const blob = await response.blob();    
        const objectURL = URL.createObjectURL(blob)
        blobCache[fileLocator] = objectURL;
        return objectURL;
    }
}

export const validImageMIMETypes = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"]
};

export function isValidImage(file) {
    if(!file){
        return false;
    }
    const mimeType = file.type;
    const extension = file.name.split('.').pop().toLowerCase();
    
    return validImageMIMETypes[mimeType]?.some(ext => ext.slice(1) === extension);
}

export function startsWithVowel(str) {
    if(!str || typeof str !== 'string'){
        return false;
    }
    return /^[aeiouAEIOU]/.test(str);
}

export function removeTabsAndNewlines(str) {
    return str.replace(/[\t\n\r]/g, '');
}

export function capitalizeFirstLetter(str) {
    if(!str){
        return str;   
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export async function get_csrfValue(){ // using httponly cookies (no js access!)
    const response = await fetch('/csrf-token' , {credentials: 'same-origin'});
    const data = await response.json();
    return data.csrfToken; // copy of value stored in _csrf cookie
}

function getMessageTime(datetime) {
    const date = new Date(datetime);
    const now = new Date();

    // Strip time portion for clean date comparison
    const isSameDate = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    let dateLabel;
    if (isSameDate(date, now)) {
        dateLabel = '';
    } else if (isSameDate(date, yesterday)) {
        dateLabel = 'Yesterday ';
    } else {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        dateLabel = `${month} ${day}, ${year} `;
    }

    return `${dateLabel}${hours}:${minutes} ${ampm}`;
}

export function formatDateTime(datetime) {
    const date = new Date(datetime);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = months[date.getMonth()];  
    const day = date.getDate(); 
    const year = date.getFullYear();  
    let hours = date.getHours();  
    const minutes = String(date.getMinutes()).padStart(2, '0'); 
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;  
    return `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
}

export function timeAgo(datetime) {
    const now = new Date();
    const pastDate = new Date(datetime);
    const diffInMs = now - pastDate;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInYears = Math.floor(diffInDays / 365);
    if(diffInSeconds === 0){
        return `Now`;
    } else if (diffInSeconds < 60) {
        return `${diffInSeconds} second${diffInSeconds === 1 ? '' : 's'} ago`;
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInDays < 365) {
        return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    } else {
        return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
    }
    return undefined;
}


// given monthNum and year, returns number of days 
// if year is not passed, function will assume it is not a leap year
// if month is not passed, function will return 31 days
export function monthToDays(monthNum, year = undefined){ 
    let yearCopy = year;
    // paramters are expected as numeric strings from selector input
    if(!monthNum){
        return 31;
    } else {
        monthNum = Number(monthNum);    
    }
    if(year){
        year = Number(year);
        if(Number.isNaN(year) || year < 1900 || year > 2024){
            throw new Error(`monthToDays() Invalid year: (${yearCopy})`);
        }
    }

    switch(monthNum){
        case 1:
        case 3:
        case 5:
        case 7:
        case 8:
        case 10:
        case 12:{
            return 31;
        }
        case 4:
        case 6:
        case 9:
        case 11:{
            return 30;
        }
        case 2:{
            if(year && ((year % 4 === 0) && (year % 100 !== 0 || year % 400 === 0))){ // leap year
                return 29;  
            } else {
                return 28; 
            }
        }
        default:{
            throw new Error(`monthToDays() Invalid monthNum: (${monthNum})`);
        }
    }

    throw new Error(`monthToDays(${monthNum}, ${yearCopy}) parameter error!`);
    return -1;
}