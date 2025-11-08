const supabase = require("../../supabaseClient");

const updateCourseDetails = async (req, res) => {
  try {
    const {
      courseCode,
      courseName,
      facultyName,
      degree,
      department,
      coDetails,
      hours,
      textbooks,
      references,
      outcomes,
    } = req.body;

    // Check if the course exists in `course_details`
    const { data: existingCourse, error: fetchError } = await supabase
      .from("course_details")
      .select("course_name")
      .eq("course_name", courseName);

    if (fetchError) {
      console.error("❌ Error fetching course details:", fetchError);
      return res
        .status(500)
        .json({ success: false, error: fetchError.message });
    }

    if (existingCourse.length > 0) {
      // ✅ Update existing course outcomes in `course_details`
      const { error: updateError } = await supabase
        .from("course_details")
        .update({
          co1_name: coDetails[0]?.name || null,
          co1_desc: coDetails[0]?.desc || null,
          co2_name: coDetails[1]?.name || null,
          co2_desc: coDetails[1]?.desc || null,
          co3_name: coDetails[2]?.name || null,
          co3_desc: coDetails[2]?.desc || null,
          co4_name: coDetails[3]?.name || null,
          co4_desc: coDetails[3]?.desc || null,
          co5_name: coDetails[4]?.name || null,
          co5_desc: coDetails[4]?.desc || null,
        })
        .eq("course_name", courseName)
        .eq("degree", degree)
        .eq("department", department);

      if (updateError) throw updateError;
    } else {
      // ✅ Insert new course outcomes in `course_details`
      const { error: insertError } = await supabase
        .from("course_details")
        .insert({
          course_name: courseName,
          course_code: courseCode,
          degree: degree,
          department: department,
          co1_name: coDetails[0]?.name || null,
          co1_desc: coDetails[0]?.desc || null,
          co2_name: coDetails[1]?.name || null,
          co2_desc: coDetails[1]?.desc || null,
          co3_name: coDetails[2]?.name || null,
          co3_desc: coDetails[2]?.desc || null,
          co4_name: coDetails[3]?.name || null,
          co4_desc: coDetails[3]?.desc || null,
          co5_name: coDetails[4]?.name || null,
          co5_desc: coDetails[4]?.desc || null,
        });

      if (insertError) throw insertError;
    }

    // ✅ Update Timings (Hours) in `timings` table
    const { data: existingTimings, error: checkError } = await supabase
      .from("timings")
      .select("course_name")
      .eq("course_name", courseName);

    if (checkError) throw checkError;

    // If the course exists in timings, update it; otherwise, insert new record
    if (existingTimings.length > 0) {
      const { error: updateTimingsError } = await supabase
        .from("timings")
        .update({
          hour1_1: hours[0]?.hour1 || null,
          hour2_1: hours[0]?.hour2 || null,
          hour1_2: hours[1]?.hour1 || null,
          hour2_2: hours[1]?.hour2 || null,
          hour1_3: hours[2]?.hour1 || null,
          hour2_3: hours[2]?.hour2 || null,
          hour1_4: hours[3]?.hour1 || null,
          hour2_4: hours[3]?.hour2 || null,
          hour1_5: hours[4]?.hour1 || null,
          hour2_5: hours[4]?.hour2 || null,
          outcome1: outcomes[0] || null,
          outcome2: outcomes[1] || null,
          outcome3: outcomes[2] || null,
          outcome4: outcomes[3] || null,
          outcome5: outcomes[4] || null,
        })
        .eq("course_name", courseName)
        .eq("degree", degree)
        .eq("department", department);

      if (updateTimingsError) throw updateTimingsError;
    } else {
      // Insert a new record
      const { error: insertTimingsError } = await supabase
        .from("timings")
        .insert({
          course_name: courseName,
          course_code: courseCode,
          degree: degree,
          department: department,
          hour1_1: hours[0]?.hour1 || null,
          hour2_1: hours[0]?.hour2 || null,
          hour1_2: hours[1]?.hour1 || null,
          hour2_2: hours[1]?.hour2 || null,
          hour1_3: hours[2]?.hour1 || null,
          hour2_3: hours[2]?.hour2 || null,
          hour1_4: hours[3]?.hour1 || null,
          hour2_4: hours[3]?.hour2 || null,
          hour1_5: hours[4]?.hour1 || null,
          hour2_5: hours[4]?.hour2 || null,
          outcome1: outcomes[0] || null,
          outcome2: outcomes[1] || null,
          outcome3: outcomes[2] || null,
          outcome4: outcomes[3] || null,
          outcome5: outcomes[4] || null,
        });

      if (insertTimingsError) throw insertTimingsError;
    }

    // ✅ Delete old textbooks and references
    await supabase
      .from("textbooks")
      .delete()
      .eq("course_name", courseName)
      .eq("degree", degree)
      .eq("department", department);
    await supabase
      .from("refs")
      .delete()
      .eq("course_name", courseName)
      .eq("degree", degree)
      .eq("department", department);

    // ✅ Insert updated textbooks
    if (Array.isArray(textbooks) && textbooks.length > 0) {
      const textbookData = textbooks.map((t) => ({
        course_name: courseName,
        course_code: courseCode,
        degree: degree,
        department: department,
        title: t.title || "Unknown Title",
        author: t.author || "Unknown Author",
        publisher: t.publisher || "N/A",
        place: t.place || "N/A",
        year: t.year || "N/A",
      }));

      if (textbookData.length > 0) {
        const { error: textbookError } = await supabase
          .from("textbooks")
          .insert(textbookData);
        if (textbookError) throw textbookError;
      }
    }

    // ✅ Insert updated references
    if (Array.isArray(references) && references.length > 0) {
      const referenceData = references.map((r) => ({
        course_name: courseName,
        course_code: courseCode,
        degree: degree,
        department: department,
        title: r.title || "Unknown Title",
        author: r.author || "Unknown Author",
        publisher: r.publisher || "N/A",
        place: r.place || "N/A",
        year: r.year || "N/A",
      }));

      if (referenceData.length > 0) {
        const { error: referenceError } = await supabase
          .from("refs")
          .insert(referenceData);
        if (referenceError) throw referenceError;
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get courses by faculty
const getCourse = async (req, res) => {
  try {
    const facultyName = req.query.facultyName;

    if (!facultyName) {
      return res.status(400).send({ message: "Faculty name is required" });
    }

    const { data, error } = await supabase
      .from("credits") // Table name
      .select(
        "course_code, course_name, lecture, tutorial, practical, credits, degree, category, department"
      ) // Fetch required fields
      .eq("faculty", facultyName);

    if (error) throw error;

    if (data.length > 0) {
      return res.status(200).send({ success: true, courses: data });
    } else {
      return res.status(404).send({
        success: false,
        message: "No courses assigned to this faculty.",
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get course details by course name
const getCourseDetails = async (req, res) => {
  try {
    const courseName = req.query.courseName; // Change courseCode to courseName
    const degree = req.query.degree;
    const department = req.query.department;

    if (!courseName) {
      return res.status(400).send({ message: "Course name is required" });
    }

    // Fetch course details

    const { data: courseDetails, error: courseDetailsError } = await supabase
      .from("course_details")
      .select(
        "co1_name, co1_desc, co2_name, co2_desc, co3_name, co3_desc, co4_name, co4_desc, co5_name, co5_desc"
      )
      .eq("course_name", courseName)
      .eq("degree", degree)
      .eq("department", department)
      .maybeSingle();
    if (courseDetailsError) throw courseDetailsError;

    if (!courseDetails) {
      return res
        .status(404)
        .send({ success: false, message: "Course details not found." });
    }

    // Fetch textbooks for the course
    const { data: textbooks, error: textbooksError } = await supabase
      .from("textbooks")
      .select("*")
      .eq("course_name", courseName)
      .eq("degree", degree)
      .eq("department", department);

    if (textbooksError) throw textbooksError;

    // Fetch references for the course
    const { data: references, error: referencesError } = await supabase
      .from("refs")
      .select("*")
      .eq("course_name", courseName)
      .eq("degree", degree)
      .eq("department", department);

    if (referencesError) throw referencesError;

    // Fetch hours from the Timings table
    const { data: timings, error: timingsError } = await supabase
      .from("timings")
      .select(
        "hour1_1, hour2_1, hour1_2, hour2_2, hour1_3, hour2_3, hour1_4, hour2_4, hour1_5, hour2_5, outcome1, outcome2, outcome3, outcome4, outcome5"
      )
      .eq("course_name", courseName)
      .eq("degree", degree)
      .eq("department", department)
      .maybeSingle();

    if (timingsError) throw timingsError;

    if (!timings) {
      return res
        .status(404)
        .send({ success: false, message: "Timings not found for the course." });
    }

    // Combine course details, textbooks, references, and hours into one response
    const courseData = {
      co: [
        { name: courseDetails.co1_name, desc: courseDetails.co1_desc },
        { name: courseDetails.co2_name, desc: courseDetails.co2_desc },
        { name: courseDetails.co3_name, desc: courseDetails.co3_desc },
        { name: courseDetails.co4_name, desc: courseDetails.co4_desc },
        { name: courseDetails.co5_name, desc: courseDetails.co5_desc },
      ],
      textbooks,
      references,
      hours: [
        { hour1: timings.hour1_1, hour2: timings.hour2_1 },
        { hour1: timings.hour1_2, hour2: timings.hour2_2 },
        { hour1: timings.hour1_3, hour2: timings.hour2_3 },
        { hour1: timings.hour1_4, hour2: timings.hour2_4 },
        { hour1: timings.hour1_5, hour2: timings.hour2_5 },
      ],
      outcomes: [
        timings.outcome1,
        timings.outcome2,
        timings.outcome3,
        timings.outcome4,
        timings.outcome5,
      ],
    };

    res.json({ success: true, courseDetails: courseData });
  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const addMapping = async (req, res) => {
  try {
    const {
      course_code,
      course_name,
      faculty,
      degree,
      department,
      mappingData,
      outcomes,
    } = req.body;

    if (
      !course_code ||
      !course_name ||
      !faculty ||
      !Array.isArray(mappingData) ||
      !outcomes
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid data in request.",
      });
    }

    const { data: existingMapping, error: fetchError } = await supabase
      .from("mapping")
      .select("id") // Adjust based on your table schema
      .eq("course_name", course_name)
      .eq("degree", degree)
      .eq("department", department);

    if (fetchError) throw fetchError;

    if (existingMapping.length > 0) {
      const { error: deleteError } = await supabase
        .from("mapping")
        .delete()
        .eq("course_name", course_name)
        .eq("degree", degree)
        .eq("department", department);

      if (deleteError) throw deleteError;
    }

    const rowsToInsert = mappingData.map((row, index) => ({
      course_code,
      course_name,
      faculty,
      degree,
      department,
      outcome: outcomes[index] || "",

      po1: parseInt(row.pos[0]) || 0,
      po2: parseInt(row.pos[1]) || 0,
      po3: parseInt(row.pos[2]) || 0,
      po4: parseInt(row.pos[3]) || 0,
      po5: parseInt(row.pos[4]) || 0,
      po6: parseInt(row.pos[5]) || 0,
      po7: parseInt(row.pos[6]) || 0,
      po8: parseInt(row.pos[7]) || 0,
      po9: parseInt(row.pos[8]) || 0,
      po10: parseInt(row.pos[9]) || 0,
      po11: parseInt(row.pos[10]) || 0,
      po12: parseInt(row.pos[11]) || 0,

      pso1: parseInt(row.pso[0]) || 0,
      pso2: parseInt(row.pso[1]) || 0,
    }));

    const { error } = await supabase.from("mapping").insert(rowsToInsert);

    if (error) throw error;

    res
      .status(200)
      .json({ success: true, message: "Mapping data saved successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllMappings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("mapping")
      .select("*")
      .order("course_code", { ascending: true });

    if (error) throw error;

    res.status(200).send({ success: true, mappings: data });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

module.exports = {
  updateCourseDetails,
  getCourse,
  getCourseDetails,
  addMapping,
  getAllMappings,
};
