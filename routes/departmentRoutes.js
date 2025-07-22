import express from 'express';
import { getDepartments, createDepartment, deleteDepartment  } from '../controllers/departmentController.js';
import { protect, admin, adminOrManager} from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect)


router.get('/', adminOrManager, getDepartments);
router.post('/', adminOrManager, createDepartment);
router.delete('/:id', adminOrManager, deleteDepartment);

export default router;