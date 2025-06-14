// utility functions available to server-side files
const xss = require('xss'); // for XSS sanitization
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const storageType = process.env.STORAGE_TYPE;

class ServerUtils {

    constructor() {
        this.sep = `[\\s._\\-]*`;

        this.slurPatterns = [
            new RegExp(`n${this.sep}[1!i]${this.sep}g${this.sep}g${this.sep}[e3]${this.sep}r`, 'gi'),
            new RegExp(`n${this.sep}[i1!]${this.sep}[gq]${this.sep}[gq]${this.sep}[a@]`, 'gi'),
            new RegExp(`f${this.sep}[a@4]${this.sep}[gq]${this.sep}[gq]${this.sep}[o0]?${this.sep}[t+]`, 'gi'),
            new RegExp(`f${this.sep}[a@4]${this.sep}[gq]`, 'gi'),
            new RegExp(`d${this.sep}[y!i1]${this.sep}k${this.sep}[e3]?`, 'gi'),
            new RegExp(`t${this.sep}r${this.sep}[a@4]${this.sep}n${this.sep}n?${this.sep}[yi1!]`, 'gi'),
            new RegExp(`r${this.sep}[e3]${this.sep}[t7]${this.sep}[a@]${this.sep}r${this.sep}d`, 'gi'),
            new RegExp(`c${this.sep}h${this.sep}[i1!]${this.sep}n+${this.sep}k`, 'gi'),
            new RegExp(`k${this.sep}[i1!]${this.sep}[kq]${this.sep}[e3]`, 'gi'),
            new RegExp(`s${this.sep}[pb]${this.sep}[i1!]${this.sep}c`, 'gi'),
            new RegExp(`g${this.sep}[o0]{2,}${this.sep}k`, 'gi'),
            new RegExp(`t${this.sep}[o0]${this.sep}w+${this.sep}e${this.sep}l${this.sep}[h#]${this.sep}[e3]${this.sep}[a@]${this.sep}d`, 'gi'),
            new RegExp(`s${this.sep}[a@]${this.sep}n+${this.sep}d${this.sep}n${this.sep}[i1!]${this.sep}[gq]{2,}${this.sep}[e3]${this.sep}r`, 'gi'),
            new RegExp(`w${this.sep}[e3]${this.sep}[t7]${this.sep}b${this.sep}[a@]${this.sep}c${this.sep}k`, 'gi'),
            new RegExp(`r${this.sep}[a@]${this.sep}g${this.sep}[h#]${this.sep}[e3]${this.sep}[a@]${this.sep}d`, 'gi')
        ];

        this.userInfoNumberToColumnName = {0:"job",1:"education",2:"location",3:"hometown"};
    }

    capitalizeFirstLetter(str) {
        if(!str){
            return str;   
        }
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    removeSlurs(text) {
        let cleaned = text;
        for (const pattern of this.slurPatterns) {
            cleaned = cleaned.replace(pattern, '');
        }
        return cleaned;
    }

    detectSlurs(text) {
        for (let pattern of this.slurPatterns) {
            if (pattern.test(text)) {
                return true;
            }
        }
        return false; 
    }

    async deleteFile(fileLocator){ // doesn't need to be a controller. only called on server side
        try {
            if(storageType === "local") {
                let filePath = path.join(__dirname, "..", "private", fileLocator);
                if(!fs.existsSync(filePath)){
                    return false;
                }
                fs.unlink(filePath, (err) => {
                    if(err) {
                        console.error("file deletion failure");
                        return false;
                    } else {
                        return true;
                    }
                });
                return true;
            } else if (storageType === "s3"){
                // todo
            }
        } catch(error){
            console.error(`deleteFile server util error: ${error.message}`);
            return false;
        }
    }

    isDefined(val) {
        return val !== null && val !== undefined;
    }

    removeTabsAndNewlines(str) {
        return str.replace(/[\t\n\r]/g, '');
    }

    sanitizeInput(userInput) {
        return xss(userInput);
    }

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

    getTokenExpiry(){
        const currentDate = new Date();
        currentDate.setHours(currentDate.getHours() + 1); // add 1 hour
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const seconds = String(currentDate.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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