// white content block with an optional heading row
export const Panel = ({title , action , children , className = "" , padded = true}) =>{
    const sectionClass = "bg-white border border-line rounded-xl " + className;

    let bodyClass = "";
    if(padded){
        bodyClass = "p-5";
    }

    return (
        <section className={sectionClass}>
            {(title || action) && (
                <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-line">
                    <h2 className="text-base font-semibold font-sans">{title}</h2>
                    {action}
                </div>
            )}
            <div className={bodyClass}>{children}</div>
        </section>
    )
}
