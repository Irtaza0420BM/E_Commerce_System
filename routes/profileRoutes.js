const express = require("express")
const { profile } = require("../controllers/profileController");
const { identifier } = require("../middlewares/authenticate");

const router = express.Router()

router.get('/profile', identifier, profile)

module.exports = router;