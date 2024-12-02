const { Employee } = require("../models/employees");

exports.profile = async (req, res) => {
    try {
        console.log("I was here");
        
        // Extract the userId from the request
        // const userId = req.user.userId;
        const userId = "673f2b8f8d76aa030fa4ed41"

        // Fetch the employee record from the database
        const result = await Employee.findOne({ _id: userId });

        if (!result) {
            // If no employee is found, return a 404 error
            return res.status(404).json({
                success: false,
                message: "Employee not found",
            });
        }

        // Return the result if found
        return res.status(200).json({
            success: true,
            message: "Employee found",
            data: result, // Sending the employee details
        });
    } catch (error) {
        // Handle errors and return a 500 status
        console.error("Error fetching employee profile:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
