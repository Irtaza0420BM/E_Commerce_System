const express = require("express")
require('dotenv').config();
const helmet = require("helmet")
const mongoose = require("mongoose")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const authRouter = require("./routes/authRoutes")
const adminRouter = require("./routes/adminRoutes")
const inventoryRouter = require("./routes/inventoryRoutes");
const profileRouter = require("./routes/profileRoutes")
const app = express()

const corsOptions = {
    origin: ['http://localhost:5173',
        "https://management-system-dun.vercel.app"], 
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};

app.use(cors(corsOptions));


app.use(helmet())
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const mongoURI = process.env.MONGO_URI

mongoose.connect(mongoURI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));

app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/inventory', inventoryRouter)
app.use('/api/profile', profileRouter)

app.get('/checking' , (req,res) => {
    res.json({message:"I am deployed"})
})

app.get('/' , (req,res) => {      
    console.log(process.env.NODE_ENV)
    res.json({message:"Bie from the server." , mongoURI})
})

app.listen(process.env.PORT, ()=> {
    console.log(`Server is running on ${process.env.PORT}`)
})