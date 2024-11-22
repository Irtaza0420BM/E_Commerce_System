// I want to create 3 functions One let the user Create his Collection (user) document, Other let the middle man (admin) create a collection, and the third one to let the user delete his collection
// I will use the Mongoose library to interact with MongoDB
const {Item} = require('../models/usermodels.js')
const ItemsHistory = require("../models/itemsHistory.js");
const {Invoice} = require('../models/invoices.js')
const {createSchema, updateSchema, removeSchema} = require('../middlewares/validator.js');
const { exist } = require('joi');

//First Function will be used by Admin only, to create new entries. Will Only Work for admin now.
exports.createItem =  async(req, res) =>
{
  if(req.user.role !== 'admin'){
    return res.status(403).json({message: "You are not admin or there is an issue with your log-in, login again as admin."})
  }
     //(Its not chatgpt its me trying to logs, this one will take three parameters from req.body)
    try {
      const {name, quantity, required_quantity, buying_price_per_unit, selling_price_per_unit} = req.body;
        const{error , value} = createSchema.validate({name, quantity, required_quantity, buying_price_per_unit, selling_price_per_unit})
        console.log(req.body)
        if(error)
        {
            return res.status(400).json({message: error.details[0].message})
        }
        
        let stock = "In stock";
        if (quantity==0) {
            stock = "empty";
        } 
        else if(quantity < required_quantity ) {
            stock = "Low stock needs shelving"
        }
        const item= new Item({name, quantity, required_quantity, buying_price_per_unit, selling_price_per_unit});
        const result = await item.save();
        return res.status(200).json({sucess: true, message: "Item saves successful ", result: result})
    } catch (error) {
      return res.status(500).json({success: false, message: error.errmsg})
    }
}
// What I want my read to do? I want it to check If the user gave any name. if it did , then it will return the collection with the given name. If not, it will return entire collection
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
// I am creating this function to searchForItem in the dataBase it will be called again and again.
// Things I want front end to do: I want the front end to send the name of the item to the backend only when item name is 2 or more, also I want the front-end to have a speed checker Use debouncing on the frontend to limit the frequency of API calls when typing.
//This is to serach for medicine name it should OnLy send medicine name.
exports.searchItem = async (req, res) => {
  console.log("I received a request")
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

//This one is tested it works. No problem at all. 
exports.fetchItem = async (req, res) => {
  try {
    const {name} = req.body
    //const { name } = req.params; // Name of the item clicked
    const item = await Item.findOne(
      { name: { $regex: `^${name}$`, $options: 'i' } }, // Exact match, case-insensitive
      'name selling_price_per_unit quantity' // Select desired fields
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item details', error });
  }
};

// items is an array of objects [{}, {}, {}]
//Making sure Our Stocks changes based on quantity.
exports.generatereceipts = async (req, res) => {
  const { createdBy, customername, items, total, percentdiscount = 0 } = req.body;

  if (!createdBy || !customername || !items || !Array.isArray(items) || items.length === 0 || !total) {
    return res.status(400).json({
      success: false,
      message: "Invalid input. Please provide all required fields.",
    });
  }

  try {
    let calculatedTotal = 0;
    const historyRecords = [];

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

      const expectedTotalPrice = dbItem.selling_price_per_unit * quantity;
      if (expectedTotalPrice !== price) {
        return res.status(400).json({
          success: false,
          message: `Price mismatch for item: ${name}. Expected: ${expectedTotalPrice}, Received: ${price}`,
        });
      }

      await Item.updateOne(
        { _id: dbItem._id },
        { $inc: { quantity: -quantity } }
      );

      const discount = (percentdiscount / 100) * expectedTotalPrice;
      const discountedPrice = expectedTotalPrice - discount;

      calculatedTotal += discountedPrice;

      // Prepare history record for this item
      historyRecords.push({
        itemName: name,
        soldQuantity: quantity,
        purchasePricePerUnit: dbItem.buying_price_per_unit,
        sellingPricePerUnit: dbItem.selling_price_per_unit,
        discountPercent: percentdiscount,
        totalPrice: discountedPrice,
      });
    }

    if (calculatedTotal !== total) {
      return res.status(400).json({
        success: false,
        message: `Total price mismatch. Expected: ${calculatedTotal}, Received: ${total}`,
      });
    }

    // Create Invoice
    const invoice = await Invoice.create({
      createdBy,
      customername,
      items,
      total: calculatedTotal,
    });

    // Log history records
    await ItemsHistory.insertMany(historyRecords);

    return res.status(201).json({
      success: true,
      message: "Invoice generated successfully.",
      invoice,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while generating the invoice.",
    });
  }
};

exports.updateItem = async (req, res) => {
  const {userId} = req.user;
  const {updateData}  = req.body; 
  const session = await mongoose.startSession();  
  try {
    session.startTransaction();
    const bulkOperations = [];
    const updateLogs = [];
//updateData is array of object that we will get from the frontend
    updateData.forEach(item => {
      bulkOperations.push({
        updateOne: {
          filter: { name: item.name },  
          update: { 
            $set: { 
              name: item.name,
              quantity: item.quantity,
              required_quantity: item.required_quantity,
              stock: item.stock,
              buying_price_per_unit: item.buying_price_per_unit,
              selling_price_per_unit: item.selling_price_per_unit
            }
          },
          upsert: false // If you want to create if it doesn't exist, set to true
        }
      });

      updateLogs.push({
        employee: userId,
        item: item.itemId,
        action: 'update',
        updateDetails: item.updateDetails || 'No details provided',
        timestamp: new Date()
      });
    });

    const bulkWriteResult = await Item.bulkWrite(bulkOperations, { session });

    await EmployeeUpdate.insertMany(updateLogs, { session });

    await session.commitTransaction();
    session.endSession();

    console.log('Bulk update and logging complete:', bulkWriteResult);
    return bulkWriteResult;

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error during bulk update or logging:', error);
    throw error;
  }

}

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

exports.updates = async(req, res) => {
  const { oldinvoice_id, createdBy, customername, items, total } = req.body;

  if (!oldinvoice_id || !createdBy || !customername || !items || !Array.isArray(items) || items.length === 0 || !total) {
      return res.status(400).json({
          success: false,
          message: "Invalid input. Please provide all required fields.",
      });
  }

  try {
    const oldinvoice = await Invoice.findById(oldinvoice_id);
    if (!oldinvoice) {
        return res.status(404).json({
            success: false,
            message: "Invoice id is either wrong or does not exist.",
        });
    }

    for (const olditem of oldinvoice.items) {
        const { name, quantity } = olditem;
        await Item.updateOne(
            { name },
            { $inc: { quantity: +quantity } } // Restoring the old stock
        );
    }

    const invoice = oldinvoice; 
    invoice.versions.push({
        __v: invoice.__v,
        createdBy: invoice.createdBy,
        createdAt: invoice.createdAt,
        items: invoice.items,
        total: invoice.total,
    });

    try {
      let calculatedTotal = 0;

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

        const expectedTotalPrice = dbItem.selling_price_per_unit * quantity;
        if (expectedTotalPrice !== price) {
            return res.status(400).json({
                success: false,
                message: `Price mismatch for item: ${name}. Expected: ${expectedTotalPrice}, Received: ${price}`,
            });
        }

        await Item.updateOne(
          { _id: dbItem._id },
          { $inc: { quantity: -quantity } }
        );

        calculatedTotal += expectedTotalPrice;
      }

      if (calculatedTotal !== total) {
        return res.status(400).json({
          success: false,
          message: `Total price mismatch. Expected: ${calculatedTotal}, Received: ${total}`,
        });
      }
//Customer name might need some improvement?

      invoice.set({ createdBy, customername, items, total });

      await invoice.save();

      return res.status(201).json({
        success: true,
        message: "Invoice generated successfully.",
        invoice,
      });
    } 
    catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while generating the invoice.",
      });
    }
    
  }
  catch(error){
      console.error(error);
  }
}

exports.readAllEmmployees =  async(req, res) =>
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

exports.searchEmployee = async (req, res) => {

}



const sellItem = async (req, res) => {
    try {
      const { itemId, quantity } = req.body;
  
      // Fetch the item
      const item = await Item.findById(itemId);
      if (!item) return res.status(404).json({ error: "Item not found" });
  
      // Ensure enough stock is available
      if (item.quantity < quantity) {
        return res.status(400).json({ error: "Not enough stock available" });
      }
  
      // Calculate profit for this sale
      const profit = (item.selling_price_per_unit - item.price_per_unit) * quantity;
  
      // Update item quantity
      item.quantity -= quantity;
      await item.save();
  
      res.status(200).json({
        message: "Item sold successfully",
        profit,
        remainingQuantity: item.quantity
      });
    } catch (error) {
      res.status(500).json({ error: "Error processing sale" });
    }
  };

const calculateTotalProfit = async (req, res) => {
    try {
      const items = await Item.find();
      let totalProfit = 0;
  
      items.forEach(item => {
        const itemProfit = (item.selling_price_per_unit - item.price_per_unit) * (item.initial_stock - item.quantity);
        totalProfit += itemProfit;
      });
  
      res.status(200).json({ totalProfit });
    } catch (error) {
      res.status(500).json({ error: "Error calculating profit" });
    }
  };
  

