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
    const { courseName, coDetails, hours, textbooks, references, outcomes } =
      req.body;

    // Check if the course exists
    const { data: existingCourse, error: fetchError } = await supabase
      .from("course_details")
      .select("*")
      .eq("course_name", courseName)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Error fetching course details:", fetchError);
      return res
        .status(500)
        .json({ success: false, error: fetchError.message });
    }

    // ✅ Update Course Outcomes in `course_details`
    const { error: updateError } = await supabase
      .from("course_details")
      .upsert({
        course_name: courseName, // Ensure course_name is included in the upsert
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
      .eq("course_name", courseName);

    if (updateError) throw updateError;

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
        .eq("course_name", courseName);

      if (updateTimingsError) throw updateTimingsError;
    } else {
      // Insert a new record
      const { error: insertTimingsError } = await supabase
        .from("timings")
        .insert({
          course_name: courseName,
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
    await supabase.from("textbooks").delete().eq("course_name", courseName);
    await supabase.from("refs").delete().eq("course_name", courseName);

    // ✅ Insert updated textbooks
    if (Array.isArray(textbooks) && textbooks.length > 0) {
      const textbookData = textbooks.map((t) => ({
        course_name: courseName,
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

    // ✅ Insert updated references
    if (Array.isArray(references) && references.length > 0) {
      const referenceData = references.map((r) => ({
        course_name: courseName,
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

// Get course details by course name
const getCourseDetails = async (req, res) => {
  try {
    const courseName = req.query.courseName; // Change courseCode to courseName

    if (!courseName) {
      return res.status(400).send({ message: "Course name is required" });
    }

    // Fetch course details
    const { data: courseDetails, error: courseDetailsError } = await supabase
      .from("course_details")
      .select(
        "co1_name, co1_desc, co2_name, co2_desc, co3_name, co3_desc, co4_name, co4_desc, co5_name, co5_desc"
      )
      .eq("course_name", courseName) // Use course_name instead of course_code
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
      .eq("course_name", courseName); // Use course_name

    if (textbooksError) throw textbooksError;

    // Fetch references for the course
    const { data: references, error: referencesError } = await supabase
      .from("refs")
      .select("*")
      .eq("course_name", courseName); // Use course_name

    if (referencesError) throw referencesError;

    // Fetch hours from the Timings table
    const { data: timings, error: timingsError } = await supabase
      .from("timings")
      .select(
        "hour1_1, hour2_1, hour1_2, hour2_2, hour1_3, hour2_3, hour1_4, hour2_4, hour1_5, hour2_5, outcome1, outcome2, outcome3, outcome4, outcome5"
      )
      .eq("course_name", courseName) // Use course_name
      .maybeSingle();

    if (timingsError) throw timingsError;

    if (!timings) {
      return res
        .status(404)
        .send({ success: false, message: "Timings not found for the course." });
    }
    console.log("Fetched Timings Data:", timings);

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

module.exports = {
  facultyLogin,
  updateCourseDetails,
  getCourse,
  getCourseDetails,
};
