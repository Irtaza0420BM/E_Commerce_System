const express = require("express")
const { generatereceipts, createItem, updateItem, updateReceipt, read, searchItem, fetchItem, searchCustomer, fetchCustomer } = require("../controllers/inventroyController")
const { identifier } = require("../middlewares/authenticate")
const { isAdmin } = require("../middlewares/isAdmin")
 
const router = express.Router()

router.post('/createitem', identifier, isAdmin,  createItem)
router.patch('/updateitem', identifier, updateItem )
router.get('/read', identifier, isAdmin, read)
router.get('/searchitem', identifier, searchItem)
router.post('/fetchitem', identifier, fetchItem )
router.post('/invoice', identifier, generatereceipts)
router.patch('/updatereceipt', identifier, updateReceipt)
router.post('/searchcustomer', identifier, searchCustomer)
router.post('/fetchcustomer', identifier, fetchCustomer)

module.exports=router

























// router.post('/updateitem', inventoryController.updateItem)
// router.post('/generatereceipt' , inventoryController.generatereceipts)
// router.post('/editreceipt' , inventoryController.updates)
// router.post('/searchitem' , inventoryController.searchItem)
// router.post('/fetchitem', inventoryController.fetchItem)

// router.post('/searchcustomer', inventoryController.searchCustomer)
// router.post('/fetchcustomer', inventoryController.fetchCustomer )
