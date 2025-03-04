const supabase = require("../../supabaseClient");

const getAllCourses = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("credits")
      .select("*")
      .order("serial_no");

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

  try {
    
    const { data, error } = await supabase
      .from("credits")
      .update(updatedCourse)
      .ilike("course_name", `%${course_name}%`) // Case-insensitive search
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

  try {
    const { data, error } = await supabase
      .from("credits")
      .delete()
      .eq("course_name", course_name);

    if (error) throw error;

    res.json({ message: "Course deleted successfully!", data });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course", error });
  }
};

const addCourse = async (req, res) => {
  const newCourse = req.body;

  try {
    const { data, error } = await supabase
      .from("credits")
      .insert(newCourse);

    if (error) throw error;

    res.json({ message: "Course added successfully!", data });
  } catch (error) {
    res.status(500).json({ message: "Error adding course", error });
  }
};

const deleteCourse = async (req, res) => {
  const { course_name } = req.params;

  try {
    const { data, error } = await supabase
      .from("credits")
      .delete()
      .eq("course_name", course_name);

    if (error) throw error;

    res.json({ message: "Course deleted successfully!", data });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course", error });
  }
};

module.exports = { getAllCourses, updateCourse, deleteMoveCourse, addCourse, deleteCourse };
