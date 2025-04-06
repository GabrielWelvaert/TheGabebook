import * as clientUtils from './clientUtils.js';

const _csrf = await clientUtils.get_csrfValue();

const deleteProfileButton = document.getElementById('delete-profile-button');
const deleteProfilePasswordInput = document.getElementById('delete-profile-password-input');
const errorText = document.getElementById('delete-profile-error-text');

deleteProfileButton.addEventListener('click', async () => {
    errorText.innerText = "";
    let password = deleteProfilePasswordInput.value;
    let deletedUser = await clientUtils.networkRequestJson('/user/delete', null, { 
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
            'X-CSRF-Token': _csrf
        },
        body: JSON.stringify({
            password
        })    
    });
    if(deletedUser && deletedUser.status === 401){
        errorText.innerText = "Incorrect Password";
    }

})


