const mongoose = require("mongoose");

const itemsHistorySchema = new mongoose.Schema({
  itemName: { type: String, required: true }, // Reference to the item's name
  soldQuantity: { type: Number, required: true }, // Quantity sold in this transaction
  purchasePricePerUnit: { type: Number, required: true }, // Purchase price per unit
  sellingPricePerUnit: { type: Number, required: true }, // Selling price per unit (before discount)
  discountPercent: { type: Number, default: 0 }, // Discount applied
  totalPrice: { type: Number, required: true }, // Total price after applying the discount
  transactionDate: { type: Date, default: Date.now }, // Date of the transaction
});

const ItemsHistory = mongoose.model("ItemsHistory", itemsHistorySchema);
module.exports = {ItemsHistory};
