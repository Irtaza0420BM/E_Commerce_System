const express = require("express")
require('dotenv').config();
const helmet = require("helmet")
const cors = require("cors")
const cookieParser = require("cookie-parser")
// const collection =require ("./models/userModel")
const authRouter = require("./routes/authRoutes")
const adminRouter = require("./routes/adminRoutes")
const inventoryRouter = require("./routes/inventoryRoutes")

const app = express()
app.use(cors()) 

app.use(helmet())
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
// app.use('/api/inventory', inventoryRouter)

app.get('/' , (req,res) => {
    res.json({message:"Bie from the server."})
})


app.listen(process.env.PORT, ()=> {
    console.log(`Server is running on ${process.env.PORT}`)
})