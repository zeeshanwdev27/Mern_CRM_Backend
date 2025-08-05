import express from 'express';
import { 
  getProjects, 
  createProject, 
  deleteProject, 
  updateProject, 
  getSpecificProject,
  addTeamMembers,
  removeTeamMember
} from "../controllers/projectsController.js"
import { protect, projectManager, adminManagerProjectManager } from "../middlewares/authMiddleware.js"

const router = express.Router();

router.use(protect);

// Get all projects
router.get("/getprojects", adminManagerProjectManager, getProjects)

// Create new project
router.post("/addproject", projectManager, createProject)

// Project-specific routes
router.route("/:id")
  .get(projectManager, getSpecificProject)
  .put(projectManager, updateProject)
  .delete(projectManager, deleteProject);

// Team management routes
router.post("/:id/team", projectManager, addTeamMembers);
router.delete("/:id/team/:userId", projectManager, removeTeamMember);

export default router;