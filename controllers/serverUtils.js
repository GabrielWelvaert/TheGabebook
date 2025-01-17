// utility functions available to server-side files

class ServerUtils {
    countTabsAndNewlines(str) {
        const tabCount = (str.match(/\t/g) || []).length;  // Count tabs
        const newlineCount = (str.match(/\n/g) || []).length;  // Count newlines
        // Return the sum of tabs and newlines
        return tabCount + newlineCount;
    }
    
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
}

module.exports = new ServerUtils();