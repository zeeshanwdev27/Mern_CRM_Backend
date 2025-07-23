import express from 'express'
import {addInvoice, getInvoices, deleteInvoice, markAsPaid, getInvoiceForPrinting} from "../controllers/invoiceController.js"
import {protect, projectManager, adminManagerProjectManager} from "../middlewares/authMiddleware.js"

const router = express.Router();


router.use(protect);


router.get('/', adminManagerProjectManager, getInvoices)


router.post('/create', projectManager, addInvoice)

router.delete('/:id', projectManager, deleteInvoice)

router.patch('/:id', projectManager, markAsPaid)

router.get('/:id/print', projectManager, getInvoiceForPrinting)


export default router;