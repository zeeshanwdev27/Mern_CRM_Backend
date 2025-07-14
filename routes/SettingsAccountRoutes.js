import express from "express";
import {getAdminData, updateAdminAccount} from "../controllers/SettingsAccountController.js"
import { protect, admin } from '../middlewares/authMiddleware.js'

const router = express.Router()


router.get('/', protect, admin, getAdminData)
router.put('/update', protect, admin, updateAdminAccount)


export default router