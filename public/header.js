import * as clientUtils from './clientUtils.js';

let _csrf = await clientUtils.get_csrfValue();
export const socket = io({ query: { userUUID: localStorage.getItem('userUUID')}});
let generatedNotifications = false;

const gabeBookIcon = document.getElementById("gabebook-icon-button"); // redirect to feed TODO
const pageHeaderName = document.getElementById("header-name"); // states name of currently-logged in user
const friendIcon = document.getElementById("friend-icon-button"); // redirects to friend requests page 
const messageIcon = document.getElementById("message-icon-button"); // redirects to message page TODO
const globeIcon = document.getElementById("globe-icon-button"); // redirects to feed TODO
const profileIcon = document.getElementById("header-profile-pic"); // redirects to profile page (self-view)
const logoutIcon = document.getElementById("logout-icon-button");
const searchInput = document.getElementById("search-input");
const searchResultsDiv = document.getElementById("search-results");
const notificationIcon = document.getElementById("activity-notificaiton-icon-button");
const notificationResultsDiv = document.getElementById("notification-results");

const messageNotification = document.getElementById('message-notification');
const friendNotification = document.getElementById('friend-notification');
const activityNotification = document.getElementById('activity-notification');

async function load(){
    // load name, picture
    pageHeaderName.innerHTML = `${localStorage.getItem("firstName")} ${localStorage.getItem("lastName")}`; 
    const getProfilePic = await clientUtils.networkRequestJson(`/user/getProfilePicLocator`, null);
    const profilePicBlob = await clientUtils.getBlobOfSavedImage(getProfilePic.data.profilePic);
    profileIcon.src = profilePicBlob;

    // load notifications
    const incomingPendingFriendships = await clientUtils.networkRequestJson('/friendship/getAllIncoming');
    let countIncoming = incomingPendingFriendships.data.friendships[0].friendships.length; // what the fuck
    if(countIncoming > 0){
        clientUtils.toggleNotification('friend', false);
        friendNotification.innerText = countIncoming;
        if(countIncoming > 9){
            friendNotification.innerText = "!";
        }
    }

    const unreadMessages = await clientUtils.networkRequestJson("/message/getNumberUnreadMessages");
    let count = unreadMessages.data.count;
    if(count > 0){
        clientUtils.initializeMessageNotificationUUIDs(unreadMessages.data.userUUIDs);
        clientUtils.toggleNotification('message', false);
        messageNotification.innerText = count;
        if(count > 9){
            messageNotification.innerText = "!";
        }
    }

    // count number of unread notifications
    const unseenNotifications = await clientUtils.networkRequestJson("/notification/getCountUnseen");
    count = unseenNotifications.data.count;
    if(count > 0){
        activityNotification.innerText = count;
        clientUtils.toggleNotification('activity', false);
        if(count > 9){
            activityNotification.innerText = "!";
        }
    }
}

async function loadNotificationHistory(showResults = false){
    const notifications = await clientUtils.networkRequestJson("/notification/getNotifications");
    if(!notifications || !notifications.data.success){
        return;            
    }
    for(const notification of notifications.data.notifications){
        generatedNotifications = true;
        const getPictureLocator = await clientUtils.networkRequestJson(`/user/getProfilePicLocator/${notification.senderUUID}`);
        const notificationHTML = await clientUtils.getNotificationHTML(
            notification.datetime,
            notification.text,
            getPictureLocator.data.profilePic,
            notification.seen,
            notification.link
        );
        notificationResultsDiv.insertAdjacentHTML('afterbegin', notificationHTML);
        if(!notification.seen){ // update notification as seen
            const seen = await clientUtils.networkRequestJson('/notification/seen', notification.notificationUUID, {
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': _csrf
                }}
            );
        }
    }
}

async function loadEventListeners(){
    profileIcon.addEventListener('click', () => {
        window.location.href = '/user/profile/';
    })
    friendIcon.addEventListener('click', () => {
        window.location.href = '/friendship/friendRequests';
    })
    messageIcon.addEventListener('click', () => {
        window.location.href = '/message/messages';
    })
    logoutIcon.addEventListener('click', async () => {
        socket.disconnect();
        await clientUtils.networkRequestJson('/user/logout', null, { 
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
                'X-CSRF-Token': _csrf
            },
        });
    })
    searchInput.addEventListener('keyup', async () => { // event handler for key down in search area
        const text = searchInput.value;
        let hideResultDiv = false;
        if(text.length >= 3){
            const users = await clientUtils.networkRequestJson("/user/searchUser", null, {
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': _csrf
                },
                body: JSON.stringify({
                    text
                })
            })
            if(users && users.data.success && users.data.users[0]){
                searchResultsDiv.innerHTML = "";
                searchResultsDiv.style.display = "block";
                for(let user of users.data.users){
                    let otherUUID = user.userUUID;
                    let name = `${clientUtils.capitalizeFirstLetter(user.firstName)} ${clientUtils.capitalizeFirstLetter(user.lastName)}`;
                    let picture = user.profilePic;
                    let userHTML = await clientUtils.getSearchResultHTML(otherUUID, name, picture);
                    if(userHTML){
                        searchResultsDiv.insertAdjacentHTML('beforeend', userHTML);
                    }
                }
            } else {
                hideResultDiv = true; // because no results 
            }
        } else {
            hideResultDiv = true // because text length <= 3
        }
        if(hideResultDiv){
            searchResultsDiv.style.display = "none";
            searchResultsDiv.innerHTML = "";
        }
    })
    document.addEventListener('click', (event) => { // clicked anywhere!
        // hide search results if visible and clicked outside of them
        if(searchResultsDiv.style.display != 'none' && !searchResultsDiv.contains(event.target)){
            searchResultsDiv.style.display = "none";
            searchResultsDiv.innerHTML = "";
            searchInput.value = "";
        }

        // hide notifications if they're visible and clicked outside of it
        if(notificationResultsDiv.style.display != 'none'){ // notifications are visible
            if(!notificationIcon.contains(event.target) && !notificationResultsDiv.contains(event.target)){
                notificationResultsDiv.style.display = "none";
            }   
        }
    })
    searchResultsDiv.addEventListener('click', (event) => {
        if(!event.target.dataset.otheruuid){
            return;
        }
        const userUUID = event.target.dataset.otheruuid;
        window.location.href = `${clientUtils.urlPrefix}/user/profile/${userUUID}`;
    })
    notificationIcon.addEventListener('click', async () =>{
        if(notificationResultsDiv.style.display == "block"){ // already visible, hide it
            notificationResultsDiv.style.display = "none";
            return;
        }
        // only need to generate notifications once (per page) and append to it on websocket
        if(!generatedNotifications){ // assume we already fetched notification history
            await loadNotificationHistory();
        }
        // notifications are not visible and never fetched -- get them and append to notificationResultsDiv
        notificationResultsDiv.style.display = "block";
        clientUtils.toggleNotification('activity', true);
    })
    notificationResultsDiv.addEventListener('click', (event) => {
        const link = event.target.dataset.link;
        if(link){
            window.location.href = link;
        }
    })
}

// another user has sent this client a message
socket.on('receive-message', async (data) => {
    const otherUUID = data.from;
    if(clientUtils.hasToMessageNotificationUUIDs(otherUUID)){ 
        return; // dont update because otherUUID is already represented in sum of message notifications
    }
    // dont update because we are having active conversation with person who sent us message
    if(window.location.href.includes("/message/messages") && clientUtils.getMessageRecipientUUID() == otherUUID){
        return; // dont update because we are having active conversation with person who sent us message
    }
    clientUtils.incrementNotification(messageNotification);
    clientUtils.addToMessageNotificationUUIDs(otherUUID);
})

// another user is notifying this client about a friend request update from them
// actions is either terminate (this client lost an incoming) or create (this client gained an incoming)
socket.on('receive-outgoing-friend-request-update', async (data) => {
    const otherUUID = data.from;
    const action = data.action;
    if(action === "terminate"){
        clientUtils.decrementNotification(friendNotification);
    } else if(action === "create"){
        clientUtils.incrementNotification(friendNotification);
    }
})

socket.on('receive-notification', async (data) => {
    const viewingNotifications = notificationResultsDiv.style.display == "block";
    const otherUUID = data.from;
    if(!otherUUID){
        console.error("receive-notification failure -- UUID of sender missing");
        return;
    }
    if(!viewingNotifications){ // no need to increment number, just append new notification and mark as seen
        clientUtils.incrementNotification(activityNotification);
    }
    if(!generatedNotifications){
        await loadNotificationHistory(); // no notification history loaded, so just get it all!
    } else { // we just need the most recent one -- all are there except this one
        clientUtils.appendMostRecentNotification(otherUUID, notificationResultsDiv, _csrf);    
    }
})

await load();
await loadEventListeners();