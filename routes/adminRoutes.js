const express = require("express")
const adminController = require("../controllers/adminController")
const { identifier } = require("../middlewares/authenticate")
const router = express.Router()

router.get('/dashboard', adminController.dashboard)
router.get('/employees' , adminController.unverifiedemployees)
router.post('/verify', adminController.verifyEmployee)

// router.post('/createitem',identifier, inventoryController.createItem)
// router.post('/check' , identifier ,authController.islogin)
// router.post('/checkemployee' , identifier, adminController.areemployeesLogin )

module.exports = router