import * as clientUtils from './clientUtils.js';
import {socket} from './header.js';

const container = document.getElementById("friend-request-box");
const outgoingBox = document.getElementById("outgoing-box");
const outgoingCount = document.getElementById("outgoing-number");
const incomingCount = document.getElementById("incoming-number");
let _csrf = await clientUtils.get_csrfValue();
const incomingBox = document.getElementById("incoming-box");

// for terminating outgoing
async function handleOutgoing(otherUUID){
    const cancelOutgoing = await clientUtils.friendPost(otherUUID, _csrf, 'terminate');
    document.getElementById(`request-item-${otherUUID}`).remove();
    outgoingCount.innerText = parseInt(outgoingCount.innerText) - 1;
}

// accepted must be true or false
async function handleIncoming(otherUUID, accepted){
    let route = accepted ? 'acceptFriendRequest' : 'terminate';
    const cancelOutgoing = await clientUtils.friendPost(otherUUID, _csrf, route);
    document.getElementById(`request-item-${otherUUID}`).remove();
    let newCount = parseInt(incomingCount.innerText) - 1;
    if(newCount <= 0){
        clientUtils.toggleNotification('friend');
    }
    document.getElementById('friend-notification').innerText = newCount;
    incomingCount.innerText = newCount;
}

async function initializeEventListenersFriendRequestPage(){
    container.addEventListener('click', (event) => {
        if(!event.target){
            return
        }
        let otherUUID = event.target.dataset.otherUuid;
        if(event.target.classList.contains("cancel-outgoing-button")){
            handleOutgoing(otherUUID);
        } else if(event.target.classList.contains("reject-incoming-button")){
            handleIncoming(otherUUID, false);
        } else if(event.target.classList.contains("accept-incoming-button")){
            handleIncoming(otherUUID, true);
        }

    })
}

async function populateRequests(){
    // todo for each outgoing request
    const getAllOutgoing = await clientUtils.networkRequestJson('/friendship/getAllOutgoing');
    // getAllOutgoing.data.friendships is an object containing an array
    let countOutgoing = 0;
    if(getAllOutgoing.data.success && getAllOutgoing.data.friendships){
        for(const friendshipArray of getAllOutgoing.data.friendships){ // get the array out of the object
            if(friendshipArray.friendships[0]){
                countOutgoing = friendshipArray.friendships.length;
                for(const friendship of friendshipArray.friendships){
                    let image = await clientUtils.getBlobOfSavedImage(friendship.otherProfilePic);
                    let otherUUID = friendship.otherUUID;
                    let name = clientUtils.capitalizeFirstLetter(friendship.otherFirstName) + " " + clientUtils.capitalizeFirstLetter(friendship.otherLastName);
                    let outgoing = 
                        `<div class="request-item regular-border" id="request-item-${otherUUID}">
                            <div class="request-item-left">
                                <img class="request-item-image" src=${image}>    
                            </div>
                            <div class="request-item-right">
                                <a href=${clientUtils.urlPrefix}/user/profile/${otherUUID} class="request-item-name anchor">${name}</a>  
                                <div class="button-div">
                                    <button class="cancel-outgoing-button" data-other-UUID=${otherUUID}>✘</button>  
                                </div>
                            </div>
                        </div>`;
                    outgoingBox.insertAdjacentHTML('beforeend', outgoing);
                }
            }
        }
    }
    outgoingCount.innerText = countOutgoing;

    const getAllIncoming = await clientUtils.networkRequestJson('/friendship/getAllIncoming');
    let countIncoming = 0;
    if(getAllIncoming.data.success && getAllIncoming.data.friendships){
        for(const friendshipArray of getAllIncoming.data.friendships){
            if(friendshipArray.friendships[0]){
                countIncoming = friendshipArray.friendships.length;
                for(const friendship of friendshipArray.friendships){
                    let image = await clientUtils.getBlobOfSavedImage(friendship.otherProfilePic);
                    let otherUUID = friendship.otherUUID;
                    let name = clientUtils.capitalizeFirstLetter(friendship.otherFirstName) + " " + clientUtils.capitalizeFirstLetter(friendship.otherLastName);
                    let incoming = `<div class="request-item regular-border" id="request-item-${otherUUID}">
                        <div class="request-item-left">
                            <img class="request-item-image" src=${image}>    
                        </div>
                        <div class="request-item-right">
                            <a href={clientUtils.urlPrefix}/user/profile/${otherUUID} class="request-item-name anchor">${name}</a>  
                            <div class="button-div">
                                <button class="accept-incoming-button" data-other-UUID=${otherUUID}>✔</button>
                                <button class="reject-incoming-button" data-other-UUID=${otherUUID}>✘</button>  
                            </div>
                        </div>
                    </div>`
                    incomingBox.insertAdjacentHTML('beforeend', incoming);
                }
            }
        }
    }
    incomingCount.innerText = countIncoming;
}

await populateRequests();
await initializeEventListenersFriendRequestPage();