import express from "express";
import {getAdminData, updateAdminAccount} from "../controllers/SettingsAccountController.js"
import { protect, admin } from '../middlewares/authMiddleware.js'

const router = express.Router()
router.use(protect)

router.get('/', admin , getAdminData)
router.put('/update', admin, updateAdminAccount)


export default router