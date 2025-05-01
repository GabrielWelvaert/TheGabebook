import * as clientUtils from './clientUtils.js';

let _csrf = await clientUtils.get_csrfValue();
export const socket = io({ query: { userUUID: localStorage.getItem('userUUID')}});

const gabeBookIcon = document.getElementById("gabebook-icon-button"); // redirect to feed TODO
const pageHeaderName = document.getElementById("header-name"); // states name of currently-logged in user
const friendIcon = document.getElementById("friend-icon-button"); // redirects to friend requests page 
const messageIcon = document.getElementById("message-icon-button"); // redirects to message page TODO
const globeIcon = document.getElementById("globe-icon-button"); // redirects to feed TODO
const profileIcon = document.getElementById("header-profile-pic"); // redirects to profile page (self-view)
const logoutIcon = document.getElementById("logout-icon-button");
const searchInput = document.getElementById("search-input");
const searchResultsDiv = document.getElementById("search-results");

const messageNotification = document.getElementById('message-notification');
const friendNotification = document.getElementById('friend-notification');

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

    const unreadMessages = 2;
    if(unreadMessages > 0){
        clientUtils.toggleNotification('message', false)
        messageNotification.innerText = "!";
        if(unreadMessages > 9){
            messageNotification.innerText = "!";
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
        console.log(socket);
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
                    searchResultsDiv.insertAdjacentHTML('beforeend', userHTML);
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
    document.addEventListener('click', (event) => { // if clicked outside of search results
        if(!searchResultsDiv.contains(event.target) && searchResultsDiv.style.display != 'none'){
            searchResultsDiv.style.display = "none";
            searchResultsDiv.innerHTML = "";
            searchInput.value = "";
        }
    })
    searchResultsDiv.addEventListener('click', (event) => {
        if(!event.target.dataset.otheruuid){
            return;
        }
        const userUUID = event.target.dataset.otheruuid;
        window.location.href = `${clientUtils.urlPrefix}/user/profile/${userUUID}`;
    })
    
}

await load();
await loadEventListeners();