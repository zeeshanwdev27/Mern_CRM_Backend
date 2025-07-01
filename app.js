import 'dotenv/config';
import express from 'express';
import connectDb from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from "./routes/userRoutes.js"
import roleRoutes from './routes/roleRoutes.js';  // Add this
import departmentRoutes from './routes/departmentRoutes.js';  // Add this
import contactsRoutes from "./routes/contactsRoutes.js"
import clientsRoutes from "./routes/clientsRoutes.js"
import projectsRoutes from "./routes/projectsRoutes.js"

import cors from 'cors'
import './models/index.js';

const app = express();
connectDb();

app.use(express.json()); 
app.use(cors())


app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use('/api/roles', roleRoutes);  // Add this
app.use('/api/departments', departmentRoutes);  // Add this
app.use("/api/contacts", contactsRoutes)
app.use("/api/clients", clientsRoutes)
app.use("/api/projects", projectsRoutes)


app.get("/", (req, res) => res.send("Hello World"));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
