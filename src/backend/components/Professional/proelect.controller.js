const supabase = require("../../supabaseClient");

const insertProfessional = async (req, res) => {
    try {
      // Expecting an array of rows in req.body.rows
      const { rows } = req.body;
  
      // Insert into supabase
      const { data, error } = await supabase
        .from("proelectiveme")
        .insert(rows);
  
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      return res.json({ success: true, data });
    } catch (err) {
      console.error("Error in POST /api/proelective:", err);
      return res.status(500).json({ error: "Server error" });
    }
};

// Update a specific row in the database
const updateProfessional = async (req, res) => {
    try {
      console.log("Update request received:", req.body);
      
      // Extract the row data from request body
      const { row } = req.body;
      
      if (!row || !row.id) {
        return res.status(400).json({ error: "Invalid request: Row ID is required" });
      }
      
      console.log("Attempting to update row with ID:", row.id);
      
      // Use upsert to update if exists, insert if not
      const { data, error } = await supabase
        .from("proelectiveme")
        .upsert(row, {
          onConflict: 'id', 
          returning: 'representation'  // Return the updated/inserted row
        });
  
      if (error) {
        console.error("Supabase error:", error);
        return res.status(400).json({ error: error.message });
      }
      
      console.log("Update successful:", data);
      return res.json({ success: true, data });
    } catch (err) {
      console.error("Error in update endpoint:", err);
      return res.status(500).json({ error: "Server error: " + err.message });
    }
};
  
// Get table data
const getProfessional = async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("proelectiveme")
        .select("*")
        .order("id");
  
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      return res.json(data);
    } catch (err) {
      console.error("Error in GET /api/proelective:", err);
      return res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    insertProfessional,
    updateProfessional,
    getProfessional
};