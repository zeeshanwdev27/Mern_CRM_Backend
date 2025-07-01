import express from 'express';
import { getRoles, deleteRole, createRole, updateRole, getRoleById } from '../controllers/roleController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, admin, getRoles);
router.get('/:id', protect, admin, getRoleById);
router.delete('/:id', protect, admin, deleteRole);
router.post('/', protect, admin, createRole);
router.put("/:id", protect, admin, updateRole)

export default router;