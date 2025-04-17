import * as clientUtils from './clientUtils.js';

let _csrf = await clientUtils.get_csrfValue();
const peopleList = document.getElementById('people-list');
const friendSearchInput = document.getElementById('friend-search');
const friendSearchResult = document.getElementById('message-search-results');
const conversationRecipient = document.getElementById("conversation-recipient-name");
const sendMessageButton = document.getElementById('send-message-button');
const messageTextarea = document.getElementById('message-textarea');
const messageError = document.getElementById('send-message-error');
const peopleListUUIDs = {};
let selectedIcon;
let recipientUUID;

function clearFriendSearchResults(){
    friendSearchResult.style.display = "none";
    friendSearchResult.innerHTML = "";
    friendSearchInput.value = "";
}

async function updateConversationRecipient(otherUUID, otherName, otherImage){
    if(selectedIcon){
        selectedIcon.style.setProperty('background-color', 'white', 'important');  
    }
    selectedIcon = document.getElementById(`conversation-icon-${otherUUID}`);
    selectedIcon.style.setProperty('background-color', 'rgb(227,156,102)', 'important'); 
    conversationRecipient.innerText = otherName;
    recipientUUID = otherUUID;
}

async function loadEventListeners(){
    sendMessageButton.addEventListener('click', async () => {
        messageError.innerText = '';
        if(!recipientUUID){
            messageError.innerText = `Search Or Select Someone!`;
        }
        const text = messageTextarea.value;
        if(text.length > 2000){
            messageError.innerText = `Message Too Long! (${text.length}/2000)`;
        }
        const sendMessage = await clientUtils.networkRequestJson("/message/sendMessage", recipientUUID, {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
                'X-CSRF-Token': _csrf
            },
            body: JSON.stringify({
                text
            })
        })
        if(sendMessage.data.success){
            // todo show the message in the chat box
            messageTextarea.value = '';
        } else {
            messageError.innerText = sendMessage.data.message;
        }
    })
    
    friendSearchInput.addEventListener('keyup', async () => { // event handler for key down in search area
            const text = friendSearchInput.value;
            let hideResultDiv = false;
            if(text.length >= 3){
                const friends = await clientUtils.networkRequestJson("/friendship/friendSearch", null, {
                    method: 'POST',
                    headers:{
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': _csrf
                    },
                    body: JSON.stringify({
                        text
                    })
                })
                if(friends && friends.data.success && friends.data.users[0]){
                    friendSearchResult.innerHTML = "";
                    friendSearchResult.style.display = "block";
                    for(let user of friends.data.users){
                        let otherUUID = user.userUUID;
                        let name = `${clientUtils.capitalizeFirstLetter(user.firstName)} ${clientUtils.capitalizeFirstLetter(user.lastName)}`;
                        let picture = user.profilePic;
                        let userHTML = await clientUtils.getSearchResultHTML(otherUUID, name, picture);
                        friendSearchResult.insertAdjacentHTML('beforeend', userHTML);
                    }
                } else {
                    hideResultDiv = true; // because no results 
                }
            } else {
                hideResultDiv = true // because text length <= 3
            }
            if(hideResultDiv){
                friendSearchResult.style.display = "none";
                friendSearchResult.innerHTML = "";
            }
    })
    document.addEventListener('click', (event) => { // if clicked outside of search results
        if(!friendSearchResult.contains(event.target) && friendSearchResult.style.display != 'none'){
            clearFriendSearchResults();
        }
    })
    friendSearchResult.addEventListener('click', async (event) => {
        if(!event.target.dataset.otheruuid){
            return;
        }
        const userUUID = event.target.dataset.otheruuid;
        const name = clientUtils.replaceUnderscoreWithSpace(event.target.dataset.name);
        const image = event.target.dataset.image;
        if(!peopleListUUIDs[userUUID]){ // add icon to people list
            peopleListUUIDs[userUUID] = userUUID;
            const conversationIconHTML = await clientUtils.getMessagePeopleListHTML(userUUID, name, image);
            peopleList.insertAdjacentHTML('afterbegin', conversationIconHTML);
        } 
        updateConversationRecipient(userUUID, name, image);
        clearFriendSearchResults();
        peopleList.style.display = 'flex';
    })

    peopleList.addEventListener('click',  (event) => {
        if(!event.target.dataset.otheruuid){
            return;
        }
        const userUUID = event.target.dataset.otheruuid;
        const name = clientUtils.replaceUnderscoreWithSpace(event.target.dataset.name);
        const image = event.target.dataset.image;
        updateConversationRecipient(userUUID, name, image);
    })
}

async function populatePeopleList(){
    // if prior conversations, change display back to flex
    // peopleList.style.display = 'flex';
}

await populatePeopleList();
await loadEventListeners();