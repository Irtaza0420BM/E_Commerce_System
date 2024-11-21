const express = require("express")
const authController = require('../controllers/authController')
const inventoryController = require("../controllers/inventroyController")
const { identifier } = require("../middlewares/authenticate")
const router = express.Router()

router.post('/signup' , authController.register)  //All debugged, checked, tested, Done.
router.post('/verify', authController.verifyEmployee ) //All debugged, checked, tested, Done.
router.post('/login' , authController.signin) //All debugged, checked, tested, Done.
//For Admin Routes: 
router.post('/check' , identifier ,authController.islogin)
router.post('/createitem', inventoryController.createItem)
router.post('/updateitem', inventoryController.updateItem)

router.post('/generatereceipt' , inventoryController.generatereceipts)
router.post('/editreceipt' , inventoryController.updates)
router.post('/searchitem' , inventoryController.searchItem)
router.post('/fetchitem', inventoryController.fetchItem)
router.post('/readitem', inventoryController.read)
router.post('/searchcustomer', inventoryController.searchCustomer)
router.post('/fetchcustomer', inventoryController.fetchCustomer )


//admin routes:


// router.post('/signout' , identifier, authController.signout)
// router.patch('/send-verification-code', identifier, authController.sendVerificationCode);
// router.patch('/verify-verification-code',identifier, authController.verifyVerificationCode);

// router.patch('/changepassword', authController.changePassword)
// router.patch('/send-FPcode', authController.sendForgotPassword);
// router.patch('/verify-FPcode', authController.verifyForgetPasswordCode);



module.exports = router;