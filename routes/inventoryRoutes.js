const express = require("express")
const { generatereceipts, createItem } = require("../controllers/inventroyController")
 
const router = express.Router()

router.post('/createitem', createItem)
router.post('/invoice', generatereceipts)





module.exports=router

























// router.post('/updateitem', inventoryController.updateItem)
// router.post('/generatereceipt' , inventoryController.generatereceipts)
// router.post('/editreceipt' , inventoryController.updates)
// router.post('/searchitem' , inventoryController.searchItem)
// router.post('/fetchitem', inventoryController.fetchItem)

// router.post('/searchcustomer', inventoryController.searchCustomer)
// router.post('/fetchcustomer', inventoryController.fetchCustomer )
