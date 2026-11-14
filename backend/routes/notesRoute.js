import express from "express";
import { validateUser, isStudent } from "../middlewares/validator.js";
import { uploadPages } from "../middlewares/multer.js";
import { getsubjects, getsubjectlist, getnotes, getmysubmissions, submitnote, reactnote, viewnote, getrecent, clearrecent } from "../controllers/notesController.js";

const router = express.Router();

// mounted at /notes  -> every route: logged in + student (CRs are students too)
router.route("/getsubjects").get(validateUser , isStudent , getsubjects);
router.route("/getsubjectlist").get(validateUser , isStudent , getsubjectlist);
router.route("/getnotes").get(validateUser , isStudent , getnotes);
router.route("/getmysubmissions").get(validateUser , isStudent , getmysubmissions);
router.route("/submitnote").post(validateUser , isStudent , uploadPages , submitnote);     // form-data with "pages" images
router.route("/reactnote").post(validateUser , isStudent , reactnote);

// Recently Viewed (a stack, run by our C program connect_pbl/c/recent_stack.c)
router.route("/viewnote").post(validateUser , isStudent , viewnote);          // a note was opened -> push
router.route("/getrecent").get(validateUser , isStudent , getrecent);         // the history page -> show
router.route("/clearrecent").post(validateUser , isStudent , clearrecent);    // "Clear history" -> clear

export default router;
