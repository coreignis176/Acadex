import { LuLayers } from "react-icons/lu";
import { NoData } from "../../components/NoData";

// shown on student pages when the admin has removed the student from their section
export const NoSection = () =>{
    return (
        <div className="bg-white border border-line rounded-xl">
            <NoData icon={<LuLayers/>} message="You are not assigned to a section"
                description="The admin registers every student into a course, year and section. Your Acadex account is still active, and your notifications are still available. Contact the academic office to be added to your section again."/>
        </div>
    )
}
