const express = require("express")
const adminController = require("../controllers/adminController")
const { identifier } = require("../middlewares/authenticate")
const router = express.Router()

router.get('/', async(req,res) => {
    res.json({message:"admin is working"})
})
router.get('/dashboard', adminController.dashboard)
router.post('/signup' , adminController.adminRegistration)  
router.get('/employees' , adminController.unverifiedemployees)
router.post('/verify', adminController.verifyEmployee)

module.exports = router