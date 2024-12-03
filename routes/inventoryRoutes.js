const express = require("express")
const { generatereceipts, createItem, updateItem, updateReceipt, read, searchItem, fetchItem, searchCustomer, fetchCustomer, showItems, fetchfivereceipts, allreceipts, oneinvoice } = require("../controllers/inventroyController")
const { identifier } = require("../middlewares/authenticate")
const { isAdmin } = require("../middlewares/isAdmin")
 
const router = express.Router()

router.get('/', async(req,res) => {
    res.json({message:"inventory is working"})
})

router.get('/invoice/:id', oneinvoice)
router.get('/allinvoice', allreceipts)
router.get('/fiveinvoice', fetchfivereceipts)
router.get('/read', showItems)
router.post('/createitem',  createItem)
router.patch('/updateitem', identifier, updateItem )
// router.get('/read', identifier, isAdmin, read)
router.post('/searchitem', identifier, searchItem)
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
