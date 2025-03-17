// utility functions available to client-side files

// switches an element's style.display between "block" or "inline-block" and "none" to hide or not hide an element
export function styleDisplayBlockHiddenSwitch(HTMLelement, inlineblock = false){
    // assumes element doesn't have display set
    if(HTMLelement.style.display == "none"){ // switch to visible
        if(inlineblock){
            HTMLelement.style.display = "inline-block";    
        } else {
            HTMLelement.style.display = "block";        
        }
    } else { // switch to invisible
        HTMLelement.style.display = "none";
    }
}

// pass the value stored in the database to this funciton to
// generate a client-side blob (temporary file)
export async function getBlobOfSavedImage(blobCache, fileLocator){
    if(blobCache[fileLocator]){
        return blobCache[fileLocator];
    } else {
        const response = await fetch(`/file/getFile/${fileLocator}`);
        const blob = await response.blob();    
        const objectURL = URL.createObjectURL(blob)
        blobCache[fileLocator] = objectURL;
        return objectURL;
    }
}

export const validImageMIMETypes = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"]
};

export function isValidImage(file) {
    if(!file){
        return false;
    }
    const mimeType = file.type;
    const extension = file.name.split('.').pop().toLowerCase();
    
    return validImageMIMETypes[mimeType]?.some(ext => ext.slice(1) === extension);
}

export function startsWithVowel(str) {
    if(!str || typeof str !== 'string'){
        return false;
    }
    return /^[aeiouAEIOU]/.test(str);
}

export function removeTabsAndNewlines(str) {
    return str.replace(/[\t\n\r]/g, '');
}

export function capitalizeFirstLetter(str) {
    if(!str){
        return str;   
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export async function get_csrfValue(){
    const response = await fetch('/csrf-token' , {credentials: 'same-origin'});
    const data = await response.json();
    return data.csrfToken; // copy of value stored in _csrf cookie
}

export function formatDateTime(datetime) {
    const date = new Date(datetime);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = months[date.getMonth()];  
    const day = date.getDate(); 
    const year = date.getFullYear();  
    let hours = date.getHours();  
    const minutes = String(date.getMinutes()).padStart(2, '0'); 
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;  
    return `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
}

export function timeAgo(datetime) {
    const now = new Date();
    const pastDate = new Date(datetime);
    const diffInMs = now - pastDate;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInSeconds < 60) {
        return `${diffInSeconds} second${diffInSeconds === 1 ? '' : 's'} ago`;
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else {
        return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }
    return "Just now!";
}


// given monthNum and year, returns number of days 
// if year is not passed, function will assume it is not a leap year
// if month is not passed, function will return 31 days
export function monthToDays(monthNum, year = undefined){ 
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