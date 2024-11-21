//Creating functions that I will use in admin.//

exports.totalSales = async(req, res) =>
{

}

exports.totalProfit = async(req,res) => 
{

}

exports.totalPurchase = async(req,res) =>
{

}

exports.totalStocks = async(req,res) => 
{

}

exports.totalQuantity = async(req,res) =>
{

}

exports.inStock = async(req,res) => 
{

}

exports.lowStock = async(req,res) =>
{

}

exports.chatGpt = async(req, res) => 
{        
    try {
        const [dashboardMetrics, lowStockItems] = await Promise.all([
        Item.aggregate([
            {
            $facet: {
                totalQuantity: [{ $group: { _id: null, total: { $sum: "$quantity" } } }],
                inStock: [{ $match: { stock: "Available" } }, { $count: "count" }],
                totalProfit: [
                {
                    $group: {
                    _id: null,
                    profit: {
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
        ]);
    
        // Aggregate for total sales
        const totalSales = await Invoice.aggregate([
        { $group: { _id: null, total: { $sum: "$total" } } },
        ]);
    
        res.status(200).json({
        totalSales: totalSales[0]?.total || 0,
        totalProfit: dashboardMetrics[0].totalProfit[0]?.profit || 0,
        totalPurchase: 0, // Replace with aggregation if purchase schema is added
        totalStocks: dashboardMetrics[0].totalStocks[0]?.count || 0,
        totalQuantity: dashboardMetrics[0].totalQuantity[0]?.total || 0,
        inStock: dashboardMetrics[0].inStock[0]?.count || 0,
        lowStockItems,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
    
 }