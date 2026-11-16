const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const formatDate = (iso) => new Date(iso).toLocaleDateString("en-IN" , {day:"numeric" , month:"short" , year:"numeric"});

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

const startOfDay = (date) => new Date(date.getFullYear() , date.getMonth() , date.getDate()).getTime();

export const dayLabel = (iso) =>{
    const date = new Date(iso);
    const today = new Date();
    const daysBetween = Math.round((startOfDay(today) - startOfDay(date)) / DAY);
    if(daysBetween === 0) return "Today";
    if(daysBetween === 1) return "Yesterday";
    return date.toLocaleDateString("en-IN" , {weekday:"long" , day:"numeric" , month:"long"});
}

export const initials = (name = "") =>{
    const words = name.split(" ").filter((word) => word !== "");
    let letters = "";
    for(let i = 0; i < words.length && i < 2; i++){
        letters = letters + words[i][0];
    }
    return letters.toUpperCase();
}

export const fileSize = (bytes) =>{
    if(!bytes) return "";
    if(bytes < 1024 * 1024) return `${Math.max(1 , Math.round(bytes / 1024))} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
