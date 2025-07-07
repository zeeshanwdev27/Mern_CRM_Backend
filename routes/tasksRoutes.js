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

const router = express.Router();

router.route('/')
  .post(asyncHandler(createTask))
  .get(asyncHandler(getTasks));

router.route('/:id')
  .put(asyncHandler(updateTask))
  .delete(asyncHandler(deleteTask));

router.route('/:id/assign')
  .patch(asyncHandler(assignUser));

router.route('/:id/unassign')
  .patch(asyncHandler(unassignUser));

router.route('/:id/status')
  .patch(asyncHandler(updateStatus));

export default router;