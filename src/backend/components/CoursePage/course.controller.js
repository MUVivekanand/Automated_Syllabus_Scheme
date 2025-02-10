const supabase = require("../../supabaseClient");

// Get semester info by semNo
const getSemesterInfo = async (req, res) => {
  const { semNo } = req.params;

  try {
    const { data, error } = await supabase
      .from("seminfo")
      .select("*")
      .eq("sem_no", semNo)
      .single();

    if (error) throw error;

    res.json({
      ...data,
      mandatory_courses: data.mandatory_courses || 0,
    });
  } catch (error) {
    console.error("Error fetching semester info:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update course details by serial_no
const updateCourse = async (req, res) => {
  try {
    const { serial_no } = req.params;
    const {
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
      faculty,
      department,
      category,
    } = req.body;

    const parsedData = {
      lecture: isNaN(lecture) || lecture === "" ? 0 : parseInt(lecture),
      tutorial: isNaN(tutorial) || tutorial === "" ? 0 : parseInt(tutorial),
      practical: isNaN(practical) || practical === "" ? 0 : parseInt(practical),
      ca_marks: isNaN(ca_marks) || ca_marks === "" ? 0 : parseInt(ca_marks),
      fe_marks: isNaN(fe_marks) || fe_marks === "" ? 0 : parseInt(fe_marks),
      total_marks: isNaN(total_marks) || total_marks === "" ? 0 : parseInt(total_marks),
    };

    const { data, error } = await supabase
      .from("credits")
      .update({
        course_code,
        course_name,
        ...parsedData,
        credits,
        type,
        faculty,
        department,
        category,
      })
      .eq("serial_no", serial_no);

    if (error) throw new Error(error.message);

    res.status(200).json({ message: "Course updated successfully!" });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Failed to update course" });
  }
};

// Get filtered table data
const getTableData = async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("credits")
        .select(`
          course_code,
          course_name,
          lecture,
          tutorial,
          practical,
          credits,
          ca_marks,
          fe_marks,
          total_marks,
          type
        `)
        .order("sem_no");
  
      if (error) throw error;
  
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

const getCourses = async (req, res) => {
    try {
      const { semNo } = req.params;
      const { data, error } = await supabase
        .from("credits")
        .select("*")
        .eq("sem_no", semNo)
        .order("serial_no");
  
      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
};

module.exports = { getSemesterInfo, updateCourse, getTableData , getCourses };
