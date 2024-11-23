const mongoose = require("mongoose");

const itemsHistorySchema = new mongoose.Schema({ 
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  action:{
    type:String,
    enum: ['Sale', 'Update' , 'Returned', 'Created']
  },
  item: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Item', 
    required: true 
  },
  deltaQuantity: { 
    type: Number, 
    required: true 
  }, // Quantity bought (positive) or sold (negative).
  currentQuantity: { 
    type: Number, 
    required: true 
  }, // Actual amount after the transaction.
  purchasePricePerUnit: { 
    type: Number, 
    required: true 
  }, // Purchase price per unit.
  sellingPricePerUnit: { 
    type: Number, 
    required: true 
  }, // Selling price per unit (before discount).
  discountPercent: { 
    type: Number, 
    default: 0 
  }, // Discount applied.
  totalPrice: { 
    type: Number, 
    required: true 
  }, // Total price after applying the discount.
  transactionDate: { 
    type: Date, 
    default: Date.now 
  }, // Date of the transaction.
});

const ItemsHistory = mongoose.model("ItemsHistory", itemsHistorySchema);

module.exports = {ItemsHistory};


const calculateTotalSales = async () => {
  const totalSalesPipeline = [
    {
      $match: {
        deltaQuantity: { $lt: 0 }, // Only include sales (negative quantities)
      },
    },
    {
      $project: {
        itemName: 1,
        totalSaleAmount: {
          $multiply: [
            { $abs: "$deltaQuantity" }, // Absolute value of quantity sold
            {
              $subtract: [
                "$sellingPricePerUnit",
                { $multiply: ["$sellingPricePerUnit", { $divide: ["$discountPercent", 100] }] }, // Discounted price
              ],
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: null, // Group all sales together
        totalSales: { $sum: "$totalSaleAmount" }, // Sum up all sales
      },
    },
    {
      $project: {
        _id: 0,
        totalSales: 1,
      },
    },
  ];

  const result = await ItemsHistory.aggregate(totalSalesPipeline);
  return result.length > 0 ? result[0].totalSales : 0;
};
const calculateTotalPurchases = async () => {
  const totalPurchasesPipeline = [
    {
      $match: {
        deltaQuantity: { $gt: 0 }, // Only include purchases (positive quantities)
      },
    },
    {
      $project: {
        itemName: 1,
        totalPurchaseAmount: {
          $multiply: ["$deltaQuantity", "$purchasePricePerUnit"], // Quantity * Purchase Price
        },
      },
    },
    {
      $group: {
        _id: null, // Group all purchases together
        totalPurchases: { $sum: "$totalPurchaseAmount" }, // Sum up all purchases
      },
    },
    {
      $project: {
        _id: 0,
        totalPurchases: 1,
      },
    },
  ];

  const result = await ItemsHistory.aggregate(totalPurchasesPipeline);
  return result.length > 0 ? result[0].totalPurchases : 0;
};

//I can use this to keep track of inventory, I am thinking of keeping a schema that saves everytime something happens to the ItemSchema 
//It will have changeQuantity or something that will give negative for each sale, and positive for each bought, 
//It will have also current amount in the schema. So I can track of how my item doing... 
