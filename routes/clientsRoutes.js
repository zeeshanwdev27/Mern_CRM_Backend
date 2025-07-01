import express from "express";
import {getSingleContact} from "../controllers/contactsController.js"
import {createClient, getClients, deleteClient, getSingleClient, updateClient} from "../controllers/clientsController.js"

const router = express.Router();

router.get("/add/:id", getSingleContact );
router.get("/getclients", getClients );
router.post("/add", createClient)
router.delete("/deleteclient/:id", deleteClient)
router.get('/:id', getSingleClient)
router.put('/:id', updateClient)

export default router;
