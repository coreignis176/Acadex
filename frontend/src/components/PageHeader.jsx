import { Fragment } from "react";
import { Link } from "react-router-dom";
import { LuChevronRight } from "react-icons/lu";

export const PageHeader = ({title , description , path = [] , actions}) =>{
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
            <div className="min-w-0">
                {path.length > 0 && (
                    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted mb-2">
                        {path.map((item , index) =>{
                            let stepClass = "";
                            if(index === path.length - 1){
                                stepClass = "text-ink font-medium";
                            }

                            let step = <span className={stepClass}>{item.label}</span>;
                            if(item.to){
                                step = <Link to={item.to} className="hover:text-primary hover:underline underline-offset-4">{item.label}</Link>;
                            }

                            return (
                                <Fragment key={index}>
                                    {index > 0 && <LuChevronRight className="w-3.5 h-3.5 text-muted/60"/>}
                                    {step}
                                </Fragment>
                            )
                        })}
                    </nav>
                )}
                <h1 className="text-2xl md:text-[1.75rem] font-semibold text-ink">{title}</h1>
                {description && <p className="text-muted mt-1 max-w-2xl">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
        </div>
    )
}
