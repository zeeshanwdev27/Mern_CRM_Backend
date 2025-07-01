import express from 'express';
import {  getProjects, createProject, deleteProject, updateProject } from "../controllers/projectsController.js"

const router = express.Router();


router.get("/getprojects", getProjects)
router.post("/addproject", createProject)
router.delete("/:id", deleteProject)
router.put('/:id', updateProject)

export default router;