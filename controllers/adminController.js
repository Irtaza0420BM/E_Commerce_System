const {Item} = require('../models/items')
const {Employee} = require('../models/employees');
const{ItemsHistory} = require('../models/itemsHistory')
const {Invoice} = require ('../models/invoices')


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
  
exports.dashboard = async (req, res) => {
    try {
        const [dashboardMetrics, lowStockItems, salesMetrics] = await Promise.all([
            // Aggregation for item-related metrics
            Item.aggregate([
                {
                    $facet: {
                        totalQuantityItems: [{ $group: { _id: null, total: { $sum: "$quantity" } } }],
                        totalitemsAvailable: [{ $match: { stock: "Available" } }, { $count: "TotalItemsAvailable" }],
                        totalProfit: [
                            {
                                $group: {
                                    _id: null,
                                    potentialProfit: {
                                        $sum: {
                                            $multiply: [
                                                { $subtract: ["$selling_price_per_unit", "$buying_price_per_unit"] },
                                                "$quantity",
                                            ],
                                        },
                                    },
                                },
                            },
                        ],
                        totalStocks: [{ $count: "count" }],
                    },
                },
            ]),
            Item.aggregate([
                {
                    $match: {
                        $expr: { $lt: ["$quantity", "$required_quantity"] }, // Filter for low stock
                    },
                },
                { $project: { name: 1, quantity: 1, required_quantity: 1, _id: 0 } },
            ]),
            ItemsHistory.aggregate([
                {
                    $match: {
                        "action": "Sale",
                    },
                    $group: {
                        _id: null,
                        totalSales: { $sum: "$totalPrice" }, // Sum of total price
                        totalSoldQuantity: { $sum: "$deltaQuantity" }, // Sum of sold quantities
                        totalProfit: {
                            $sum: {
                                $add: [
                                    "$totalPrice",
                                    { $multiply: ["$purchasePricePerUnit", "$deltaQuantity"] },
                                ],
                            },
                        },
                    },
                },
            ]),
        ]);

        // Extract metrics
        const totalSales = salesMetrics[0]?.totalSales || 0;
        const totalSoldQuantity = salesMetrics[0]?.totalSoldQuantity || 0;
        const totalProfitFromHistory = salesMetrics[0]?.totalProfit || 0;

        res.status(200).json({
            totalSales,
            totalSoldQuantity,
            totalProfit: totalProfitFromHistory, // Prefer profit from itemsHistory if available
            totalStocks: dashboardMetrics[0].totalStocks[0]?.count || 0,
            totalQuantity: dashboardMetrics[0].totalQuantity[0]?.total || 0,
            inStock: dashboardMetrics[0].inStock[0]?.count || 0,
            lowStockItems,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.unverifiedemployees = async(req, res) => {
    try {
        const unverified = await Employee.find({verified: false})
        res.status(200).json({unverified})
    } catch (error) {
        res.status(400).json({message: error})
    }
}

exports.verifyEmployee = async(req, res) => {
    try {
        const { employeeId } = req.body;
        const toVerifyEmployee = await Employee.findOne({ _id: employeeId });
    
        if (!toVerifyEmployee) {
            return res.status(404).json({ success: false, message: "Employee not found." });
        }
    
        toVerifyEmployee.verified = true;
       result= await toVerifyEmployee.save();
    
        res.status(200).json({ success: true, message: "Employee has been verified." , result });
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "An error occurred while verifying the employee." });
    }
    
}


// exports.areemployeesLogin = async (req,res) => {
//  This is my function to check how many employees are logged in, Or when did an employee logged in, logged out. etc.
// }