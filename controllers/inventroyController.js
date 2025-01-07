const {Item} = require('../models/items.js')
const {ItemsHistory} = require("../models/itemsHistory.js");
const {createSchema} = require('../middlewares/validator.js');


exports.createItem =  async(req, res) =>
{
  const userId = req.user.userId
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
            stock = "Low"
        }
        const item= new Item({name, quantity, stock, required_quantity, buying_price_per_unit, selling_price_per_unit});
        const result = await item.save();
    
        await ItemsHistory.create({
          employee: userId,
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
    const result= await Item.aggregate([      {
      $addFields: {
        stock: {
          $cond: {
            if: { $gte: ["$quantity", "$required_quantity"] },
            then: "Available",
            else: "Not Available",
          },
        },
      },
    },
    // 2) Group by the new `stock` field
    {
      $group: {
        _id: "$stock",
        total_items: { $sum: 1 },
        items: {
          $push: {
            name: "$name",
            item: "$item",
            quantity: "$quantity",
            required_quantity: "$required_quantity",
          },
        },
      },
    },
  ]);
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

exports.updateItem = async (req, res) => {
  const userId = req.user.userId
  const { updateData } = req.body;
  console.log(updateData)

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
        stock = "Low";
      }

      dbItem.quantity += quantity;
      dbItem.stock = stock;
      dbItem.buying_price_per_unit = buying_price_per_unit;
      dbItem.selling_price_per_unit = sellingPricePerUnit;

      await dbItem.save();

      // Log the update in the history
      await ItemsHistory.create({
        employee: userId,
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
