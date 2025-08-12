import express from 'express';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  assignUser,
  unassignUser,
  updateStatus,
  downloadFile,
  upload
} from '../controllers/tasksController.js';
import { protect, projectManager, admin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Task collection routes
router.route('/')
  .post(projectManager, upload.array('files'), createTask)
  .get(getTasks);

// Single task routes
router.route('/:id')
  .get(getTask)
  .put(projectManager, updateTask)
  .delete(projectManager, deleteTask);

// File download route
router.route('/:id/files/:fileId')
  .get(downloadFile);

// Task assignment routes
router.route('/:id/assign')
  .patch(projectManager, assignUser);

router.route('/:id/unassign')
  .patch(projectManager, unassignUser);

// Task status route
router.route('/:id/status')
  .patch(updateStatus);

export default router;