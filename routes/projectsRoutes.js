import express from 'express';
import {  getProjects, createProject, deleteProject, updateProject } from "../controllers/projectsController.js"
import { protect, adminOrManager } from "../middlewares/authMiddleware.js"


const router = express.Router();

router.use(protect);

router.get("/getprojects", adminOrManager, getProjects)
router.post("/addproject", createProject)
router.delete("/:id", deleteProject)
router.put('/:id', updateProject)

export default router;