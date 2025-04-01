import * as clientUtils from './clientUtils.js';

const container = document.getElementById("friend-request-box");
const outgoingBox = document.getElementById("outgoing-box");
const outgoingCount = document.getElementById("outgoing-number");
const _csrf = await clientUtils.get_csrfValue();

// for terminating outgoing
async function handleOutgoing(otherUUID){
    const cancelOutgoing = await clientUtils.friendPost(otherUUID, _csrf, 'terminate');
    document.getElementById(`request-item-${otherUUID}`).remove();
    outgoingCount.innerText = parseInt(outgoingCount.innerText) - 1;
}

// accepted must be true or false
async function handleIncoming(otherUUID, accepted){
    // todo call controllers 
    // delete html if successful .remove()
}

async function initializeEventListenersFriendRequestPage(){
    container.addEventListener('click', (event) => {
        if(!event.target){
            return
        }
        let otherUUID = event.target.dataset.otherUuid;
        if(event.target.classList.contains("cancel-outgoing-button")){
            handleOutgoing(otherUUID);
        }

    })
}

async function populateRequests(){
    // todo for each outgoing request
    const getAllOutgoing = await clientUtils.networkRequestJson('/friendship/getAllOutgoing', null);
    // console.table(friendships.data.friendships);
    // getAllOutgoing.data.friendships is an object containing an array
    let count = 0;
    if(getAllOutgoing.data.success && getAllOutgoing.data.friendships){
        for(const friendshipArray of getAllOutgoing.data.friendships){
            if(friendshipArray.friendships[0]){
                count = friendshipArray.friendships.length;
                for(const friendship of friendshipArray.friendships){
                    let image = await clientUtils.getBlobOfSavedImage(friendship.otherProfilePic);
                    let otherUUID = friendship.otherUUID;
                    let name = friendship.otherFirstName + " " + friendship.otherLastName;
                    let outgoing = 
                        `<div class="request-item regular-border" id="request-item-${otherUUID}">
                            <div class="request-item-left">
                                <img class="request-item-image" src=${image}>    
                            </div>
                            <div class="request-item-right">
                                <a href=${clientUtils.urlPrefix}/user/profile/${otherUUID} class="request-item-name anchor">${name}</a>  
                                <button class="cancel-outgoing-button" data-other-UUID=${otherUUID}>Cancel</button>  
                            </div>
                        </div>`;
                    outgoingBox.insertAdjacentHTML('beforeend', outgoing);
                }
            }
        }
    }
    outgoingCount.innerText = count;
}

await populateRequests();
await initializeEventListenersFriendRequestPage();