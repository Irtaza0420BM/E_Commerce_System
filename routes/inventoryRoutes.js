const express = require("express")
const { createItem, updateItem, searchItem, fetchItem, showItems } = require("../controllers/inventroyController")
const { identifier } = require("../middlewares/authenticate")
const { isAdmin } = require("../middlewares/isAdmin")
const { oneinvoiceid, oneinvoicepdf, allreceipts, fetchfivereceipts, generatereceipts, updateReceipt, searchCustomer, fetchCustomer } = require("../controllers/receiptsController")
 
const router = express.Router()

router.get('/', async(req,res) => {
    res.json({message:"inventory is working"})
})

router.get('/invoiceid/:id', oneinvoiceid)
router.get('/invoicepdf/:id', oneinvoicepdf)
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
