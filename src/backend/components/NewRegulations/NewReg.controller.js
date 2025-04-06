const supabase = require("../../supabaseClient");

const getAllCourses = async (req, res) => {
  try {
    const { degree, department } = req.query;

    let query = supabase.from("credits").select("*");
    if (degree) query = query.eq("degree", degree);
    if (department) query = query.eq("department", department);

    const { data: allCourses, error } = await query;

    if (error) throw error;
    
    if (allCourses.length === 0) {
      return res.json([]);
    }

    const regulationYears = allCourses
      .map(course => course.course_code?.substring(0, 2))
      .filter(Boolean)
      .map(year => parseInt(year, 10))
      .filter(year => !isNaN(year));

    if (regulationYears.length === 0) {
      return res.json(allCourses);
    }

    const mostRecentYear = Math.max(...regulationYears);
    
    const mostRecentCourses = allCourses.filter(course => 
      course.course_code?.startsWith(mostRecentYear.toString().padStart(2, '0'))
    );

    mostRecentCourses.sort((a, b) => (a.serial_no || 0) - (b.serial_no || 0));
    
    res.json(mostRecentCourses);
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

const confirmRegulation = async (req, res) => {
  const { courses, degree, department, regulationYear } = req.body;

  if (!courses || !Array.isArray(courses) || courses.length === 0) {
    return res.status(400).json({ message: "No courses provided" });
  }

  if (!degree || !department) {
    return res.status(400).json({ message: "Degree and department are required" });
  }

  if (!regulationYear) {
    return res.status(400).json({ message: "Regulation year is required" });
  }

  const departmentWithYear = `${department}-${regulationYear}`;

  try {
    const { data: existingCourses, error: fetchError } = await supabase
      .from("credits")
      .select("course_name, ca_marks, fe_marks, total_marks")
      .eq("degree", degree)
      .eq("department", department);

    if (fetchError) throw fetchError;

    const courseCommonValuesMap = {};
    if (existingCourses && existingCourses.length > 0) {
      existingCourses.forEach(course => {
        courseCommonValuesMap[course.course_name] = {
          ca_marks: course.ca_marks,
          fe_marks: course.fe_marks,
          total_marks: course.total_marks
        };
      });
    }

    const coursesToInsert = courses.map(course => {
      const commonValues = courseCommonValuesMap[course.course_name] || {
        ca_marks: null,
        fe_marks: null,
        total_marks: null
      };

      return {
        course_code: course.course_code,
        course_name: course.course_name || "",
        sem_no: course.sem_no,
        degree,
        department: departmentWithYear, // Use the department with year suffix
        lecture: course.lecture || 0,
        tutorial: course.tutorial || 0,
        practical: course.practical || 0,
        credits: course.credits || 0,
        type: course.type || "",
        faculty: course.faculty || "",
        category: course.category || "",
        serial_no: course.serial_no || 0,
        // Use course-specific common values
        ca_marks: commonValues.ca_marks,
        fe_marks: commonValues.fe_marks,
        total_marks: commonValues.total_marks
      };
    });

    // Insert the courses
    const { data, error } = await supabase
      .from("credits")
      .insert(coursesToInsert);
    
    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    res.json({ 
      message: "New regulation confirmed successfully!",
      department: departmentWithYear
    });
  } catch (error) {
    console.error("Error confirming regulation:", error);
    res.status(500).json({ message: "Error confirming regulation", error: error.message });
  }
};

module.exports = { getAllCourses, updateCourse, deleteMoveCourse, addCourse, deleteCourse, confirmRegulation };