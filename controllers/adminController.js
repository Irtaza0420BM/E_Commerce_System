const {Item} = require('../models/items')
const {Employee} = require('../models/employees');
const{ItemsHistory} = require('../models/itemsHistory')
const {Invoice} = require ('../models/invoices')

const mongoose = require("mongoose");

exports.dashboard = async (req, res) => {
    try {
      const [itemMetrics, salesMetrics, graphsdata] = await Promise.all([
        getItemMetrics(),
        getSalesMetrics(),
        get7daysMetrics()
      ]);
      console.log(graphsdata)
      const dashboardMetrics = itemMetrics[0].ItemsInfo
      res.status(200).json({
        totalSales: salesMetrics[0].totalSales,
        totalSoldQuantity: salesMetrics[0].totalSoldQuantity,
        totalProfit: salesMetrics[0].totalProfit,
        //For Dashboard Metrics`
        ItemsinStock: dashboardMetrics[0].totalStock|| 0,
        ItemsQuantity: dashboardMetrics[0].totalQuantity || 0,
        inHighStock: dashboardMetrics[0].inHighStock || 0,
        inLowStock: dashboardMetrics[0].inLowStock,
        TotalPurchaseonItems: dashboardMetrics[0].totalPurchase,
        totalSalesonItems: dashboardMetrics[0].totalSale,
        totalRevenuePotential: dashboardMetrics[0].totalRevenuePotential,
        sevendaysStats: graphsdata
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
exports.readAllEmmployees =  async(req, res) =>
    {
        const {name} = req.body;
        if (name ?? false) {
            existing_item = await Employee.findOne({ name });
        } else {
            existing_item = await Employee.find();
        }
    
        if (!existing_item || (Array.isArray(existing_item) && existing_item.length === 0)) {
            res.status(400).json({success: false, message: "Item doesn't exist."})
        } else {
            res.status(200).json({success: true, message: existing_item })
        }
    
    }
  
// exports.dashboard = async (req, res) => {
//     try {
//         const [dashboardMetrics, lowStockItems, salesMetrics] = await Promise.all([
//             // Aggregation for item-related metrics
//             Item.aggregate([
//                 {
//                     $facet: {
//                         totalQuantityItems: [{ $group: { _id: null, total: { $sum: "$quantity" } } }],
//                         totalitemsAvailable: [{ $match: { stock: "Available" } }, { $count: "TotalItemsAvailable" }],
//                         totalProfit: [
//                             {
//                                 $group: {
//                                     _id: null,
//                                     potentialProfit: {
//                                         $sum: {
//                                             $multiply: [
//                                                 { $subtract: ["$selling_price_per_unit", "$buying_price_per_unit"] },
//                                                 "$quantity",
//                                             ],
//                                         },
//                                     },
//                                 },
//                             },
//                         ],
//                         totalStocks: [{ $count: "count" }],
//                     },
//                 },
//             ]),
//             Item.aggregate([
//                 {
//                     $match: {
//                         $expr: { $lt: ["$quantity", "$required_quantity"] }, // Filter for low stock
//                     },
//                 },
//                 { $project: { name: 1, quantity: 1, required_quantity: 1, _id: 0 } },
//             ]),
//             ItemsHistory.aggregate([
//                 {
//                     $match: {
//                         "action": "Sale",
//                     },
//                     $group: {
//                         _id: null,
//                         totalSales: { $sum: "$totalPrice" }, // Sum of total price
//                         totalSoldQuantity: { $sum: "$deltaQuantity" }, // Sum of sold quantities
//                         totalProfit: {
//                             $sum: {
//                                 $add: [
//                                     "$totalPrice",
//                                     { $multiply: ["$purchasePricePerUnit", "$deltaQuantity"] },
//                                 ],
//                             },
//                         },
//                     },
//                 },
//             ]),
//         ]);

//         // Extract metrics
//         const totalSales = salesMetrics[0]?.totalSales || 0;
//         const totalSoldQuantity = salesMetrics[0]?.totalSoldQuantity || 0;
//         const totalProfitFromHistory = salesMetrics[0]?.totalProfit || 0;

//         res.status(200).json({
//             totalSales,
//             totalSoldQuantity,
//             totalProfit: totalProfitFromHistory, // Prefer profit from itemsHistory if available
//             totalStocks: dashboardMetrics[0].totalStocks[0]?.count || 0,
//             totalQuantity: dashboardMetrics[0].totalQuantity[0]?.total || 0,
//             inStock: dashboardMetrics[0].inStock[0]?.count || 0,
//             lowStockItems,
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// };

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

async function getItemMetrics() {
    return Item.aggregate([ {
        $facet: {
          lowStockInfo: [  {
        $match: {
          stock: { $ne: "Available" }  // Filters documents where the "stock" field is not "Available"
        }
      } ],
          ItemsInfo: [
              {
                $addFields: {
                  totalPurchase: {
                    $multiply: ["$buying_price_per_unit", "$quantity"]
                  },
                  totalSale: {
                    $multiply: ["$selling_price_per_unit", "$quantity"]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  totalQuantity: { $sum: "$quantity" },
                  totalPurchase: { $sum: "$totalPurchase" },
                  totalSale: { $sum: "$totalSale" },
                  totalStock: { $sum: 1},
                  
                  inHighStock: {
                    $sum: {
                      $cond: [{ $eq: ["$stock", "Available"] }, 1, 0]
                    }
                  },
                  inLowStock: {
                    $sum: {
                      $cond: [{ $ne: ["$stock", "Available"] }, 1, 0]
                    }
                  }
                },
              },
              {
                $addFields: {
                  totalRevenuePotential: {
                    $subtract: ["$totalSale", "$totalPurchase"]
                  }
                }
              }
            ]
        }
      }
      ]
      );
  }
async function getSalesMetrics() {
    return Invoice.aggregate([
        { $unwind:  "$items" }, 
      
        {
          $lookup: {
            from: "items", 
            localField: "items.name", 
            foreignField: "name", 
            as: "result",
          },
        },

        {
            $addFields: { 
              "Revenue": { 
                $subtract: [
                  "$total", 
                  { 
                    $multiply: [
                      { $arrayElemAt: ["$result.buying_price_per_unit", 0] },
                      "$items.quantity"
                    ]
                  }
                ] 
              }
            }
        },

        {
          $group: {
            _id: null, // Group all documents together
            totalSales: { $sum: "$total" }, // Sum the total sales from Invoice
            totalSoldQuantity: { $sum: "$items.quantity" }, // Sum the quantity sold for all items
            totalProfit: { $sum: "$Revenue" }, // Sum the profit for all items
          },
        },
      
      ]);
      
  }
async function get7daysMetrics(){
    return Invoice.aggregate([
        // Step 1: Unwind the "items" array
        { $unwind: "$items" },
      
        // Step 2: Lookup the item details from the "items" collection
        {
          $lookup: {
            from: "items", 
            localField: "items.name", 
            foreignField: "name", 
            as: "result",
          }
        },
      
        // Step 3: Add Revenue field by subtracting the cost of items from the total
        {
          $addFields: { 
            "Revenue": { 
              $subtract: [
                "$total", 
                { 
                  $multiply: [
                    { $arrayElemAt: ["$result.buying_price_per_unit", 0] },
                    "$items.quantity"
                  ]
                }
              ] 
            }
          }
        },
      
        // Step 4: Match data for the last 7 days
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setDate(new Date().getDate() - 7)) // last 7 days
            }
          }
        },
      
        // Step 5: Project the necessary fields, including formatted day
        {
          $project: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: 1,
            Revenue: 1,
            "items.quantity": 1,
          }
        },
      
        // Step 6: Group by day and calculate the totals
        {
          $group: {
            _id: "$day", // Group by day
            perdaySales: { $sum: "$total" },        // Sum of sales per day
            perdayRevenue: { $sum: "$Revenue" },    // Sum of revenue per day
            perdaySaleAmount: { $sum: "$items.quantity" }, // Total quantity sold per day
            count: { $sum: 1 } // Count the number of transactions (or documents) per day
          }
        },
      
      
      ]
      )
}