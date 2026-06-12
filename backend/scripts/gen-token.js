const jwt = require("jsonwebtoken");
require("dotenv").config();

// Create a valid token for UserID = 1
const token = jwt.sign({ userId: 1, role: "Admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
console.log(token);
