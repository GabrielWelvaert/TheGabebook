import * as clientUtils from './clientUtils.js';
import {socket} from './header.js';

const _csrf = await clientUtils.get_csrfValue();

const peopleList = document.getElementById('people-list');
const friendSearchInput = document.getElementById('friend-search');
const friendSearchResult = document.getElementById('message-search-results');
const conversationRecipient = document.getElementById("conversation-recipient-name");
const sendMessageButton = document.getElementById('send-message-button');
const messageTextarea = document.getElementById('message-textarea');
const messageError = document.getElementById('send-message-error');
const messageContainer = document.getElementById('conversation-messages');

const peopleListUUIDs = {}; // set of people visible in the people list
let selectedIcon; // currently selected person in people list
let recipientUUID; // UUID of person selecetd from people list, messages shown in message area

function clearFriendSearchResults(){
    friendSearchResult.style.display = "none";
    friendSearchResult.innerHTML = "";
    friendSearchInput.value = "";
}

async function updateConversationRecipient(otherUUID, otherName, otherImage){
    if(recipientUUID == otherUUID){ // clicked same icon, no need to update
        return;
    }
    if(selectedIcon){ // previously selected conversation, now should have white background
        selectedIcon.style.setProperty('background-color', 'white', 'important');  
    }
    messageContainer.innerHTML = '';
    selectedIcon = document.getElementById(`conversation-icon-${otherUUID}`);
    selectedIcon.style.setProperty('background-color', 'rgb(227,156,102)', 'important'); 
    conversationRecipient.innerText = otherName;
    conversationRecipient.href = `${clientUtils.urlPrefix}/user/profile/${otherUUID}`;
    recipientUUID = otherUUID;
    const getConversation = await clientUtils.networkRequestJson("/message/conversation", recipientUUID);
    if(getConversation.data.currentConversation){
        const conversation = getConversation.data.currentConversation;
        for(const message of conversation){
            const messageHTML = clientUtils.getMessageHTML(message.text, message.datetime, message.isSender, message.messageUUID);
            messageContainer.insertAdjacentHTML('beforeend', messageHTML);
        }    
    }
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
            return;
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
            const newMessageHTML = clientUtils.getMessageHTML(sendMessage.data.text, sendMessage.data.datetime, true);
            messageContainer.insertAdjacentHTML('beforeend', newMessageHTML);
            messageTextarea.value = '';
            document.getElementById(`people-list-${recipientUUID}`).innerText = "Sent Recently";
            const conversationIcon = document.getElementById(`conversation-icon-${recipientUUID}`);
            const copy = conversationIcon.cloneNode(true);
            peopleList.removeChild(conversationIcon);
            peopleList.insertBefore(copy, peopleList.firstChild);
            selectedIcon = peopleList.firstChild
            socket.emit('sent-message', {recipientUUID: recipientUUID});
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
            const conversationIconHTML = await clientUtils.getMessagePeopleListHTML(userUUID, name, image, "No Message History");
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
    const conversations = await clientUtils.networkRequestJson("/message/allConversations");
    if(conversations.data.previousConversations && conversations.data.success && conversations.data.previousConversations[0]){
        peopleList.style.display = 'flex';
        for(const conversation of conversations.data.previousConversations){
            const otherUUID = conversation.otherUUID;
            peopleListUUIDs[otherUUID] = otherUUID;
            const name = `${clientUtils.capitalizeFirstLetter(conversation.otherFirstName)} ${clientUtils.capitalizeFirstLetter(conversation.otherLastName)}`;
            const image = conversation.otherProfilePic;
            const timeAgo = clientUtils.timeAgo(conversation.lastMsgTime);
            const sentOrRecieved = conversation.isSender ? "Sent" : "Received";
            const extraInfo = `${sentOrRecieved} ${timeAgo}`;
            const conversationIconHTML = await clientUtils.getMessagePeopleListHTML(otherUUID, name, image, extraInfo);
            peopleList.insertAdjacentHTML('beforeend', conversationIconHTML);
        }
    }
}

socket.on('receive-message', (data) => {
    console.log(`received message from ${data.from}`);
})

await populatePeopleList();
await loadEventListeners();