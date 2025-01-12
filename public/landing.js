// window.onload = function() {
//     const divs = document.querySelectorAll('div');
//     divs.forEach(div => {
//         div.style.border = '1px solid red';
//     });
// };

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
    for(let i = 1900; i <= 2024; i++){
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

// given monthNum and year, returns number of days 
// if year is not passed, function will assume it is not a leap year
// if month is not passed, function will return 31 days
function monthToDays(monthNum, year = undefined){ 
    let yearCopy = year;
    // paramters are expected as numeric strings from selector input
    if(!monthNum){
        return 31;
    } else {
        monthNum = Number(monthNum);    
    }
    if(year){
        year = Number(year);
        if(Number.isNaN(year) || year < 1900 || year > 2024){
            throw new Error(`monthToDays() Invalid year: (${yearCopy})`);
        }
    }

    switch(monthNum){
        case 1:
        case 3:
        case 5:
        case 7:
        case 8:
        case 10:
        case 12:{
            return 31;
        }
        case 4:
        case 6:
        case 9:
        case 11:{
            return 30;
        }
        case 2:{
            if(year && ((year % 4 === 0) && (year % 100 !== 0 || year % 400 === 0))){ // leap year
                return 29;  
            } else {
                return 28; 
            }
        }
        default:{
            throw new Error(`monthToDays() Invalid monthNum: (${monthNum})`);
        }
    }

    throw new Error(`monthToDays(${monthNum}, ${yearCopy}) parameter error!`);
    return -1;
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
    logInErrorDiv.innerHTML = "";
    signUpErrorDiv.innerHTML = "";
    forgotPassword.style.zIndex = -1;
}

// for existing user
function logIn(){
    resetErrors();
    let email = logInEmailInput.value.trim();
    let password = logInPasswordInput.value;
    const values = {email, password};

    fetch('user/login', {
        method: 'POST',
        headers:{ // indicates we are sending json data
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
    }).then(response => { // get JSON response, process errors or save login token
        if(!response.ok){ // if code is not between 200-299
            return response.json().then(error => {
                logInErrorDiv.innerHTML = error.message;
                if(error.message === "Incorrect password"){
                    forgotPassword.style.zIndex = 0;
                }
                throw new Error(error.message);
            })
        }
        return response.json();
    }).then(data =>{ // redirect to profile page
        // session user returned as part of http response from UserController's loginUser
        // todo stop using localStorage and use express-session
        localStorage.setItem('user', JSON.stringify(data.sessionUser));
        window.location.href = '/user/profile';
    }).catch(error => { 
        logInErrorDiv.innerHTML = error.message;
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
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
    }).then(response => {
        if(!response.ok){ // if code is not between 200-299
            return response.json().then(error => {
                signUpErrorDiv.innerHTML = error.message;
                throw new Error(error.message);
            });
        }
        return response.json();
    }).catch(error => {
        console.error('Registration failure', error);
        signUpErrorDiv.innerHTML = error.message;
    });
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
        console.log("forgor pw button clicked!");
    })
}

initializeLoginButtonEventListeners();
initializeSelectors();
createSelectorEventListeners();