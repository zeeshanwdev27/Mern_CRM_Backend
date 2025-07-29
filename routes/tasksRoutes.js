import express from 'express';
import asyncHandler from 'express-async-handler';
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  assignUser,
  unassignUser,
  updateStatus
} from '../controllers/tasksController.js';
import {protect, adminManagerProjectManager, projectManager, developer} from "../middlewares/authMiddleware.js"

const router = express.Router();

router.use(protect);


router.route('/')
  .post( projectManager, asyncHandler(createTask))
  .get( adminManagerProjectManager, asyncHandler(getTasks));

router.route('/:id')
  .put( projectManager, asyncHandler(updateTask))
  .delete(projectManager, asyncHandler(deleteTask));

router.route('/:id/assign')
  .patch(projectManager, asyncHandler(assignUser));

router.route('/:id/unassign')
  .patch(projectManager, asyncHandler(unassignUser));

router.route('/:id/status')
  .patch(developer, asyncHandler(updateStatus));

export default router;