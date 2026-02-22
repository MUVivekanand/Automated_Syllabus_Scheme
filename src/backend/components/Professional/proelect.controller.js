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







const getCoursesElectiveAll = async(req,res) => {
  try {
    const { degree, department } = req.query;
    // console.log("Attempting to fetch courses from Supabase");
    let query = supabase.from("electivebe").select("*");
    
    if (degree) {
      query = query.eq("degree", degree);
    }
    
    if (department) {
      query = query.eq("department", department);
    }
    
    query = query.order("type").order("serial_number");
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Database error' });
  }
};

const getCoursesElective = async(req,res) => {
  try {
    const { code } = req.params;
    const { data, error } = await supabase
      .from("electivebe")
      .select("*")
      .eq("course_code", code)
      .single();
    
    if (error) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Database error' });
  }
};

const postCoursesElective = async(req,res) => {
  try {
    // console.log(req.body);
    const { serial_number, course_code, course_title, type, vertical, date, degree, department } = req.body;
    // console.log("Attempting to fetch courses from Supabase");
    // Check if course code already exists
    const { data: existingCourse, error: checkError } = await supabase
      .from("electivebe")
      .select("*")
      .eq("course_code", course_code);
    
    if (checkError) {
      return res.status(400).json({ error: checkError.message });
    }
    
    if (existingCourse.length > 0) {
      return res.status(400).json({ error: 'Course code already exists' });
    }
    
    const { data, error } = await supabase
      .from("electivebe")
      .insert([
        { serial_number, course_code, course_title, type, vertical, date, degree, department }
      ])
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Database error' });
  }
};

const putCoursesElective = async(req,res) => {
  try {
    const { code } = req.params;
    const { serial_number, course_title, type, vertical, date, degree, department } = req.body;
    
    const { data, error } = await supabase
      .from("electivebe")
      .update({ serial_number, course_title, type, vertical, date, degree, department })
      .eq("course_code", code)
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(data[0]);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Database error' });
  }
};

const deleteCoursesElective = async(req,res) => {
  try {
    const { code } = req.params;
    const { data, error } = await supabase
      .from("electivebe")
      .delete()
      .eq("course_code", code)
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// New functions for managing verticals
const getVerticals = async(req, res) => {
  try {
    const { degree, department } = req.query;
    let query = supabase.from("verticals").select("*");
    
    if (degree) {
      query = query.eq("degree", degree);
    }
    
    if (department) {
      query = query.eq("department", department);
    }
    
    query = query.order("id");
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // If no verticals found, create default ones
    if (data.length === 0) {
      const defaultVerticals = [
        { id: 1, name: "VERTICAL I: Computational Intelligence", degree, department },
        { id: 2, name: "VERTICAL II: Networking Technologies", degree, department },
        { id: 3, name: "VERTICAL III: Security and Privacy", degree, department }
      ];
      
      const { data: insertedData, error: insertError } = await supabase
        .from("verticals")
        .insert(defaultVerticals)
        .select();
      
      if (insertError) {
        return res.status(400).json({ error: insertError.message });
      }
      
      return res.json(insertedData);
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Database error' });
  }
};

const getVertical = async(req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("verticals")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      return res.status(404).json({ error: 'Vertical not found' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Database error' });
  }
};

const postVertical = async(req, res) => {
  try {
    const { id, name, degree, department } = req.body;
    
    // Check if id already exists
    const { data: existingVertical, error: checkError } = await supabase
      .from("verticals")
      .select("*")
      .eq("id", id)
      .eq("degree", degree)
      .eq("department", department);
    
    if (checkError) {
      return res.status(400).json({ error: checkError.message });
    }
    
    if (existingVertical.length > 0) {
      return res.status(400).json({ error: 'Vertical ID already exists for this degree/department' });
    }
    
    const { data, error } = await supabase
      .from("verticals")
      .insert([
        { id, name, degree, department }
      ])
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Database error' });
  }
};

const putVertical = async(req, res) => {
  try {
    const { id } = req.params;
    const { name, degree, department } = req.body;
    
    const { data, error } = await supabase
      .from("verticals")
      .update({ name })
      .eq("id", id)
      .eq("degree", degree)
      .eq("department", department)
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Vertical not found' });
    }
    
    res.json(data[0]);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Database error' });
  }
};

const deleteVertical = async(req, res) => {
  try {
    const { id } = req.params;
    
    // First, delete all courses associated with this vertical
    const { error: coursesError } = await supabase
      .from("electivebe")
      .delete()
      .eq("vertical", id);
    
    if (coursesError) {
      return res.status(400).json({ error: coursesError.message });
    }
    
    // Then delete the vertical
    const { data, error } = await supabase
      .from("verticals")
      .delete()
      .eq("id", id)
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Vertical not found' });
    }
    
    res.json({ message: 'Vertical and associated courses deleted successfully' });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Database error' });
  }
};



module.exports = {
    insertProfessional,
    updateProfessional,
    getProfessional,

    getCoursesElectiveAll,
    getCoursesElective,
    postCoursesElective,
    putCoursesElective,
    deleteCoursesElective,
    getVerticals,
    getVertical,
    postVertical,
    putVertical,
    deleteVertical
};