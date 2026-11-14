// small display helpers shared by every portal

// lengths of time in milliseconds (JavaScript dates count in milliseconds)
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

//$ function to show a date like "12 Nov 2026"
export const formatDate = (iso) => new Date(iso).toLocaleDateString("en-IN" , {day:"numeric" , month:"short" , year:"numeric"});


//$ "just now" , "5 min ago" , "3 h ago" , "2 days ago" , then a date
export const timeAgo = (iso) =>{
    const diff = Date.now() - new Date(iso).getTime();
    if(diff < MINUTE) return "just now";
    if(diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
    if(diff < DAY) return `${Math.floor(diff / HOUR)} h ago`;
    if(diff < 7 * DAY){
        const days = Math.floor(diff / DAY);
        if(days === 1) return "yesterday";
        return `${days} days ago`;
    }
    return formatDate(iso);
}

//$ function to get the time of midnight (start) of a date's day
const startOfDay = (date) => new Date(date.getFullYear() , date.getMonth() , date.getDate()).getTime();

//$ "Today" , "Yesterday" or "Monday, 12 November" - used to group notes / notifications by day
export const dayLabel = (iso) =>{
    const date = new Date(iso);
    const today = new Date();
    // compare whole days (midnight to midnight), not the exact hours
    const daysBetween = Math.round((startOfDay(today) - startOfDay(date)) / DAY);
    if(daysBetween === 0) return "Today";
    if(daysBetween === 1) return "Yesterday";
    return date.toLocaleDateString("en-IN" , {weekday:"long" , day:"numeric" , month:"long"});
}

//$ function to get the first letters of the first two words: "Aarav Sharma" -> "AS"
export const initials = (name = "") =>{
    const words = name.split(" ").filter((word) => word !== "");   // drop the empty bits made by double spaces
    let letters = "";
    for(let i = 0; i < words.length && i < 2; i++){
        letters = letters + words[i][0];
    }
    return letters.toUpperCase();
}

//$ "1.2 MB" from a byte count
export const fileSize = (bytes) =>{
    if(!bytes) return "";
    // under 1 MB -> show KB (at least "1 KB", never "0 KB")
    if(bytes < 1024 * 1024) return `${Math.max(1 , Math.round(bytes / 1024))} KB`;
    // toFixed(1) = keep one digit after the dot: 1.25 -> "1.3"
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
