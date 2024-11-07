const headerName = document.getElementById("header-name");

function capitalizeFirstLetter(str) {
    if(!str){
        return str;   
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function updateHeaderName(){
    const sessionUser = JSON.parse(localStorage.getItem('user'));
    console.log(sessionUser)
    if(!sessionUser){
        headerName.innerHTML = "Undefined";
        return;
    }
    let firstName = capitalizeFirstLetter(sessionUser.firstName);
    let lastName = capitalizeFirstLetter(sessionUser.lastName);
    headerName.innerHTML = `${firstName} ${lastName}`;

}

updateHeaderName();