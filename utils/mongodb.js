
const mongoURI = process.env.MONGO_URI
const mongoose = require("mongoose")

    mongoose.connect(mongoURI)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));
