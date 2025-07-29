import express from 'express'
import asyncHandler from "express-async-handler"
import { protect, adminOrManager, adminManagerProjectManager, adminManagerDeveloper} from '../middlewares/authMiddleware.js'
import {addUser, allUsers, deleteUser, updateUser, getUserById , getuserwithProject } from '../controllers/userController.js'


const router = express.Router()
router.use(protect)

router.post('/adduser', adminOrManager, asyncHandler(addUser))
router.get("/allusers", adminManagerProjectManager, asyncHandler(allUsers))
router.delete("/:id", adminOrManager, asyncHandler(deleteUser))
router.put("/:id", adminOrManager, asyncHandler(updateUser))
router.get("/:id",  adminOrManager, asyncHandler(getUserById));

router.get("/user/:id", adminManagerDeveloper, asyncHandler(getuserwithProject))

export default router