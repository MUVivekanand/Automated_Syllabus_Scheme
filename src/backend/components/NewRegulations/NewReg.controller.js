const supabase = require("../../supabaseClient");

const getAllCourses = async (req, res) => {
  try {
    const { degree, department } = req.query; // Get values from request query params

    let query = supabase.from("credits").select("*").order("serial_no");

    if (degree) query = query.eq("degree", degree);
    if (department) query = query.eq("department", department);

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateCourse = async (req, res) => {
  const { course_name } = req.params;
  const updatedCourse = req.body;
  const { degree, department } = updatedCourse;

  try {
    // Make sure we have the composite key values
    if (!degree || !department) {
      return res.status(400).json({ message: "Degree and department are required" });
    }
    
    const { data, error } = await supabase
      .from("credits")
      .update(updatedCourse)
      .eq("course_name", course_name)
      .eq("degree", degree)
      .eq("department", department)
      .select();

    if (error) throw error;
    if (data.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json({ message: "Course updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteMoveCourse = async (req, res) => {
  const { course_name } = req.params;
  const { degree, department } = req.body;

  try {
    // Make sure we have the composite key values
    if (!degree || !department) {
      return res.status(400).json({ message: "Degree and department are required" });
    }

    const { data, error } = await supabase
      .from("credits")
      .delete()
      .eq("course_name", course_name)
      .eq("degree", degree)
      .eq("department", department);

    if (error) throw error;

    res.json({ message: "Course deleted successfully!", data });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course", error });
  }
};

const addCourse = async (req, res) => {
  const newCourse = req.body;

  if (!newCourse.degree || !newCourse.department || 
      newCourse.ca_marks === undefined || newCourse.fe_marks === undefined || newCourse.total_marks === undefined) {
    return res.status(400).json({ 
      message: "Missing required fields. Please ensure degree, department, ca_marks, fe_marks, and total_marks are provided." 
    });
  }

  try {
    // Check if a course with the same composite key exists
    const { data: existingCourse, error: checkError } = await supabase
      .from("credits")
      .select("*")
      .eq("course_name", newCourse.course_name)
      .eq("degree", newCourse.degree)
      .eq("department", newCourse.department);

    if (checkError) throw checkError;

    if (existingCourse && existingCourse.length > 0) {
      return res.status(409).json({ 
        message: "A course with this name already exists for this degree and department." 
      });
    }

    const { data, error } = await supabase
      .from("credits")
      .insert(newCourse)
      .select();

    if (error) throw error;

    res.json(data[0] || { message: "Course added successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error adding course", error: error.message });
  }
};

const deleteCourse = async (req, res) => {
  const { course_name } = req.params;
  const { degree, department } = req.body;

  try {
    // Make sure we have the composite key values
    if (!degree || !department) {
      return res.status(400).json({ message: "Degree and department are required" });
    }

    const { data, error } = await supabase
      .from("credits")
      .delete()
      .eq("course_name", course_name)
      .eq("degree", degree)
      .eq("department", department);

    if (error) throw error;

    res.json({ message: "Course deleted successfully!", data });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course", error });
  }
};

module.exports = { getAllCourses, updateCourse, deleteMoveCourse, addCourse, deleteCourse };