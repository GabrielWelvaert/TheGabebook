// utility functions available to server-side files

class ServerUtils {
    countTabsAndNewlines(str) {
        const tabCount = (str.match(/\t/g) || []).length;  // Count tabs
        const newlineCount = (str.match(/\n/g) || []).length;  // Count newlines
        // Return the sum of tabs and newlines
        return tabCount + newlineCount;
    }
    
    // for mysql datetime columns
    getCurrentDateTime() {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); 
        const day = String(currentDate.getDate()).padStart(2, '0');
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const seconds = String(currentDate.getSeconds()).padStart(2, '0');
        const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        return formattedDateTime;
    }

    // this function expects dateString to be passed as a SQL date string ex: "1900-01-01"
    validBirthday(dateString){ 
        const year = parseInt(dateString.slice(0,4));
        const month = parseInt(dateString.slice(5,7));
        const day = parseInt(dateString.slice(8,10));
        let maxDaysThisMonth = 0;
        // this switch case will correctly update the maxDaysThisMonth int so that we can
        // make sure we have a legal amount of days 
        switch(month){
            case 1:
            case 3:
            case 5:
            case 7:
            case 8:
            case 10:
            case 12:{
                maxDaysThisMonth = 31;
                break;
            }
            case 4:
            case 6:
            case 9:
            case 11:{
                maxDaysThisMonth = 30;
                break;
            }
            case 2:{
                if(year && ((year % 4 === 0) && (year % 100 !== 0 || year % 400 === 0))){ // leap year
                    maxDaysThisMonth = 29;  
                } else {
                    maxDaysThisMonth = 28; 
                }
                break;
            }
            default:{
                console.error(`validBirthday() Invalid month: (${month})`);
                return false;
            }
        }
    
        if(day < 0 || year < 1900 || year > 2024 || day > maxDaysThisMonth){
            console.error(`day ${day} invalid for month ${month} with year ${year}`);
            return false;
        }
        return true;
    }
}

module.exports = new ServerUtils();