// window.onload = function() {
//     const divs = document.querySelectorAll('div');
//     divs.forEach(div => {
//         div.style.border = '1px solid red';
//     });
// };

const pageHeaderName = document.getElementById("header-name");
const profileContentHeaderName = document.getElementById("profile-content-header-name");

function capitalizeFirstLetter(str) {
    if(!str){
        return str;   
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function updateNames(){
    const sessionUser = JSON.parse(localStorage.getItem('user'));
    console.log(sessionUser)
    if(!sessionUser){
        headerName.innerHTML = "Undefined";
        return;
    }
    let firstName = capitalizeFirstLetter(sessionUser.firstName);
    let lastName = capitalizeFirstLetter(sessionUser.lastName);
    pageHeaderName.innerHTML = `${firstName} ${lastName}`;
    profileContentHeaderName.innerHTML = `${firstName} ${lastName}`;
}

updateNames();