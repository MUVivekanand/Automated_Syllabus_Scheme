const supabase = require("../../supabaseClient");

// Fetch credits summary with filtering
const getCreditsSummary = async (req, res) => {
  try {
    const { degree, department } = req.query;
    
    // Build query with filters
    let query = supabase.from("credits").select(`
      course_code,
      course_name,
      lecture,
      tutorial,
      practical,
      credits,
      ca_marks,
      fe_marks,
      total_marks,
      type,
      sem_no
    `);
    
    // Apply degree filter if provided
    if (degree) {
      query = query.eq("degree", degree);
    }
    
    // Apply department filter if provided and degree is not M.E
    if (department && degree !== 'M.E') {
      query = query.eq("department", department);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching data:", error);
      return res.status(500).json({ error: "Failed to fetch data" });
    }

    res.json(data);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Fetch total credits with filtering by degree
const getTotalCredits = async (req, res) => {
  try {
    const { degree, department } = req.query;
    
    // Determine which table to query based on degree
    const tableToQuery = degree === 'M.E' ? 'seminfome' : 'seminfo';
    
    // Build query
    let query = supabase
      .from(tableToQuery)
      .select("total_credits");
    
    // Apply department filter for B.E degrees
    if (degree === 'B.E' && department) {
      query = query.eq("department", department);
    }
    
    // Limit to one result
    query = query.limit(1);
    
    const { data, error } = await query;

    if (error) throw error;

    if (data && data.length > 0) {
      res.json({ total_credits: data[0].total_credits });
    } else {
      res.status(404).json({ message: "No total credits found" });
    }
  } catch (error) {
    console.error("Error fetching total credits:", error);
    res.status(500).json({ message: "Error fetching total credits" });
  }
};

module.exports = { getCreditsSummary, getTotalCredits };