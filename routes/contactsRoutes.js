import express from "express";
import {getContacts, getSingleContact, createContacts, deleteContacts, updateStar, updateContact} from "../controllers/contactsController.js"
import { protect, sales } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect)


router.get("/getcontacts", sales, getContacts)
router.get("/getcontact/:id", sales, getSingleContact)
router.post("/addcontact", sales, createContacts)
router.delete("/deletecontact/:id",  sales, deleteContacts)
router.patch("/updatestar/:id",  sales, updateStar)
router.put("/:id",  sales, updateContact)


export default router;