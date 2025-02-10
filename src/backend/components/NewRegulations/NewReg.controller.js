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
  const { serial_no } = req.params;
  const updatedCourse = req.body;

  try {
    const { error } = await supabase
      .from("credits")
      .update(updatedCourse)
      .eq("serial_no", serial_no);

    if (error) throw error;

    res.json({ message: "Course updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteCourse = async (req, res) => {
  const { serial_no } = req.params;

  try {
    const { data, error } = await supabase
      .from("credits")
      .delete()
      .eq("serial_no", serial_no);

    if (error) throw error;

    res.json({ message: "Course deleted successfully!", data });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course", error });
  }
};

const addCourse = async (req, res) => {
  const newCourse = req.body;

  try {
    const { data, error } = await supabase.from("credits").upsert(newCourse, { onConflict: ["serial_no"] });

    if (error) throw error;

    res.json({ message: "Course added successfully!", data });
  } catch (error) {
    res.status(500).json({ message: "Error adding course", error });
  }
};

module.exports = { getAllCourses, updateCourse, deleteCourse, addCourse };
