import express from "express";
import { validateUser } from "../middlewares/validator.js";
import { login, logout, getme, changepassword } from "../controllers/UserController.js";

const router = express.Router();

router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/getme").get(validateUser , getme);
router.route("/changepassword").post(validateUser , changepassword);

export default router;
