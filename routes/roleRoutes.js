import express from 'express';
import { getRoles, deleteRole, createRole, updateRole, getRoleById } from '../controllers/roleController.js';
import { protect, admin, adminOrManager } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect)


router.get('/', adminOrManager, getRoles);
router.get('/:id', adminOrManager, getRoleById);
router.delete('/:id', adminOrManager, deleteRole);
router.post('/', adminOrManager, createRole);
router.put("/:id", adminOrManager, updateRole)

export default router;