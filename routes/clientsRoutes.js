import express from "express";
import {getSingleContact} from "../controllers/contactsController.js"
import {createClient, getClients, deleteClient, getSingleClient, updateClient} from "../controllers/clientsController.js"
import { protect, sales } from '../middlewares/authMiddleware.js';


const router = express.Router();
router.use(protect)

router.get("/add/:id",  sales, getSingleContact );
router.get("/getclients", sales,  getClients );
router.post("/add", sales,  createClient)
router.delete("/deleteclient/:id", sales,  deleteClient)
router.get('/:id', sales,  getSingleClient)
router.put('/:id', sales,  updateClient)

export default router;
