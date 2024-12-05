const {Item} = require('../models/items.js')
const {ItemsHistory} = require("../models/itemsHistory.js");
const {Invoice} = require('../models/invoices.js')
const {Employee} = require("../models/employees.js")
const { receiptpdf } = require('../middlewares/invoice.js');
const fs = require('fs');
const path = require('path');


exports.generatereceipts = async (req, res) => {
    const userId = req.user.userId;
    const { customername, items, total, percentdiscount = 0 } = req.body;
    
    if (!customername || !items || !Array.isArray(items) || items.length === 0 || !total) {
      return res.status(400).json({
        success: false,
        message: `${customername}, ${items}, ${total}`,
      });
    }
  
    try {
      let calculatedTotal = 0;
      const historyRecords = [];
  
      // Process each item
      for (let item of items) {
        const { name, quantity, totalAmount } = item;
        const price = totalAmount;
        if (!name || !quantity || quantity <= 0 || !price) {
          return res.status(400).json({
            success: false,
            message: `Invalid data for item: ${name}`,
          });
        }
  
        const dbItem = await Item.findOne({ name });
        if (!dbItem) {
          return res.status(404).json({
            success: false,
            message: `Item not found: ${name}`,
          });
        }
  
        if (dbItem.quantity < quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for item: ${name}`,
          });
        }
  
        let newstock = "Available";
        if (dbItem.quantity - quantity === 0) {
          newstock = "empty";
        } else if (dbItem.quantity - quantity < dbItem.required_quantity) {
          newstock = "checking";
        }
  
        const expectedTotalPrice = quantity * dbItem.selling_price_per_unit;
  
        if (expectedTotalPrice !== price) {
          return res.status(400).json({
            success: false,
            message: `Price mismatch for item: ${name}. Expected: ${expectedTotalPrice}, Received: ${price}`,
          });
        }
  
        // Update item stock and history records
        await Item.updateOne(
          { _id: dbItem._id },
          { $inc: { quantity: -quantity }, $set: { stock: newstock } }
        );
  
        calculatedTotal += expectedTotalPrice;
  
        historyRecords.push({
          employee: userId,
          item: dbItem._id,
          action: 'Sale',
          deltaQuantity: -quantity,
          currentQuantity: dbItem.quantity - quantity,
          purchasePricePerUnit: dbItem.buying_price_per_unit,
          sellingPricePerUnit: dbItem.selling_price_per_unit,
          discountPercent: percentdiscount,
          totalPrice: expectedTotalPrice,
        });
      }
  
      console.log(calculatedTotal)
      const discount = (percentdiscount / 100) * total;
      calculatedTotal = calculatedTotal - discount;
  
      // if (calculatedTotal !== total) {
      //   return res.status(400).json({
      //     success: false,
      //     message: `Total price mismatch. Expected: ${calculatedTotal}, Received: ${total}`,
      //   });
      // }
  
      // Create invoice
      const itemswithprice = items.map(item => {
        const { totalAmount, ...rest } = item; // Destructure to remove `totalamount`
        return { ...rest, price: totalAmount }; // Add `price` with the same value
      });
      
  
      const invoice = await Invoice.create({
        createdBy: userId,
        customername,
        items: itemswithprice,
        percentdiscount: items[0].percentdiscount,
        total: calculatedTotal,
      });
      
      await ItemsHistory.insertMany(historyRecords);
  
      // Generate PDF asynchronously
      const name = await Employee.findOne({ _id: userId });
      const pdfBuffer = await receiptpdf(name.name, invoice);  // Wait for the PDF buffer
  
      // Save the PDF locally
      const filePath = path.join(__dirname, 'generated_pdfs', `invoice_${invoice._id}.pdf`);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, pdfBuffer);  // Write the PDF buffer to file
  
      console.log(`PDF saved successfully at ${filePath}`);
       res.status(200).json({success: true, message: "PDF has been generated."})
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while generating the invoice.",
      });
    }
  };
  
exports.fetchfivereceipts = async(req, res) => {
    try {
      // Fetch receipts from the database
      const receipts = await Invoice.find()
          .select({ createdAt: 1, _id: 1, total: 1 })
          .sort({ createdAt: -1 })
          .limit(5)
          .exec();
  
  
      // Format the `createdAt` field in the receipts
      const formattedReceipts = receipts.map(receipt => ({
          ...receipt._doc,
          createdAt: new Intl.DateTimeFormat('en-US', {
              year: 'numeric',
              month: 'long',
              day: '2-digit'
          }).format(new Date(receipt.createdAt))
      }));
  
      res.status(200).json({
          success: true,
          message: "Invoices generated successfully",
          receipts: formattedReceipts
      });
  } catch (error) {
      // Handle any errors
      res.status(500).json({
          success: false,
          message: "Failed to fetch invoices",
          error: error.message
      });
  }
  
  }
  
exports.allreceipts = async (req,res) => {
    try{
      const receipts = await Invoice.find().select({createdAt: 1, _id: 1, total:1}).sort({createdAt: -1})
      const formattedReceipts = receipts.map(receipt =>({
        ...receipt._doc,
        createdAt: new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: '2-digit'
        }).format(new Date(receipt.createdAt))
      }))
      res.status(200).json({success: true, message: "result", formattedReceipts})
    }
   
    catch(error)
    {
      res.status(500).json({success: false, message: "Unable to get to database at the moment."})
    }
  }
  
exports.oneinvoicepdf = async(req,res) => {
    const invoiceId = req.params.id; // Access the id from the URL path
    //I will do upload PDF, here.
    try {
        const invoice = await Invoice.findById(invoiceId);
        
        if (!invoice) {
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }
  
        res.status(200).json({ success: true, invoice });
      }
    catch(error)
    {
      res.status(500).json({success: false, message:" This is Internal Server," , error})
    }
  }
  
exports.oneinvoiceid= async(req,res) => {
    try{
      const invoiceId = req.params.id
      const invoice = await Invoice.findById(invoiceId).select({items: 1, percentdiscount:1 , total:1, _id: 0 })
      res.status(200).json({success: true, message:"Invoice" , invoice})
    }
    catch (error)
    {
      res.status(500).json({success: false, message: "No req.params.id received, or id is wrong, plz make it right."})
    }
  }
  //Since its Update Route it is best practice to make it a patch route.  
  
exports.searchCustomer = async (req, res) => {
    try {
      const { customername } = req.body; // Name typed by the user
      const results = await Invoice.find(
        { customername: { $regex: customername, $options: 'i' } }, // Case-insensitive search
        'customername' // Only return the 'name' field
      )
      res.status(200).json(results);
    } catch (error) {
      res.status(500).json({ message: 'Error searching for customer', error });
    }
  };
  
exports.fetchCustomer = async (req, res) => {
    const { customername } = req.body; 
    try {
      const details = await Invoice.find(
        { customername },
        'customername createdBy createdAt items total' 
      );
  
      if (!details) {
        return res.status(404).json({ message: 'Customer not found' });
      }
  
      res.status(200).json(details);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching customer details', error });
    }
  };
exports.updateReceipt = async (req, res) => {
    const createdBy = req.user.userId
    const { oldinvoice_id, customername, items, total , percentdiscount =0 } = req.body;
  
    if (!oldinvoice_id || !createdBy || !customername || !items || !Array.isArray(items) || items.length === 0 || !total) {
      return res.status(400).json({
        success: false,
        message: "Invalid input. Please provide all required fields.",
      });
    }
  
    try {
      // Fetch the old invoice
      const oldinvoice = await Invoice.findById(oldinvoice_id);
      if (!oldinvoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice ID is either wrong or does not exist.",
        });
      }
  
      const historyRecords = [];
      const restoreOperations = oldinvoice.items.map((olditem) => ({
        updateOne: {
          filter: { name: olditem.name },
          update: { $inc: { quantity: olditem.quantity } },
        },
      }));
  
      // Perform bulkWrite for restoring old item quantities
      const restoreResult = await Item.bulkWrite(restoreOperations);
  
      const restoreHistoryPromises = oldinvoice.items.map(async (olditem) => {
        const dbItem = await Item.findOne({ name: olditem.name });
        if (!dbItem) {
          throw new Error(`Item not found: ${olditem.name}`);
        }
  
        historyRecords.push({
          employee: oldinvoice.createdBy,
          item: dbItem._id,
          action: "Returned",
          deltaQuantity: olditem.quantity,
          currentQuantity: dbItem.quantity,
          purchasePricePerUnit: dbItem.buying_price_per_unit,
          sellingPricePerUnit: dbItem.selling_price_per_unit,
          discountPercent: 0,
          totalPrice: 0,
        });
      });
  
      await Promise.all(restoreHistoryPromises);
  
      // Create a new version of the invoice
      oldinvoice.versions.push({
        __v: oldinvoice.__v,
        createdBy: oldinvoice.createdBy,
        createdAt: oldinvoice.createdAt,
        items: oldinvoice.items,
        total: oldinvoice.total,
      });
  
      // Processing new items and calculating totals
      let calculatedTotal = 0;
      const newOperations = [];
  
      const saleHistoryPromises = items.map(async (item) => {
        const { name, quantity } = item;
        const price = item.totalAmount
        if (!name || !quantity || quantity <= 0 || !price) {
          throw new Error(`Invalid data for item: ${name}`);
        }
  
        const dbItem = await Item.findOne({ name });
        if (!dbItem) {
          throw new Error(`Item not found: ${name}`);
        }
  
        if (dbItem.quantity < quantity) {
          throw new Error(`Insufficient stock for item: ${name}`);
        }
  
        let stock = "Available";
        if (dbItem.quantity - quantity === 0) {
          stock = "empty";
        } else if (dbItem.quantity - quantity < dbItem.required_quantity) {
          stock = "Low stock needs shelving";
        }
  
        const expectedTotalPrice = dbItem.selling_price_per_unit * quantity;
        if (expectedTotalPrice !== price) {
          throw new Error(`Price mismatch for item: ${name}. Expected: ${expectedTotalPrice}, Received: ${price}`);
        }
  
        calculatedTotal += expectedTotalPrice;
  
        // Prepare bulkWrite operation for sale
        newOperations.push({
          updateOne: {
            filter: { name: name },
            update: { $inc: { quantity: -quantity }, $set: { stock } },
          },
        });
  
        historyRecords.push({
          employee: createdBy,
          item: dbItem._id,
          action: "Sale",
          deltaQuantity: -quantity,
          currentQuantity: dbItem.quantity - quantity,
          purchasePricePerUnit: dbItem.buying_price_per_unit,
          sellingPricePerUnit: dbItem.selling_price_per_unit,
          discountPercent: 0,
          totalPrice: expectedTotalPrice,
        });
      });
  
      await Promise.all(saleHistoryPromises);
  
      // Perform bulkWrite for new items
      const saleResult = await Item.bulkWrite(newOperations);
  
      // Check total price
      if (calculatedTotal !== total) {
        return res.status(400).json({
          success: false,
          message: `Total price mismatch. Expected: ${calculatedTotal}, Received: ${total}`,
        });
      }
  
      const itemswithprice = items.map(item => {
        const { totalAmount, ...rest } = item; // Destructure to remove `totalamount`
        return { ...rest, price: totalAmount }; // Add `price` with the same value
      });
      
      
      oldinvoice.set({ createdBy, customername, items: itemswithprice, total });
      await oldinvoice.save();
  
      // Save all history records
      await ItemsHistory.insertMany(historyRecords);
  
      console.timeEnd("Runtime");
  
      return res.status(200).json({
        success: true,
        message: "Invoice updated successfully.",
        invoice: oldinvoice,
        restoreResult,
        saleResult,
      });
    } catch (error) {
      console.error("Error during invoice update:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "An error occurred while updating the invoice.",
      });
    }
  };
  
  