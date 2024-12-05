const express = require("express")
const authController = require('../controllers/authController')
const { identifier } = require("../middlewares/authenticate")
const router = express.Router()

router.get('/', async(req,res) => {
    res.json({message:"auth is working"})
})
router.post('/signup' , authController.register)  //All debugged, checked, tested, Done.
router.post('/login' , authController.signin) //All debugged, checked, tested, Done.
router.post('/signout',  authController.signout) //This is working, checked, tested, debugged, Done.

// router.patch('/changepassword', authController.changePassword)


// router.patch('/send-FPcode', authController.sendForgotPassword);
// router.patch('/verify-FPcode', authController.verifyForgetPasswordCode);


// router.patch('/send-verification-code', authController.sendVerificationCode);
// router.patch('/verify-verification-code', authController.verifyVerificationCode);


module.exports = router;
