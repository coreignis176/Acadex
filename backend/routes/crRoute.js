import express from "express";
import { validateUser, isCr } from "../middlewares/validator.js";
import { getsectionnotes, reviewnote, deletenote, getcrstats } from "../controllers/crController.js";

const router = express.Router();

// mounted at /cr  -> every route: logged in + active CR
router.route("/getsectionnotes").get(validateUser , isCr , getsectionnotes);
router.route("/reviewnote").post(validateUser , isCr , reviewnote);
router.route("/deletenote/:id").delete(validateUser , isCr , deletenote);
router.route("/getcrstats").get(validateUser , isCr , getcrstats);

export default router;
