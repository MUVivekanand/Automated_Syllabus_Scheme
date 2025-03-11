const supabase = require("../../supabaseClient");

const getSemesterInfo = async (req, res) => {
  try {
    const { semNo } = req.params;
    const { degree, department } = req.query;

    // Determine the correct table
    const tableToQuery = degree === "M.E" ? "seminfome" : "seminfo";

    // Base query
    let query = supabase
      .from(tableToQuery)
      .select("*")
      .eq("sem_no", Number(semNo));

    // Apply filters for both M.E and B.E
    if (degree) {
      query = query.eq("degree", degree);
    }

    if (department) {
      query = query.eq("department", department);
    }

    const { data, error } = await query;

    if (error) throw error;

    // If no data is found, return default response
    if (!data || data.length === 0) {
      return res.json({
        theory_courses: 0,
        practical_courses: 0,
        mandatory_courses: 0,
        sem_no: Number(semNo),
      });
    }

    res.json(data[0]); // Return the first matched record
  } catch (error) {
    console.error("Error fetching semester info:", error);
    res.status(500).json({ message: "Failed to fetch semester info" });
  }
};


// Helper function to handle course details relationships
const updateOrDeleteCourseDetails = async (oldCourseCode, newCourseCode = null) => {
  if (oldCourseCode) {
    // Check if course_code exists in course_details
    const { data: existingDetails } = await supabase
      .from("course_details")
      .select("*")
      .eq("course_code", oldCourseCode);

    if (existingDetails && existingDetails.length > 0) {
      if (newCourseCode) {
        // Update the course_code in course_details
        const { error: updateError } = await supabase
          .from("course_details")
          .update({ course_code: newCourseCode })
          .eq("course_code", oldCourseCode);
        
        if (updateError) throw updateError;
      } else {
        // Delete records from course_details if we're removing the course
        const { error: deleteError } = await supabase
          .from("course_details")
          .delete()
          .eq("course_code", oldCourseCode);
        
        if (deleteError) throw deleteError;
      }
    }
  }
};

const updateCourse = async (req, res) => {
  try {
    const { course_name } = req.params;
    const {
      serial_no,
      course_code,
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
      degree,
      sem_no,
      category
    } = req.body;

    // Get the current course data to check for course_code changes
    const { data: currentCourse, error: fetchError } = await supabase
      .from("credits")
      .select("course_code")
      .eq("course_name", course_name)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") { // Not found error is okay
      throw fetchError;
    }

    // Handle course_details relationship if course_code is changing
    if (currentCourse && currentCourse.course_code !== course_code) {
      await updateOrDeleteCourseDetails(currentCourse.course_code, course_code);
    }

    const parsedData = {
      serial_no: parseInt(serial_no) || 0,
      lecture: parseInt(lecture) || 0,
      tutorial: parseInt(tutorial) || 0,
      practical: parseInt(practical) || 0,
      credits: parseInt(credits) || 0,
      ca_marks: parseInt(ca_marks) || 0,
      fe_marks: parseInt(fe_marks) || 0,
      total_marks: parseInt(total_marks) || 0,
    };

    const { error: upsertError } = await supabase
      .from("credits")
      .upsert({
        course_code,
        course_name,
        ...parsedData,
        type,
        faculty,
        department,
        degree,
        sem_no,
        category
      }, {
        onConflict: 'course_name'
      });

    if (upsertError) {
      // Handle duplicate key constraint specifically
      if (upsertError.code === '23505') {
        // First try to delete the conflicting record
        const { error: deleteError } = await supabase
          .from("credits")
          .delete()
          .eq("sem_no", sem_no)
          .eq("course_code", course_code);
        
        if (deleteError) throw deleteError;
        
        // Then try the upsert again
        const { error: retryError } = await supabase
          .from("credits")
          .upsert({
            course_code,
            course_name,
            ...parsedData,
            type,
            faculty,
            department,
            degree,
            sem_no,
            category
          });
          
        if (retryError) throw retryError;
      } else {
        throw upsertError;
      }
    }

    res.status(200).json({ message: "Course updated successfully!" });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Failed to update course", error: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { course_name } = req.params;
    
    // Get the course_code before deleting
    const { data: course, error: fetchError } = await supabase
      .from("credits")
      .select("course_code")
      .eq("course_name", course_name)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Handle course_details relationship first
    await updateOrDeleteCourseDetails(course.course_code);
    
    // Then delete from credits table
    const { error: deleteError } = await supabase
      .from("credits")
      .delete()
      .eq("course_name", course_name);
      
    if (deleteError) throw deleteError;
    
    res.status(200).json({ message: "Course deleted successfully!" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Failed to delete course", error: error.message });
  }
};

const getCourses = async (req, res) => {
  try {
    const { semNo } = req.params;
    const { degree } = req.query;
    const { department } = req.query;
    
    // Determine which degree type we're working with
    const isDegreeMe = degree === 'M.E';
    
    const { data, error } = await supabase
      .from("credits")
      .select("*")
      .eq("sem_no", Number(semNo))
      .eq("degree", degree)
      .eq("department",department) // Filter by degree, department
      .order("serial_no");

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
};

const getTableData = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("credits")
      .select("*")
      .order("sem_no, serial_no");

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getSemesterInfo,
  updateCourse,
  getTableData,
  getCourses,
  deleteCourse
};
