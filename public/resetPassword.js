import * as clientUtils from './clientUtils.js';

let _csrf = await clientUtils.get_csrfValue();

const password1Input = document.getElementById('new-password-input');
const password2Input = document.getElementById('confirm-new-password-input');
const button = document.getElementById('submit-new-password-button');
const error = document.getElementById('reset-password-error-text');

const pathParts = window.location.pathname.split('/');
const token = pathParts[pathParts.length - 1];

function errorMessage(text){
    error.innerText = text;
}

async function resetPassword(){
    let password1 = password1Input.value;
    let password2 = password2Input.value;
    if(!password1 || !password2){
        errorMessage('All Inputs Required')
        return;
    }
    if(password1 != password2){
        errorMessage('Passwords Do Not Match')
        return;
    }
    if((/^(.)\1*$/.test(password1) || password1.length <= 3)){
        errorMessage("Password must have at least 2 unique\ncharacters and have a length of at least 4");
        return;
    }
    const resetPassword = await clientUtils.networkRequestJson('/user/resetPassword', token, { 
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
            'X-CSRF-Token': _csrf
        },
        body: JSON.stringify({
            password1, password2
        })    
    });
    const message = resetPassword.data.message;
    if(message){
        errorMessage(message);
        return;
    }
}

button.addEventListener('click', () => {
    resetPassword();
});