export const Loader = ({full = false , label = "Loading"}) =>{
    let boxClass = "w-full py-24 flex flex-col gap-3 items-center justify-center";
    if(full){
        boxClass = "fixed inset-0 z-50 bg-canvas flex flex-col gap-3 items-center justify-center";
    }

    return (
        <div className={boxClass} role="status">
            <img src="/loader.svg" alt="" className="w-9 h-9"/>
            <p className="text-sm text-muted">{label}...</p>
        </div>
    )
}
