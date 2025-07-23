import express from 'express';
import {  getProjects, createProject, deleteProject, updateProject } from "../controllers/projectsController.js"
import { protect, projectManager, adminManagerProjectManager } from "../middlewares/authMiddleware.js"


const router = express.Router();

router.use(protect);

router.get("/getprojects", adminManagerProjectManager, getProjects)
router.delete("/:id", projectManager, deleteProject)
router.post("/addproject", projectManager, createProject)
router.put('/:id', projectManager, updateProject)


export default router;