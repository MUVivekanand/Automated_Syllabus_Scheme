const supabase = require("../../supabaseClient");

// Fetch all credits summary
const getCreditsSummary = async (req, res) => {
  try {
    const { data, error } = await supabase.from("credits").select(`
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

// Fetch total credits
const getTotalCredits = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("seminfo")
      .select("total_credits")
      .limit(1);

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
