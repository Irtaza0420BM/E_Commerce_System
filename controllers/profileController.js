const { Employee } = require("../models/employees");

exports.profile = async (req, res) => {
    try {
        
        const userId = req.user.userId;
        const result = await Employee.findOne({ _id: userId });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Employee not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Employee found",
            data: result, 
        });
    } catch (error) {
        console.error("Error fetching employee profile:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
