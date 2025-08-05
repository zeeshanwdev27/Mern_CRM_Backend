import express from 'express';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  assignUser,
  unassignUser,
  updateStatus
} from '../controllers/tasksController.js';
import { protect, projectManager, admin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Task collection routes
router.route('/')
  .post(projectManager, createTask)  // Only project managers can create tasks
  .get(getTasks);  // All authenticated users can view tasks (with filters)

// Single task routes
router.route('/:id')
  .get(getTask)  // Accessible to assigned users and managers
  .put(projectManager, updateTask)  // Only project managers can fully update
  .delete(projectManager, deleteTask);  // Only project managers can delete

// Task assignment routes
router.route('/:id/assign')
  .patch(projectManager, assignUser);  // Only project managers can assign

router.route('/:id/unassign')
  .patch(projectManager, unassignUser);  // Only project managers can unassign

// Task status route
router.route('/:id/status')
  .patch(updateStatus);  // Accessible to assigned users and managers

export default router;