import { LuDownload, LuHeart, LuSearch, LuThumbsUp, LuUpload } from "react-icons/lu";
import { PiSealCheckFill } from "react-icons/pi";
import { SubjectIcon } from "../../components/SubjectIcon";
import { shortSubject } from "../../utils/subjects";
import { features } from "./homeData";

// turn the features list into an object so we can write byKey.share, byKey.search, ...
const byKey = {};
for(const feature of features){
    byKey[feature.key] = feature;
}

// how many notes each example subject shows in the big tile (same order as the subjects list)
const noteCounts = [4 , 3 , 2 , 1 , 1];

// one card in the features grid: title, text, and a small picture passed in as children
const Tile = ({feature , className = "" , children , dark = false}) =>{
    // colours for a light tile (the default)
    let tileColors = "bg-white border border-line";
    let titleColor = "";
    let textColor = "text-muted";
    // colours for a dark tile
    if(dark){
        tileColors = "bg-night text-white";
        titleColor = "text-white";
        textColor = "text-chalk";
    }
    const tileClass = `rounded-2xl p-6 md:p-7 flex flex-col ${tileColors} ${className}`;
    const titleClass = `text-xl font-semibold ${titleColor}`;
    const textClass = `mt-2 leading-relaxed ${textColor}`;

    return (
        <article className={tileClass}>
            <h3 className={titleClass}>{feature.title}</h3>
            <p className={textClass}>{feature.text}</p>
            <div className="mt-6 flex-1 flex items-end">{children}</div>
        </article>
    )
}

// what students can do on Acadex
export const Features = () =>{
    const subjects = ["Data Structures" , "Object Oriented Programming (C++)" , "Database Management Systems" , "Discrete Mathematics" , "Computer Organization"];
    return (
        <section id="features" className="scroll-mt-20 max-w-6xl mx-auto px-4 md:px-6 pb-20 md:pb-28">
            <div className="max-w-2xl mb-10">
                <h2 className="text-3xl md:text-[2.6rem] leading-tight font-semibold">Everything you need to study together</h2>
                <p className="text-muted mt-4 text-lg leading-relaxed">Three things, done well: find notes, keep them, and share yours.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {/* large: subject-wise */}
                <Tile feature={byKey.subjects} className="md:col-span-2 md:row-span-2" dark>
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {subjects.map((subject , index) =>{
                            // the first row is highlighted in white, the others are see-through
                            let rowColors = "bg-white/6 border border-white/10";
                            let nameColor = "text-white";
                            let countColor = "text-chalk/70";
                            if(index === 0){
                                rowColors = "bg-white text-ink";
                                nameColor = "";
                                countColor = "text-muted";
                            }
                            const rowClass = `flex items-center gap-3 rounded-xl px-3 py-2.5 ${rowColors}`;
                            const nameClass = `text-sm font-medium truncate ${nameColor}`;
                            const countClass = `ml-auto text-xs tabular-nums ${countColor}`;
                            return (
                                <div key={subject} className={rowClass}>
                                    <SubjectIcon subject={subject} size="w-9 h-9" iconSize="w-4 h-4"/>
                                    <span className={nameClass}>{shortSubject(subject)}</span>
                                    <span className={countClass}>{noteCounts[index]} notes</span>
                                </div>
                            )
                        })}
                    </div>
                </Tile>

                {/* share */}
                <Tile feature={byKey.share}>
                    <div className="w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary-soft/50 px-4 py-4 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center"><LuUpload className="w-4 h-4"/></span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">Recursion Practice Set.pdf</p>
                            <p className="text-xs text-muted">Shared with your class</p>
                        </div>
                    </div>
                </Tile>

                {/* checked */}
                <Tile feature={byKey.checked}>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-seal-soft text-seal text-sm font-semibold">
                        <PiSealCheckFill className="w-5 h-5"/> Checked and ready to read
                    </div>
                </Tile>

                {/* search */}
                <Tile feature={byKey.search}>
                    <div className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-line bg-canvas text-sm">
                        <LuSearch className="w-4 h-4 text-muted"/>
                        <span>operator overl</span><span className="w-px h-4 bg-primary animate-pulse"/>
                    </div>
                </Tile>

                {/* rate */}
                <Tile feature={byKey.rate}>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-soft text-primary text-sm font-semibold"><LuThumbsUp className="w-4 h-4"/> 9</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fbe9ee] text-[#a8395a] text-sm font-semibold"><LuHeart className="w-4 h-4"/> Most liked this week</span>
                    </div>
                </Tile>

                {/* download */}
                <Tile feature={byKey.download}>
                    <div className="w-full">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-medium truncate">Inheritance and Virtual Functions</span>
                            <LuDownload className="w-4 h-4 text-primary shrink-0"/>
                        </div>
                        <div className="h-1.5 rounded-full bg-line overflow-hidden"><div className="h-full w-full bg-ok rounded-full"/></div>
                        <p className="text-xs text-muted mt-1.5">3.1 MB, saved</p>
                    </div>
                </Tile>
            </div>
        </section>
    )
}
