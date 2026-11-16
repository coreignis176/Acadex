import Landing from "./Landing";
import { SubjectRibbon } from "./SubjectRibbon";
import { Moments } from "./Moments";
import { Problem } from "./Problem";
import { Features } from "./Features";
import { CallToAction, Steps } from "./Steps";

const Home = () =>{
    return (
        <main>
            <Landing/>
            <SubjectRibbon/>
            <Moments/>
            <Problem/>
            <Features/>
            <Steps/>
            <CallToAction/>
        </main>
    )
}

export default Home;
