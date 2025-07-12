import express from "express";
import {getName, updateName, createName} from "../controllers/companyController.js"


const router = express.Router()


router.get('/', getName)
router.put('/:id', updateName)
router.post('/', createName)

export default router