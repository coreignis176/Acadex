import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import Navbar from "./components/Navbar";
import { Footer } from "./components/Footer";
import { PortalLayout } from "./components/portal/PortalLayout";

import Home from "./pages/home/Home";
import { About } from "./pages/about/About.jsx";
import { NotFound } from "./pages/NotFound.jsx";
import { Notifications } from "./pages/common/Notifications.jsx";

import { AdminDashboard } from "./pages/admin/AdminDashboard.jsx";
import { AcademicStructure } from "./pages/admin/AcademicStructure.jsx";
import { SectionStudents } from "./pages/admin/SectionStudents.jsx";
import { Students } from "./pages/admin/Students.jsx";
import { CrManagement } from "./pages/admin/CrManagement.jsx";

import { CrDashboard } from "./pages/cr/CrDashboard.jsx";
import { CrNotes } from "./pages/cr/CrNotes.jsx";
import { Approvals } from "./pages/cr/Approvals.jsx";
import { CrSection } from "./pages/cr/CrSection.jsx";

import { AllNotes } from "./pages/student/AllNotes.jsx";
import { UploadNotes } from "./pages/student/UploadNotes.jsx";
import { RecentNotes } from "./pages/student/RecentNotes.jsx";

const PORTAL_PATHS = ["/admin" , "/cr" , "/student"];

const isPortalPath = (pathname) => {
  for(const portalPath of PORTAL_PATHS){
    if(pathname === portalPath || pathname.startsWith(portalPath + "/")){
      return true;
    }
  }
  return false;
}

const KeepQuery = (props) => {
  const location = useLocation();
  const newAddress = props.to + location.search;
  return <Navigate to={newAddress} replace/>;
}

const App = () => {
  const location = useLocation();
  const inPortal = isPortalPath(location.pathname);

  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      offset: 80,
      once: true,
      mirror: false,
      anchorPlacement: "top-bottom",
    });
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      {!inPortal && <Navbar/>}
        <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/about" element={<About/>}/>

        <Route path="/admin" element={<PortalLayout portal="admin"/>}>
          <Route index element={<AdminDashboard/>}/>
          <Route path="structure" element={<AcademicStructure/>}/>
          <Route path="structure/:courseId" element={<AcademicStructure/>}/>
          <Route path="structure/:courseId/:year" element={<AcademicStructure/>}/>
          <Route path="sections/:sectionId" element={<SectionStudents/>}/>
          <Route path="students" element={<Students/>}/>
          <Route path="crs" element={<CrManagement/>}/>
          <Route path="notifications" element={<Notifications/>}/>
        </Route>

        <Route path="/cr" element={<PortalLayout portal="cr"/>}>
          <Route index element={<CrDashboard/>}/>
          <Route path="notes" element={<CrNotes/>}/>
          <Route path="approvals" element={<Approvals/>}/>
          <Route path="section" element={<CrSection/>}/>
          <Route path="notifications" element={<Notifications/>}/>
        </Route>

        <Route path="/student" element={<PortalLayout portal="student"/>}>
          <Route index element={<AllNotes/>}/>
          <Route path="upload" element={<UploadNotes/>}/>
          <Route path="history" element={<RecentNotes/>}/>
          <Route path="notifications" element={<Notifications/>}/>
          <Route path="notes" element={<KeepQuery to="/student"/>}/>
          <Route path="submissions" element={<Navigate to="/student/upload" replace/>}/>
        </Route>

        <Route path="*" element={<NotFound/>}/>
        </Routes>
      {!inPortal && <Footer/>}
    </>
  )
}

export default App;
