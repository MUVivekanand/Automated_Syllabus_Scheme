const supabase = require("../../supabaseClient");

const facultyLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Fetch faculty details from Supabase
    const { data, error } = await supabase
      .from("credits") // Assuming "credits" table contains faculty details
      .select("faculty")
      .eq("faculty", username)
      .single();

    if (error || !data) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username!" });
    }

    // Check if the password is "faculty"
    if (password !== "faculty") {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password!" });
    }

    // Login successful
    res.json({ success: true, facultyName: data.faculty });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateCourseDetails = async (req, res) => {
  try {
    const { courseCode, coDetails, textbooks, references } = req.body;

    // Check if the course exists
    const { data: existingCourse, error: fetchError } = await supabase
      .from("course_details")
      .select("*")
      .eq("course_code", courseCode)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Error fetching course details:", fetchError);
      return res
        .status(500)
        .json({ success: false, error: fetchError.message });
    }

    if (!existingCourse) {
      console.warn("🚨 Course not found:", courseCode);
      return res
        .status(400)
        .json({ success: false, error: "Course not found." });
    }

    // ✅ Update Course Outcomes in `course_details`
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
      .eq("course_code", courseCode);

    if (updateError) throw updateError;

    // ✅ Delete old textbooks and references
    await supabase.from("textbooks").delete().eq("course_code", courseCode);
    await supabase.from("refs").delete().eq("course_code", courseCode);

    // ✅ Check if textbooks is an array of objects
    if (Array.isArray(textbooks) && textbooks.length > 0) {
      const textbookData = textbooks.map((t) => ({
        course_code: courseCode,
        title: t.title || "Unknown Title",
        author: t.author || "Unknown Author",
        edition: t.edition || "N/A",
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

    // ✅ Check if references is an array of objects
    if (Array.isArray(references) && references.length > 0) {
      const referenceData = references.map((r) => ({
        course_code: courseCode,
        title: r.title || "Unknown Title",
        author: r.author || "Unknown Author",
        edition: r.edition || "N/A",
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
      .select("course_code, course_name, lecture, tutorial, practical, credits") // Fetch required fields
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

// Get course details by course code
const getCourseDetails = async (req, res) => {
  try {
    const courseCode = req.query.courseCode;

    if (!courseCode) {
      return res.status(400).send({ message: "Course code is required" });
    }

    // Fetch course details
    const { data: courseDetails, error: courseDetailsError } = await supabase
      .from("course_details")
      .select(
        "co1_name, co1_desc, co2_name, co2_desc, co3_name, co3_desc, co4_name, co4_desc, co5_name, co5_desc"
      )
      .eq("course_code", courseCode)
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
      .eq("course_code", courseCode);

    if (textbooksError) throw textbooksError;

    // Fetch references for the course
    const { data: references, error: referencesError } = await supabase
      .from("refs")
      .select("*")
      .eq("course_code", courseCode);

    if (referencesError) throw referencesError;

    // Combine course details, textbooks, and references into one response
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
    };

    res.json({ success: true, courseDetails: courseData });
  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  facultyLogin,
  updateCourseDetails,
  getCourse,
  getCourseDetails,
};
