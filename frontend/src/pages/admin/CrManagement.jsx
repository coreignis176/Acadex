import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { PiSealCheck } from "react-icons/pi";
import { useGetadminstatsQuery, useRemovecrMutation } from "../../store/Api/Api";
import { PageHeader } from "../../components/PageHeader";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { RoleBadge } from "../../components/StatusBadge";
import { Loader } from "../../components/Loader";
import { NoData } from "../../components/NoData";

const CrRow = ({student , onRemove}) =>{
    const isActive = student.crStatus === "active";

    let sealClass = "w-10 h-10 shrink-0 rounded-full hidden sm:flex items-center justify-center ";
    if(isActive){
        sealClass = sealClass + "bg-seal-soft text-seal";
    }
    else{
        sealClass = sealClass + "border border-dashed border-seal/60 text-seal";
    }

    let buttonText = "Withdraw request";
    if(isActive){
        buttonText = "Remove from CR";
    }

    let sectionId;
    let sectionLabel;
    if(student.section){
        sectionId = student.section._id;
        sectionLabel = student.section.label;
    }

    return (
        <li className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
            <div className={sealClass}>
                <PiSealCheck className="w-5 h-5"/>
            </div>
            <div className="min-w-0 flex-1">
                <p className="font-medium">{student.name} <span className="text-muted font-normal tabular-nums">({student.rollNo})</span></p>
                <Link to={`/admin/sections/${sectionId}`} className="text-sm text-muted hover:text-primary hover:underline">{sectionLabel}</Link>
            </div>
            <RoleBadge crStatus={student.crStatus}/>
            <button onClick={() => onRemove(student)}
                className="px-3 py-1.5 rounded-lg border border-line text-sm font-medium hover:border-bad/40 hover:text-bad self-start sm:self-auto">
                {buttonText}
            </button>
        </li>
    )
}

export const CrManagement = () =>{
    const Navigate = useNavigate();
    const [lists , setLists] = useState({active:[] , pending:[]});
    const [tab , setTab] = useState("active");
    const [confirm , setConfirm] = useState(null);
    const [working , setWorking] = useState(false);
    const {data , isLoading} = useGetadminstatsQuery();
    const [removecr] = useRemovecrMutation();

    useEffect(() =>{
        if(data && data.success && data.data){
            setLists({active:data.data.crAssignments , pending:data.data.pendingCrs});
        }
    },[data]);

    const handleRemove = async () =>{
        try{
            setWorking(true);
            const result = await removecr({studentId:confirm._id}).unwrap();
            if(result?.success) toast.success(result.message);
        }
        catch(error){
            toast.error(error?.data?.message || "Could Not Update The CR");
        }
        finally{
            setWorking(false);
            setConfirm(null);
        }
    }

    if(isLoading) return <Loader/>;

    const rows = lists[tab];

    const tabs = [
        {key:"active" , label:"Active" , count:lists.active.length},
        {key:"pending" , label:"Awaiting confirmation" , count:lists.pending.length}
    ];

    let listContent;
    if(rows.length === 0){
        let emptyMessage = "No CR requests are waiting";
        let emptyDescription = "Every CR request has been confirmed or answered.";
        if(tab === "active"){
            emptyMessage = "No confirmed CRs yet";
            emptyDescription = "Open a section and use Select as CR. The student confirms before getting CR permissions.";
        }
        listContent = (
            <NoData compact icon={<PiSealCheck/>}
                message={emptyMessage}
                description={emptyDescription}
                buttonText="Open academic structure" onClick={() => Navigate("/admin/structure")}/>
        );
    }
    else{
        listContent = (
            <ul className="divide-y divide-line">
                {rows.map((student) => <CrRow key={student._id} student={student} onRemove={setConfirm}/>)}
            </ul>
        );
    }

    let confirmTitle = "";
    let confirmButton = "";
    let confirmMessage = "";
    if(confirm){
        let sectionLabel;
        if(confirm.section){
            sectionLabel = confirm.section.label;
        }

        if(confirm.crStatus === "active"){
            confirmTitle = `Remove ${confirm.name} as CR?`;
            confirmButton = "Remove from CR";
            confirmMessage = `${confirm.name} loses CR permissions and CR portal access for ${sectionLabel}. Their student account stays active, they and their section are notified, and the position opens again.`;
        }
        else{
            confirmTitle = "Withdraw the CR request?";
            confirmButton = "Withdraw request";
            confirmMessage = `The request to ${confirm.name} is cancelled and the CR position in ${sectionLabel} opens again.`;
        }
    }

    return (
        <div>
            <PageHeader title="CR Management"
                description="Acadex does not hold CR elections. Identify the Class Representatives your college has already appointed, at most two per section."
                actions={<Link to="/admin/structure" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-line bg-white text-sm font-medium hover:border-primary/40 hover:text-primary">
                    <PiSealCheck className="w-4 h-4"/> Select a CR from a section
                </Link>}/>

            <div className="bg-white border border-line rounded-xl">
                <div className="flex flex-wrap items-center gap-3 p-4 border-b border-line">
                    <div className="inline-flex p-1 rounded-lg bg-canvas border border-line text-sm" role="tablist" aria-label="CR status">
                        {tabs.map((tabItem) =>{
                            let buttonClass = "px-3 py-1.5 rounded-md inline-flex items-center gap-2 ";
                            if(tab === tabItem.key){
                                buttonClass = buttonClass + "bg-white shadow-sm font-medium";
                            }
                            else{
                                buttonClass = buttonClass + "text-muted hover:text-ink";
                            }

                            let countClass = "text-xs tabular-nums px-1.5 rounded ";
                            if(tabItem.key === "pending" && tabItem.count){
                                countClass = countClass + "bg-wait-soft text-wait";
                            }
                            else{
                                countClass = countClass + "bg-canvas text-muted";
                            }

                            return (
                                <button key={tabItem.key} role="tab" aria-selected={tab === tabItem.key} onClick={() => setTab(tabItem.key)}
                                    className={buttonClass}>
                                    {tabItem.label}
                                    <span className={countClass}>{tabItem.count}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {listContent}
            </div>

            {confirm && (
                <ConfirmDialog loading={working} onConfirm={handleRemove} onClose={() => setConfirm(null)}
                    title={confirmTitle}
                    confirmText={confirmButton}
                    message={confirmMessage}/>
            )}
        </div>
    )
}
