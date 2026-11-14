import express from "express";
import { validateUser } from "../middlewares/validator.js";
import { getnotifications, marknotificationsread } from "../controllers/notificationController.js";

const router = express.Router();

// mounted at /notification  -> any logged in user
router.route("/getnotifications").get(validateUser , getnotifications);
router.route("/markread").post(validateUser , marknotificationsread);

export default router;
