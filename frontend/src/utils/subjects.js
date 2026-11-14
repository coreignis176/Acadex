import { LuAtom, LuBookOpen, LuBraces, LuBrain, LuBriefcase, LuCalculator, LuChartLine, LuCloud, LuCode, LuCpu, LuDatabase, LuGlobe, LuHandshake, LuLandmark, LuLightbulb, LuMegaphone, LuMessageCircle, LuNetwork, LuScale, LuShield, LuSigma, LuUsers, LuWorkflow, LuZap } from "react-icons/lu";

// every subject gets a stable colour + icon so notes are easy to scan
const PALETTE = [
    {bg:"#e8f0fb" , fg:"#2b5d9e"},   // blue
    {bg:"#e3f4f1" , fg:"#1f7a6c"},   // teal
    {bg:"#efeafb" , fg:"#5b46a8"},   // violet
    {bg:"#fbf1dc" , fg:"#9a6512"},   // amber
    {bg:"#fbe9ee" , fg:"#a8395a"},   // rose
    {bg:"#e9f5e4" , fg:"#3f7a2e"},   // green
    {bg:"#fdeee3" , fg:"#b0541d"},   // orange
    {bg:"#e6f1f8" , fg:"#246a8c"}    // sky
];

// the first pattern that matches the subject name decides the icon
// How to read the patterns:  /a|b/i  = the name contains "a" OR "b"  (i = ignore capital / small letters)
const ICONS = [
    {pattern:/data struct|algorithm/i , icon:LuBraces},                // "data struct" or "algorithm"
    {pattern:/programming|compiler/i , icon:LuCode},                   // "programming" or "compiler"
    {pattern:/object oriented|c\+\+/i , icon:LuWorkflow},              // "object oriented" or "c++" (\+ = a real plus sign)
    {pattern:/database|sql/i , icon:LuDatabase},                       // "database" or "sql"
    {pattern:/math|discrete|statistic/i , icon:LuSigma},               // "math", "discrete" or "statistic"
    {pattern:/physics/i , icon:LuAtom},                                // "physics"
    {pattern:/electrical/i , icon:LuZap},                              // "electrical"
    {pattern:/organization|computer org|operating/i , icon:LuCpu},     // "organization", "computer org" or "operating"
    {pattern:/network/i , icon:LuNetwork},                             // "network"
    {pattern:/machine learning/i , icon:LuBrain},                      // "machine learning"
    {pattern:/cloud/i , icon:LuCloud},                                 // "cloud"
    {pattern:/security/i , icon:LuShield},                             // "security"
    {pattern:/software|project/i , icon:LuLightbulb},                  // "software" or "project"
    {pattern:/communication/i , icon:LuMessageCircle},                 // "communication"
    {pattern:/marketing/i , icon:LuMegaphone},                         // "marketing"
    {pattern:/accounting|economics/i , icon:LuCalculator},             // "accounting" or "economics"
    {pattern:/human resource|behaviour/i , icon:LuUsers},              // "human resource" or "behaviour"
    {pattern:/international/i , icon:LuGlobe},                         // "international"
    {pattern:/law/i , icon:LuScale},                                   // "law"
    {pattern:/entrepreneur/i , icon:LuHandshake},                      // "entrepreneur"
    {pattern:/strategic/i , icon:LuChartLine},                         // "strategic"
    {pattern:/management/i , icon:LuBriefcase},                        // "management"
    {pattern:/business/i , icon:LuLandmark}                            // "business"
];

//$ function to turn a text into a number that is always the same for the same text
const hash = (text = "") =>{
    let total = 0;
    for(let i = 0; i < text.length; i++){
        // ">>> 0" keeps the number a positive whole number that fits in 32 bits
        total = (total * 31 + text.charCodeAt(i)) >>> 0;
    }
    return total;
}

//$ function to pick a colour for a subject (the same subject always gets the same colour)
// % gives the remainder of a division, so the result is always 0 to 7 (a valid PALETTE position)
export const subjectColor = (subject) => PALETTE[hash(subject) % PALETTE.length];

//$ function to pick an icon for a subject (a book if nothing matches)
export const subjectIcon = (subject = "") =>{
    for(const entry of ICONS){
        if(entry.pattern.test(subject)) return entry.icon;
    }
    return LuBookOpen;
}

//$ function to get a short name for chips: "Object Oriented Programming (C++)" -> "OOP (C++)"
// (any subject not in the list keeps its full name)
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
