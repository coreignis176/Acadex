import express from "express";
import { validateUser, isAdmin } from "../middlewares/validator.js";
import {
    getadminstats, getstructure, addsection, renamesection, archivesection, getsection,
    addstudent, updatestudent, removestudent, getallstudents, resetpassword, selectcr, removecr,
    addsubject, updatesubject, removesubject, copysubjects
} from "../controllers/adminController.js";

const router = express.Router();

// mounted at /admin  -> every route: logged in + admin

// dashboard
router.route("/getadminstats").get(validateUser , isAdmin , getadminstats);
router.route("/getstructure").get(validateUser , isAdmin , getstructure);

// sections
router.route("/addsection").post(validateUser , isAdmin , addsection);
router.route("/renamesection").post(validateUser , isAdmin , renamesection);
router.route("/archivesection").post(validateUser , isAdmin , archivesection);
router.route("/getsection/:id").get(validateUser , isAdmin , getsection);

// students
router.route("/addstudent").post(validateUser , isAdmin , addstudent);
router.route("/updatestudent").post(validateUser , isAdmin , updatestudent);
router.route("/removestudent").post(validateUser , isAdmin , removestudent);
router.route("/getallstudents").get(validateUser , isAdmin , getallstudents);
router.route("/resetpassword").post(validateUser , isAdmin , resetpassword);

// CRs
router.route("/selectcr").post(validateUser , isAdmin , selectcr);
router.route("/removecr").post(validateUser , isAdmin , removecr);

// subjects of a section
router.route("/addsubject").post(validateUser , isAdmin , addsubject);
router.route("/updatesubject").post(validateUser , isAdmin , updatesubject);
router.route("/removesubject").post(validateUser , isAdmin , removesubject);
router.route("/copysubjects").post(validateUser , isAdmin , copysubjects);

export default router;
