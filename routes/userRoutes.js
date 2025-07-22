import express from 'express'
import asyncHandler from "express-async-handler"
import { protect, admin, adminOrManager } from '../middlewares/authMiddleware.js'
import {addUser, allUsers, deleteUser, updateUser, getUserById  } from '../controllers/userController.js'


const router = express.Router()
router.use(protect)

router.post('/adduser', adminOrManager, asyncHandler(addUser))
router.get("/allusers", adminOrManager, asyncHandler(allUsers))
router.delete("/:id", adminOrManager, asyncHandler(deleteUser))
router.put("/:id", adminOrManager, asyncHandler(updateUser))

router.get("/:id", adminOrManager, asyncHandler(getUserById)); 


export default router