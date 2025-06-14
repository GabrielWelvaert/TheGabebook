import * as clientUtils from './clientUtils.js';
import {socket} from './header.js';

const _csrf = await clientUtils.get_csrfValue();
const postContainer = document.getElementById("posts-get-appended-here");

const getProfilePicLocator = await clientUtils.networkRequestJson(`/user/getProfilePicLocator`);
const sessionUserProfileBlob = await clientUtils.getBlobOfSavedImage( getProfilePicLocator.data.profilePic);
const sessionUserFirstName = clientUtils.capitalizeFirstLetter(localStorage.getItem("firstName"));
const sessionUserLastName = clientUtils.capitalizeFirstLetter(localStorage.getItem("lastName"));

function scrollToPost(){
    const pathParts = window.location.pathname.split('/');
    const countURLParams = pathParts.length;
    if(countURLParams != 4){ // last url param should be a postUUID
        return;
    }
    const elementId = pathParts[pathParts.length - 1];
    const postElement = document.getElementById(elementId);
    if(postElement){
        const top = postElement.getBoundingClientRect().top + window.scrollY - 100;
        document.documentElement.scrollTo({
            top: top,
            behavior: 'smooth'
        });
        clientUtils.yellowFlash(postElement);
        const indexOfFirstDash = elementId.indexOf("-");
        const postOrComment = elementId.slice(0, indexOfFirstDash); // "post" or "comment"
        const subjectUUID = elementId.slice(indexOfFirstDash + 1); // subject UUID 
        if(postOrComment == "comment"){
            const likebutton = document.getElementById(`comment-like-text-${subjectUUID}`);
            const deletebutton = document.getElementById(`comment-delete-text-${subjectUUID}`);
            clientUtils.yellowFlash(likebutton);
            clientUtils.yellowFlash(deletebutton);
        } else if (postOrComment == "post"){
            const deletebutton = document.getElementById(`post-delete-${subjectUUID}`);
            clientUtils.yellowFlash(deletebutton);
        }
    }
}

async function getPosts(){
    // for testing purposes im just fetching own posts like on profile page
    const posts = await clientUtils.networkRequestJson('/post/getFeed');
    for(const postData of posts.data.posts){
        let HTMLComments = [""] // comments are part of a post; to be unpacked later
        if(postData.comments[0]){ // does this post have at least one comment?
            postData.comments.sort((a, b) => new Date(a.commentDatetime) - new Date(b.commentDatetime));
            for(const commentData of postData.comments){ // for each comment 
                let comment = await clientUtils.getCommentHTML( commentData);
                HTMLComments.push(comment);
            }
        }
        const getAuthorName = await clientUtils.networkRequestJson('/user/getName', postData.postAuthorUUID);
        const authorFirstName =  clientUtils.capitalizeFirstLetter(getAuthorName.data.firstName);
        const authorLastName =  clientUtils.capitalizeFirstLetter(getAuthorName.data.lastName);
        let post = await clientUtils.getPostHTML(postData.postAuthorProfilePic, HTMLComments, postData, authorFirstName, authorLastName);
        postContainer.insertAdjacentHTML('beforeend', post);
    }
}

async function initializeEventListeners(){
    document.getElementById("submit-post-button").addEventListener('click', () => clientUtils.post(sessionUserProfileBlob, sessionUserFirstName, sessionUserLastName, _csrf));

    postContainer.addEventListener("click", (event) => {
        if(!event.target){
            return;
        }
        const postUUID = event.target.dataset.id; 
        const commentUUID = event.target.dataset.commentUuid;
        // postId will be undefined here if you click in the post container not on a button
        if(event.target.classList.contains("delete-post-button")) {
            clientUtils.deletePost(postUUID, _csrf);
        } else if(event.target.classList.contains("like-button")) {
            clientUtils.likePost(postUUID, _csrf, socket);
        } else if(event.target.classList.contains("comment-button")){
            const writeCommentDiv = document.getElementById(`write-comment-${postUUID}`);
            clientUtils.styleDisplayBlockHiddenSwitch(writeCommentDiv);
        } else if(event.target.classList.contains("submit-comment-button")){
            clientUtils.submitComment(postUUID, _csrf, true, socket);
        } else if(event.target.classList.contains("delete-comment-button")){
            clientUtils.deleteComment(commentUUID, _csrf);
        } else if(event.target.classList.contains("post-comment-like-button")){
            clientUtils.likeComment(commentUUID, _csrf, socket);
        }
    });
}

await getPosts();
await initializeEventListeners();
scrollToPost();