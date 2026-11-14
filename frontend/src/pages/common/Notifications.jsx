import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LuBell } from "react-icons/lu";
import { useGetnotificationsQuery, useMarknotificationsreadMutation } from "../../store/Api/Api";
import { PageHeader } from "../../components/PageHeader";
import { NotificationList } from "../../components/NotificationList";
import { Loader } from "../../components/Loader";
import { NoData } from "../../components/NoData";
import { dayLabel } from "../../utils/format";

// the filter chips at the top of the page
const FILTERS = [
    {key:"all" , label:"All"},
    {key:"unread" , label:"Unread"},
    {key:"cr" , label:"CR"},
    {key:"notes" , label:"Notes"},
    {key:"section" , label:"Section"}
];

// true when a notification should be shown for the chosen filter chip
const matchesFilter = (notification , filter) =>{
    if(filter === "all") return true;
    if(filter === "unread") return !notification.read;
    // "Section" also covers notifications about students of the section
    if(filter === "section") return notification.type === "section" || notification.type === "student";
    // "CR" and "Notes" match the notification type directly
    return notification.type === filter;
}

// group a newest-first list by day so it reads like a timeline, e.g. [{label:"Today" , items:[...]} , ...]
// because the list is already sorted, notifications of the same day are next to each other
const groupByDay = (notifications) =>{
    const result = [];
    for(const notification of notifications){
        const label = dayLabel(notification.createdAt);
        const lastGroup = result[result.length - 1];
        if(lastGroup && lastGroup.label === label) lastGroup.items.push(notification);
        else result.push({label , items:[notification]});
    }
    return result;
}

// shared by all three portals (route /admin|cr|student/notifications)
export const Notifications = () =>{
    const [items , setItems] = useState([]); // all my notifications
    const [filter , setFilter] = useState("all"); // the picked filter chip
    const {data , isLoading} = useGetnotificationsQuery();
    const [markread] = useMarknotificationsreadMutation();

    // runs whenever new data arrives from the server and copies the notifications into state
    useEffect(() =>{
        if(data && data.success && data.data){
            setItems(data.data);
        }
    },[data]);

    //$ function to mark all notifications as read
    const handleMarkAll = async () =>{
        try{
            const result = await markread({}).unwrap();
            toast.success(result.message);
        }
        catch(error){
            toast.error(error?.data?.message || "Could Not Update Notifications");
        }
    }

    if(isLoading) return <Loader/>;

    // keep only the notifications that match the chosen filter chip, then group them by day
    const visible = items.filter((notification) => matchesFilter(notification , filter));
    const groups = groupByDay(visible);

    const unread = items.filter((notification) => !notification.read).length;

    // which notification types I actually have ("student" counts as "section")
    const usedTypes = [];
    for(const notification of items){
        let type = notification.type;
        if(type === "student") type = "section";
        if(!usedTypes.includes(type)) usedTypes.push(type);
    }
    // always show "All" and "Unread"; show the other chips only when I have that type of notification
    const filters = FILTERS.filter((option) => option.key === "all" || option.key === "unread" || usedTypes.includes(option.key));

    // text under the page title
    let description = "You're all caught up.";
    if(unread){
        const word = unread === 1 ? "notification" : "notifications";
        description = `You have ${unread} unread ${word}.`;
    }

    // the list area: an empty message or the notifications grouped by day
    let content;
    if(groups.length === 0){
        let emptyMessage = "No notifications here";
        if(filter === "unread") emptyMessage = "No unread notifications";
        content = <NoData icon={<LuBell/>} message={emptyMessage}
            description="Updates about your section, CR appointments and notes appear here."/>;
    }
    else{
        content = groups.map((group) => (
            <section key={group.label}>
                <h2 className="px-5 py-2 bg-canvas/70 border-y first:border-t-0 border-line text-sm font-sans font-semibold text-ink/80">{group.label}</h2>
                <NotificationList items={group.items}/>
            </section>
        ));
    }

    return (
        <div className="max-w-3xl">
            <PageHeader
                title="Notifications"
                description={description}
                actions={unread > 0 && (
                    <button onClick={handleMarkAll} className="px-4 py-2 rounded-lg border border-line bg-white text-sm font-medium hover:border-primary/40">
                        Mark all as read
                    </button>
                )}
            />

            <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Filter notifications">
                {filters.map((option) =>{
                    // the picked chip is filled with the primary colour
                    let chipColors = "bg-white border-line text-ink/80 hover:border-primary/40";
                    if(filter === option.key) chipColors = "bg-primary text-white border-primary";
                    const chipClass = `px-3 py-1.5 rounded-full text-sm border ${chipColors}`;
                    // the "Unread" chip also shows how many are unread, e.g. "Unread (3)"
                    let countText = "";
                    if(option.key === "unread" && unread > 0) countText = ` (${unread})`;
                    return (
                        <button key={option.key} role="tab" aria-selected={filter === option.key} onClick={() => setFilter(option.key)}
                            className={chipClass}>
                            {option.label}{countText}
                        </button>
                    )
                })}
            </div>

            <div className="bg-white border border-line rounded-xl overflow-hidden">
                {content}
            </div>
        </div>
    )
}
