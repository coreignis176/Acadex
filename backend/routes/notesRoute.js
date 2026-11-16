import express from "express";
import { validateUser, isStudent } from "../middlewares/validator.js";
import { uploadPages } from "../middlewares/multer.js";
import { getsubjects, getsubjectlist, getnotes, getmysubmissions, submitnote, reactnote, viewnote, getrecent, clearrecent } from "../controllers/notesController.js";

const router = express.Router();

router.route("/getsubjects").get(validateUser , isStudent , getsubjects);
router.route("/getsubjectlist").get(validateUser , isStudent , getsubjectlist);
router.route("/getnotes").get(validateUser , isStudent , getnotes);
router.route("/getmysubmissions").get(validateUser , isStudent , getmysubmissions);
router.route("/submitnote").post(validateUser , isStudent , uploadPages , submitnote);
router.route("/reactnote").post(validateUser , isStudent , reactnote);

router.route("/viewnote").post(validateUser , isStudent , viewnote);
router.route("/getrecent").get(validateUser , isStudent , getrecent);
router.route("/clearrecent").post(validateUser , isStudent , clearrecent);

export default router;
