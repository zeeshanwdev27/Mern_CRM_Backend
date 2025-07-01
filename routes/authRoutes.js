import express from "express";

import {signInController} from "../controllers/authController.js"


const router = express.Router();

router.post("/signin", signInController );

export default router;
