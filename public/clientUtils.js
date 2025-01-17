// utility functions available to client-side files

export function capitalizeFirstLetter(str) {
    if(!str){
        return str;   
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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