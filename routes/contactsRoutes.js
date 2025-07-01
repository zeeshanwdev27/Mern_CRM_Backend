import express from "express";
import {getContacts, getSingleContact, createContacts, deleteContacts, updateStar, updateContact} from "../controllers/contactsController.js"
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();



router.get("/getcontacts", protect,admin, getContacts)
router.get("/getcontact/:id", protect,admin, getSingleContact)
router.post("/addcontact", protect,admin, createContacts)
router.delete("/deletecontact/:id", protect, admin, deleteContacts)
router.patch("/updatestar/:id", protect, admin, updateStar)
router.put("/:id", protect, admin, updateContact)


export default router;