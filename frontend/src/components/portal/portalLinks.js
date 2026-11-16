import { LuLayoutDashboard , LuNetwork , LuUsers , LuBell , LuBookOpen , LuClipboardCheck ,LuLibrary , LuUpload , LuHistory } from "react-icons/lu";
import { PiSealCheck } from "react-icons/pi";

export const portalLinks = {
    admin:[
        {label:"Dashboard" , to:"/admin" , icon:LuLayoutDashboard , end:true},
        {label:"Academic Structure" , to:"/admin/structure" , icon:LuNetwork},
        {label:"Students" , to:"/admin/students" , icon:LuUsers},
        {label:"CR Management" , to:"/admin/crs" , icon:PiSealCheck},
        {label:"Notifications" , to:"/admin/notifications" , icon:LuBell , badge:"unread"}
    ],
    cr:[
        {label:"Dashboard" , to:"/cr" , icon:LuLayoutDashboard , end:true},
        {label:"Notes" , to:"/cr/notes" , icon:LuBookOpen},
        {label:"Approvals" , to:"/cr/approvals" , icon:LuClipboardCheck , badge:"approvals"},
        {label:"My Section" , to:"/cr/section" , icon:LuUsers},
        {label:"Notifications" , to:"/cr/notifications" , icon:LuBell , badge:"unread"}
    ],
    student:[
        {label:"All Notes" , to:"/student" , icon:LuLibrary , end:true},
        {label:"Upload Notes" , to:"/student/upload" , icon:LuUpload},
        {label:"Recently Viewed" , to:"/student/history" , icon:LuHistory}
    ]
};

export const portalNames = {admin:"Admin Portal" , cr:"CR Portal" , student:"Student Portal"};

export const homePortal = (user) =>{
    if(user && user.role === "admin"){
        return "/admin";
    }
    return "/student";
}

export const publicLinks = [
    {label:"Home" , href:"/"},
    {label:"Features" , href:"/#features"},
    {label:"Subjects" , href:"/#subjects"},
    {label:"About" , href:"/about"}
];
