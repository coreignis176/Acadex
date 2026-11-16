import { LuAtom, LuBookOpen, LuBraces, LuBrain, LuBriefcase, LuCalculator, LuChartLine, LuCloud, LuCode, LuCpu, LuDatabase, LuGlobe, LuHandshake, LuLandmark, LuLightbulb, LuMegaphone, LuMessageCircle, LuNetwork, LuScale, LuShield, LuSigma, LuUsers, LuWorkflow, LuZap } from "react-icons/lu";

const PALETTE = [
    {bg:"#e8f0fb" , fg:"#2b5d9e"},
    {bg:"#e3f4f1" , fg:"#1f7a6c"},
    {bg:"#efeafb" , fg:"#5b46a8"},
    {bg:"#fbf1dc" , fg:"#9a6512"},
    {bg:"#fbe9ee" , fg:"#a8395a"},
    {bg:"#e9f5e4" , fg:"#3f7a2e"},
    {bg:"#fdeee3" , fg:"#b0541d"},
    {bg:"#e6f1f8" , fg:"#246a8c"}
];

const ICONS = [
    {pattern:/data struct|algorithm/i , icon:LuBraces},
    {pattern:/programming|compiler/i , icon:LuCode},
    {pattern:/object oriented|c\+\+/i , icon:LuWorkflow},
    {pattern:/database|sql/i , icon:LuDatabase},
    {pattern:/math|discrete|statistic/i , icon:LuSigma},
    {pattern:/physics/i , icon:LuAtom},
    {pattern:/electrical/i , icon:LuZap},
    {pattern:/organization|computer org|operating/i , icon:LuCpu},
    {pattern:/network/i , icon:LuNetwork},
    {pattern:/machine learning/i , icon:LuBrain},
    {pattern:/cloud/i , icon:LuCloud},
    {pattern:/security/i , icon:LuShield},
    {pattern:/software|project/i , icon:LuLightbulb},
    {pattern:/communication/i , icon:LuMessageCircle},
    {pattern:/marketing/i , icon:LuMegaphone},
    {pattern:/accounting|economics/i , icon:LuCalculator},
    {pattern:/human resource|behaviour/i , icon:LuUsers},
    {pattern:/international/i , icon:LuGlobe},
    {pattern:/law/i , icon:LuScale},
    {pattern:/entrepreneur/i , icon:LuHandshake},
    {pattern:/strategic/i , icon:LuChartLine},
    {pattern:/management/i , icon:LuBriefcase},
    {pattern:/business/i , icon:LuLandmark}
];

const hash = (text = "") =>{
    let total = 0;
    for(let i = 0; i < text.length; i++){
        total = (total * 31 + text.charCodeAt(i)) >>> 0;
    }
    return total;
}

export const subjectColor = (subject) => PALETTE[hash(subject) % PALETTE.length];

export const subjectIcon = (subject = "") =>{
    for(const entry of ICONS){
        if(entry.pattern.test(subject)) return entry.icon;
    }
    return LuBookOpen;
}

export const shortSubject = (subject = "") =>{
    const known = {
        "Object Oriented Programming (C++)":"OOP (C++)",
        "Database Management Systems":"DBMS",
        "Design & Analysis of Algorithms":"Algorithms",
        "Engineering Mathematics I":"Maths I",
        "Basic Electrical Engineering":"Electrical",
        "Human Resource Management":"HR Management"
    };
    return known[subject] || subject;
}
