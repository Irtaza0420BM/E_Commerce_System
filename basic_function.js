// I want to create 3 functions One let the user Create his Collection (user) document, Other let the middle man (admin) create a collection, and the third one to let the user delete his collection
// I will use the Mongoose library to interact with MongoDB
const {Item, soldItem} = require('./models/usermodels.js')
const {createSchema, updateSchema, removeSchema} = require('./middlewares/validator.js');
const { exist } = require('joi');

const create =  async(req, res)
{
    const {name, quantity, required_quantity, price_per_unit} = req.body; //(Its not chatgpt its me trying to logs, this one will take three parameters from req.body)
    try {
        const{error , value} = createSchema.validate({name, quantity, required_quantity})
        if(error)
        {
            //return res.status(400).json({message: error.details[0].message})
            console.log(error.details[0].message)
        }
        
        let stock = "In stock";
        if (quantity==0) {
            stock = "empty";
        } 
        else if(quantity < required_quantity ) {
            stock = "Low stock needs shelving"
        }
        const item= new Item({name, quantity, required_quantity, stock, price_per_unit});
        const result = await item.save();
        console.log("Item saves successful ", result)
    } catch (error) {
        console.error(error);  
    }
    res;
}
// What I want my read to do? I want it to check If the user gave any name. if it did , then it will return the collection with the given name. If not, it will return entire collection
const read =  async(req, res) =>
{
    let existing_item;
    const { name } = req.body;
    if (name ?? false) {
        existing_item = await Item.findOne({ name });
    } else {
        existing_item = await Item.find();
    }

    if (!existing_item || (Array.isArray(existing_item) && existing_item.length === 0)) {
        console.log('Item doesn\'t exist');
    } else {
        console.log(existing_item);
    }

}
//What I want update to do? Basically I want it to update the quantity and update stock. 
const updateStock = async (req, res) => {
    const { name, quantity, price_per_unit } = req.body;
    try {
      
      const item = await Item.findOne(name);
      if (!item) return res.status(404).json({ error: "Item not found" });
  
      // Calculate new average price
      const totalExistingValue = item.quantity * item.price_per_unit;
      const totalNewValue = quantity * price_per_unit;
      const newTotalQuantity = item.quantity + quantity;
      const newAveragePrice = (totalExistingValue + totalNewValue) / newTotalQuantity;
  
      // Update the item
      item.quantity = newTotalQuantity;
      item.price_per_unit = newAveragePrice;
      await item.save();
  
      // Log the purchase
      const purchase = new Purchase({
        item_id: item._id,
        quantity,
        price_per_unit,
        total_cost: quantity * price_per_unit
      });
      await purchase.save();
  
      res.status(200).json({ message: "Stock updated successfully", item });
    } catch (error) {
      res.status(500).json({ error: "Error updating stock" });
    }
  };
  
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
  

const req = {
    body: {name : "caple"}
}

read(req, console.log("this is res") )