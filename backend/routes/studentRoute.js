import express from "express";
import { validateUser, isStudent } from "../middlewares/validator.js";
import { respondcr } from "../controllers/UserController.js";

const router = express.Router();

// mounted at /student
router.route("/respondcr").post(validateUser , isStudent , respondcr);

export default router;
