import express from 'express'
import {addInvoice, getInvoices, deleteInvoice, markAsPaid, getInvoiceForPrinting} from "../controllers/invoiceController.js"
import {protect, adminOrManager} from "../middlewares/authMiddleware.js"

const router = express.Router();


router.use(protect);


router.get('/', adminOrManager, getInvoices)


router.post('/create', addInvoice)

router.delete('/:id', deleteInvoice)

router.patch('/:id', markAsPaid)

router.get('/:id/print', getInvoiceForPrinting)


export default router;