const pool = require("../config/db");
exports.reportLostItem = async (req, res) => {
  try {
    const { title, description, category_id, location } = req.body;
    const userId = req.user.user_id;
    const result = await pool.query(
      `
      INSERT INTO items (title, description, category_id, location, type, user_id)
      VALUES ($1, $2, $3, $4, 'Lost', $5)
      RETURNING *
      `,
      [title, description, category_id, location, userId]
    );
    res.status(201).json({
      message: "Lost item reported successfully",
      item: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to report lost item" });
  }
};
exports.reportLostItem = async (req, res) => {
    try {
        console.log("---------------- DEBUG START ----------------");
        console.log("1. Request Body:", req.body);
        console.log("2. User from Auth Middleware:", req.user);

        const { title, description, category_id, location } = req.body;
        
        const userId = req.user.user_id || req.user.id; 

        console.log("3. Extracted User ID:", userId);

        // DATABASE QUERY
        const query = `
            INSERT INTO items (title, description, category_id, location, type, user_id)
            VALUES ($1, $2, $3, $4, 'Lost', $5)
            RETURNING *
        `;

        const result = await pool.query(query, [
            title, 
            description, 
            category_id, 
            location, 
            userId
        ]);

        res.status(201).json({
            message: "Lost item reported successfully",
            item: result.rows[0],
        });

    } catch (err) {
        console.error("CRITICAL ERROR:", err.message);
        res.status(500).json({ 
            error: "Server Error", 
            details: err.message,
            hint: "Check the VS Code terminal for more info"
        });
    }
};

exports.reportFoundItem = async (req, res) => {
    try {
        const { title, description, category_id, location } = req.body;
        const userId = req.user.user_id || req.user.id; // Handle both token types

        const query = `
            INSERT INTO items (title, description, category_id, location, type, user_id)
            VALUES ($1, $2, $3, $4, 'Found', $5)
            RETURNING *
        `;

        const result = await pool.query(query, [title, description, category_id, location, userId]);

        res.status(201).json({
            message: "Found item reported successfully",
            item: result.rows[0],
        });
    } catch (err) {
        console.error("DATABASE ERROR (FOUND):", err.message);
        res.status(500).json({ error: "Failed to report found item", details: err.message });
    }
};