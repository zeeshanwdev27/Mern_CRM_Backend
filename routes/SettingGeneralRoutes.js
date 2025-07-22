import express from "express";
import {getName, updateName, createName} from "../controllers/SettingGeneralController.js"
import {protect, adminOrManager, admin} from "../middlewares/authMiddleware.js"

const router = express.Router()


router.get('/', getName)
router.put('/:id', protect, admin, updateName)
router.post('/', protect, admin, createName)

export default router