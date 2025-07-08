import express from 'express'
import {addInvoice, getInvoices, deleteInvoice, markAsPaid, getInvoiceForPrinting} from "../controllers/invoiceController.js"


const router = express.Router();


router.post('/create', addInvoice)

router.get('/', getInvoices)

router.delete('/:id', deleteInvoice)

router.patch('/:id', markAsPaid)

router.get('/:id/print', getInvoiceForPrinting)


export default router;