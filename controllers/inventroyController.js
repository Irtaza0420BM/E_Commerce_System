const mongoose = require('mongoose');
const {Item} = require('../models/items.js')
const {ItemsHistory} = require("../models/itemsHistory.js");
const {Invoice} = require('../models/invoices.js')
const {Employee} = require("../models/employees.js")
const {createSchema} = require('../middlewares/validator.js');
const { receiptpdf } = require('../middlewares/invoice.js');
const fs = require('fs');
const path = require('path');

exports.createItem =  async(req, res) =>
{
  // const userId = req.user.userId
  const userId = "673f2b8f8d76aa030fa4ed41"
  // console.log(userId)
    try {
      
      const {name, quantity, required_quantity, buying_price_per_unit, selling_price_per_unit} = req.body;
      const{error} = createSchema.validate({name, quantity, required_quantity, buying_price_per_unit, selling_price_per_unit})
        if(error)
        {
            return res.status(400).json({message: error.details[0].message})
        }
        
        let stock = "Available";
        if (quantity==0) {
            stock = "empty";
        } 
        else if(quantity < required_quantity ) {
            stock = "Low stock needs shelving"
        }
        const item= new Item({name, quantity, stock, required_quantity, buying_price_per_unit, selling_price_per_unit});
        const result = await item.save();
        
        await ItemsHistory.create({
          employee: userId._id,
          action: 'Created',
          item: result._id,
          deltaQuantity: quantity,
          currentQuantity: quantity,
          purchasePricePerUnit: buying_price_per_unit,
          sellingPricePerUnit: selling_price_per_unit,
          totalPrice: buying_price_per_unit*quantity,
        })

      return res.status(200).json({sucess: true, message: "Item saves successful ", result: result})
    } catch (error) {
      return res.status(500).json({success: false, message: error})
    }
}
exports.showItems= async(req, res) => {
  try {
    const result= await Item.aggregate([
      {
        $addFields: {
          // Calculate the ratio of available quantity to required quantity
          ratio: { $divide: ["$quantity", "$required_quantity"] },
        }
      },
      {
        $addFields: {
          // Calculate the ratio of available quantity to required quantity
          ratio: { $divide: ["$quantity", "$required_quantity"] },
        }
      },
      {
        $addFields: {
          // Calculate the sold percentage based on different conditions
          sold_percentage: {
            $cond: {
              if: { $eq: ["$ratio", 0] }, // If quantity is 0, sold percentage is 100%
              then: 100,
              else: 
                { $multiply :[
                  {$divide: [1, "$ratio"]}, 100] }
            }
          }
        }
      }
    ]
    );
    res.status(200).json({success: true , result});
  } catch (error) {
    res.status(400).json({success: false , message : "Somehow we are unable to get Items Data."})
  }
};


exports.read =  async(req, res) =>
{
    const {name} = req.body;
    if (name ?? false) {
        existing_item = await Item.findOne({ name });
    } else {
        existing_item = await Item.find();
    }

    if (!existing_item || (Array.isArray(existing_item) && existing_item.length === 0)) {
        res.status(400).json({success: false, message: "Item doesn't exist."})
    } else {
        res.status(200).json({success: true, message: existing_item })
    }

}


exports.searchItem = async (req, res) => {
  try {
    const { name } = req.body; // Name typed by the user
    const results = await Item.find(
      { name: { $regex: name, $options: 'i' } }, 
      'name' 
    )
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error searching for items', error });
  }
};

exports.fetchItem = async (req, res) => {
  try {
    const {name} = req.body
    const item = await Item.findOne(
      { name: { $regex: `^${name}$`, $options: 'i' } }, 
      'name selling_price_per_unit quantity'
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item details', error });
  }
};
// Generate Receipts ?? This function is like head of all functions, father of my database. The working head of this program.
// I will create an Invoice. So it will have details of like customer, Employee, what was sold/bought percent discount, basically all non sensitive info
// another collection will be created named ItemHistory, it tracks all the history for admin. So he can look at inner working of things
// Invoice can be changed, but ItemHistory will be immutable. So it will be like a log of all the transactions. 
exports.generatereceipts = async (req, res) => {
  const userId = req.user.userId;
  console.log(req.body); 
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
      const { name, quantity, price } = item;
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

      const expectedTotalPrice = dbItem.quantity * dbItem.selling_price_per_unit;

      // if (expectedTotalPrice !== price) {
      //   return res.status(400).json({
      //     success: false,
      //     message: `Price mismatch for item: ${name}. Expected: ${expectedTotalPrice}, Received: ${price}`,
      //   });
      // }

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

    // const discount = (percentdiscount / 100) * price;
    // calculatedTotal = calculatedTotal - discount;

    // if (calculatedTotal !== total) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Total price mismatch. Expected: ${calculatedTotal}, Received: ${total}`,
    //   });
    // }

    // Create invoice
    const invoice = await Invoice.create({
      createdBy: userId,
      customername,
      items,
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

//Since its Update Route it is best practice to make it a patch route.
exports.updateItem = async (req, res) => {
  const userId = req.user.userId
  const { updateData } = req.body;

  if (!updateData || !Array.isArray(updateData) || updateData.length === 0) {
    return res.status(400).json({
      success: false,
      message:
        "The updateData is empty. Please send an array of objects with at least name and quantity.",
    });
  }

  try {
   
    const validationErrors = [];
    const itemsToUpdate = []; // Store validated items for bulk update

    for (const item of updateData) {
      const { name, quantity, buying_price_per_unit, sellingPricePerUnit } = item;

      if (!name || !quantity) {
        validationErrors.push(
          `Item with missing fields: ${JSON.stringify(item)}`
        );
        continue;
      }

      const dbItem = await Item.findOne({ name });

      if (!dbItem) {
        validationErrors.push(`Item not found in database: ${name}`);
        continue;
      }

      // Add the validated item and its data to the list for updating
      itemsToUpdate.push({
        dbItem,
        quantity,
        buying_price_per_unit: buying_price_per_unit ?? dbItem.buying_price_per_unit,
        sellingPricePerUnit: sellingPricePerUnit ?? dbItem.selling_price_per_unit,
      });
    }

    // If there are validation errors, stop and respond
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation errors occurred",
        errors: validationErrors,
      });
    }

    // Step 2: Perform updates
    for (const { dbItem, quantity, buying_price_per_unit, sellingPricePerUnit } of itemsToUpdate) {
      let stock = "Available";
      if (dbItem.quantity + quantity < dbItem.required_quantity) {
        stock = "Low stock needs shelving";
      }

      dbItem.quantity += quantity;
      dbItem.stock = stock;
      dbItem.buying_price_per_unit = buying_price_per_unit;
      dbItem.selling_price_per_unit = sellingPricePerUnit;

      await dbItem.save();

      // Log the update in the history
      await ItemsHistory.create({
        employee: userId._id,
        action: "Update",
        item: dbItem._id,
        deltaQuantity: quantity,
        currentQuantity: dbItem.quantity,
        purchasePricePerUnit: buying_price_per_unit,
        sellingPricePerUnit: sellingPricePerUnit,
        totalPrice: buying_price_per_unit * quantity,
      });
    }

    return res.status(200).json({
      success: true,
      message: "All items updated successfully",
    });
  } catch (error) {
    console.error("Error during bulk update or logging:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


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
  const { oldinvoice_id, customername, items, total } = req.body;

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

    // Generate history records for restored items
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
      const { name, quantity, price } = item;
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

    // Save updated invoice
    oldinvoice.set({ createdBy, customername, items, total });
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
