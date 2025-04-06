import * as clientUtils from './clientUtils.js';

let _csrf = await clientUtils.get_csrfValue();

const gabeBookIcon = document.getElementById("gabebook-icon-button"); // redirect to feed TODO
const pageHeaderName = document.getElementById("header-name"); // states name of currently-logged in user
// TODO add search bar, logout button
const friendIcon = document.getElementById("friend-icon-button"); // redirects to friend requests page 
const messageIcon = document.getElementById("message-icon-button"); // redirects to message page TODO
const globeIcon = document.getElementById("globe-icon-button"); // redirects to feed TODO
const profileIcon = document.getElementById("header-profile-pic"); // redirects to profile page (self-view)
const logoutIcon = document.getElementById("logout-icon-button");

async function load(){
    // load name, picture
    pageHeaderName.innerHTML = `${localStorage.getItem("firstName")} ${localStorage.getItem("lastName")}`; 
    const getProfilePic = await clientUtils.networkRequestJson(`/user/getProfilePicLocator`, null);
    const profilePicBlob = await clientUtils.getBlobOfSavedImage(getProfilePic.data.profilePic);
    profileIcon.src = profilePicBlob;

    // load notifications
    const incomingPendingFriendships = await clientUtils.networkRequestJson('/friendship/getAllIncoming');
    let countIncoming = incomingPendingFriendships.data.friendships[0].friendships.length;
    if(countIncoming > 0){
        clientUtils.toggleNotification('friend', false);
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
        await clientUtils.networkRequestJson('/user/logout', null, { 
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
                'X-CSRF-Token': _csrf
            },
        });
    })
}

await load();
await loadEventListeners();