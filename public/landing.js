import * as clientUtils from './clientUtils.js';

/* 
I wrote this page before learning that using async/await with fetch() is better than using the .then() syntax
*/ 

const monthSelector = document.getElementById("monthDropdown");
const daySelector = document.getElementById("dayDropdown");
const yearSelector = document.getElementById("yearDropdown");

const signUpButton = document.getElementById("js-sign-up-button");
const logInButton = document.getElementById("js-log-in-button");
const forgotPassword = document.getElementById("js-forgot-password");

const logInEmailInput = document.getElementById("email-input");
const logInPasswordInput = document.getElementById("password-input");

const signUpFirstNameInput = document.getElementById("new-first-name-input");
const signUpLastNameInput = document.getElementById("new-last-name-input");
const signUpEmailInput = document.getElementById("new-email-input");
const newPasswordInput = document.getElementById("new-password-input");
const newPasswordConfirmInput = document.getElementById("confirm-new-password-input");

const logInErrorDiv = document.getElementById("js-login-error");
const signUpErrorDiv = document.getElementById("js-sign-up-error-div");

const globalError = JSON.parse(sessionStorage.getItem('globalError'));

import {monthToDays, get_csrfValue} from './clientUtils.js';

let _csrf = await clientUtils.get_csrfValue();

function addOptionToSelector(selector, value, textContent){
    const newOption = document.createElement('option');
    newOption.value = value;
    newOption.textContent = textContent;
    selector.appendChild(newOption);
}

// populates selectors with default values
function initializeSelectors(){
    for(let i = 1; i <= 12; i++){
        addOptionToSelector(monthSelector,i,i);
    }
    for(let i = 1; i <= 31; i++){
        addOptionToSelector(daySelector,i,i);
    }
    for(let i = 2025; i >= 1900; i--){
        addOptionToSelector(yearSelector,i,i);
    }

}

function validateDaySelector(monthNum, year = undefined){
    // if year is not passed, assumes non-leap year
    let numDays;
    try {
        numDays = monthToDays(monthNum, year);    
    } catch (error) {
        console.error(error.message);
    }
    
    // update which days are available for this month/year so we cant select invalid day
    for(let i = 1; i < daySelector.options.length; i++){
        let optionValue = daySelector.options[i].value;
        if(Number(optionValue) > numDays){ // this day should not be possible
            if(!daySelector.options[i].disabled){
                daySelector.options[i].disabled = true;
            }
        } else {
            if(daySelector.options[i].disabled){
                daySelector.options[i].disabled = false;
            }       
        }
    }

    // if a day has already been selected but it is invalid, update to highest possible day
    if(daySelector.value && Number(daySelector.value) > numDays){
        daySelector.value = String(numDays);
    }
}

// when year or month are selected, we must validate the possible days
function createSelectorEventListeners(){
    monthSelector.addEventListener('change', () => {
        validateDaySelector(monthSelector.value, yearSelector.value);
    });
    yearSelector.addEventListener('change', () => {
        validateDaySelector(monthSelector.value, yearSelector.value);
    });
}

// given day,month,year returns YYYY-MM-DD format
function formatDateToMySQL(day,month,year){
    if(day.length == 1){
        day = `0${day}`;
    }
    if(month.length == 1){
        month = `0${month}`;
    }
    let dateString = `${year}-${month}-${day}`;
    return dateString;
}

function resetErrors(){
    logInErrorDiv.innerText = "";
    signUpErrorDiv.innerText = "";
    forgotPassword.style.zIndex = -1;
}

// for existing user
// if email and password are not provided, function will obtain them from log-in forms
function logIn(email = undefined, password = undefined){
    resetErrors();
    if(!email){ // 
        email = logInEmailInput.value.trim();    
    }
    if(!password){
        password = logInPasswordInput.value;
    }
    const values = {email, password};

    fetch('user/login', { 
        method: 'POST', 
        headers: { 
            'Content-Type': 'application/json',
            'X-CSRF-Token': _csrf
        },
        body: JSON.stringify({
            values: values,
        })
    }).then(response => {  
        if (!response.ok) {  // If code is not between 200-299
            return response.json().then(error => {
                logInErrorDiv.innerText = error.message;
                if(error.message === "Incorrect password") {
                    forgotPassword.style.zIndex = 0;
                }
                throw new Error(error.message);
            });
        }
        return response.json();  // Parse JSON from login response
    }).then(data => {  // redirect to somewhere! Successful login
        if(globalError){ // clear global error if we just had one
            globalError.status = false;
            globalError.message = "";
        }
        localStorage.setItem("firstName", clientUtils.capitalizeFirstLetter(data.firstName));
        localStorage.setItem("lastName", clientUtils.capitalizeFirstLetter(data.lastName));
        localStorage.setItem("userUUID", data.userUUID);
        window.location.href = '/user/profile'; // implicit GET request!
    }).catch(error => {  // Catch any errors
        logInErrorDiv.innerText = error.message;
    });
}

// for new user
function signUp(){
    resetErrors();
    let emailAlreadyRegistered = false;
    let firstName = signUpFirstNameInput.value;
    let lastName = signUpLastNameInput.value;
    let email = signUpEmailInput.value;
    let password = newPasswordInput.value;
    let confirmedPassword = newPasswordConfirmInput.value;
    let month = monthSelector.value;
    let day = daySelector.value;
    let year = yearSelector.value; 
    
    const values = {
        firstName,
        lastName,
        email,
        password,
        confirmedPassword,
        birthday: formatDateToMySQL(day, month, year) 
    };

    fetch('user/register', {
        method: 'POST',
        headers:{ // indicates we are sending json data
            'Content-Type': 'application/json',
            'X-CSRF-Token': _csrf
        },
        body: JSON.stringify({
            values: values,
        })
    }).then(response => {
        if(!response.ok){ // if code is not between 200-299
            return response.json().then(error => {
                signUpErrorDiv.innerText = error.message;
                throw new Error(error.message);
            });
        }
        return response.json();
    }).then(data => {
        logIn(email,password);
    }).catch(error => {
        console.error('Registration failure', error);
        signUpErrorDiv.innerText = error.message;
    });
}

function checkGlobalError(){
    if(globalError && globalError.status){
        logInErrorDiv.innerText = globalError.message;
        logInErrorDiv.style.zIndex = 0;
    }
}

async function resetPasswordButton() {
    const email = logInEmailInput.value.trim();
    const createResetToken = await clientUtils.networkRequestJson('/passtoken/createResetToken', null, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': _csrf
        },
        body: JSON.stringify({
            email
        })
    });
    console.table(createResetToken);
    logInErrorDiv.innerText = createResetToken.data.message;
}

function initializeLoginButtonEventListeners(){
    signUpButton.addEventListener('click', () => {
        try {
            signUp();
        } catch (error) {
            console.error(error.message);
        }
    })
    logInButton.addEventListener('click', () => {
        try {  
            logIn();
        } catch (error) {
            console.error(error.message);
        }
    })
    forgotPassword.addEventListener('click', () => {
        resetPasswordButton();
    })
}

initializeLoginButtonEventListeners();
initializeSelectors();
createSelectorEventListeners();
checkGlobalError();
// automatically logging in for development purposes
const userAgent = navigator.userAgent;
if(userAgent.includes("Chrome")){
    // logIn("gabewelvaert@gmail.com", "gabe");
} else {
    logIn("mikeehrmantraut@fake.com", "fake");
}