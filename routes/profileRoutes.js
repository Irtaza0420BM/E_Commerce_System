const express = require("express")
const { profile } = require("../controllers/profileController")

const router = express.Router()

router.get('/profile',  profile)

module.exports = router;