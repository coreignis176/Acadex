import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LuBell } from "react-icons/lu";
import { useGetnotificationsQuery, useMarknotificationsreadMutation } from "../../store/Api/Api";
import { PageHeader } from "../../components/PageHeader";
import { NotificationList } from "../../components/NotificationList";
import { Loader } from "../../components/Loader";
import { NoData } from "../../components/NoData";
import { dayLabel } from "../../utils/format";

const FILTERS = [
    {key:"all" , label:"All"},
    {key:"unread" , label:"Unread"},
    {key:"cr" , label:"CR"},
    {key:"notes" , label:"Notes"},
    {key:"section" , label:"Section"}
];

const matchesFilter = (notification , filter) =>{
    if(filter === "all") return true;
    if(filter === "unread") return !notification.read;
    if(filter === "section") return notification.type === "section" || notification.type === "student";
    return notification.type === filter;
}

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

export const Notifications = () =>{
    const [items , setItems] = useState([]);
    const [filter , setFilter] = useState("all");
    const {data , isLoading} = useGetnotificationsQuery();
    const [markread] = useMarknotificationsreadMutation();

    useEffect(() =>{
        if(data && data.success && data.data){
            setItems(data.data);
        }
    },[data]);

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

    const visible = items.filter((notification) => matchesFilter(notification , filter));
    const groups = groupByDay(visible);

    const unread = items.filter((notification) => !notification.read).length;

    const usedTypes = [];
    for(const notification of items){
        let type = notification.type;
        if(type === "student") type = "section";
        if(!usedTypes.includes(type)) usedTypes.push(type);
    }
    const filters = FILTERS.filter((option) => option.key === "all" || option.key === "unread" || usedTypes.includes(option.key));

    let description = "You're all caught up.";
    if(unread){
        const word = unread === 1 ? "notification" : "notifications";
        description = `You have ${unread} unread ${word}.`;
    }

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
                    let chipColors = "bg-white border-line text-ink/80 hover:border-primary/40";
                    if(filter === option.key) chipColors = "bg-primary text-white border-primary";
                    const chipClass = `px-3 py-1.5 rounded-full text-sm border ${chipColors}`;
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
