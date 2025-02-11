// const supabase = require("../../supabaseClient");

// // Get semester info by semNo
// const getSemesterInfo = async (req, res) => {
//   const { semNo } = req.params;

//   try {
//     const { data, error } = await supabase
//       .from("seminfo")
//       .select("*")
//       .eq("sem_no", semNo)
//       .single();

//     if (error) throw error;

//     res.json({
//       ...data,
//       mandatory_courses: data.mandatory_courses || 0,
//     });
//   } catch (error) {
//     console.error("Error fetching semester info:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };


// // Update course details by serial_no
// const updateCourse = async (req, res) => {
//   try {
//     const { serial_no } = req.params;
//     const {
//       course_code,
//       course_name,
//       lecture,
//       tutorial,
//       practical,
//       credits,
//       ca_marks,
//       fe_marks,
//       total_marks,
//       type,
//       faculty,
//       department,
//       category,
//     } = req.body;

//     const parsedData = {
//       lecture: isNaN(lecture) || lecture === "" ? 0 : parseInt(lecture),
//       tutorial: isNaN(tutorial) || tutorial === "" ? 0 : parseInt(tutorial),
//       practical: isNaN(practical) || practical === "" ? 0 : parseInt(practical),
//       ca_marks: isNaN(ca_marks) || ca_marks === "" ? 0 : parseInt(ca_marks),
//       fe_marks: isNaN(fe_marks) || fe_marks === "" ? 0 : parseInt(fe_marks),
//       total_marks: isNaN(total_marks) || total_marks === "" ? 0 : parseInt(total_marks),
//     };

//     const { data, error } = await supabase
//       .from("credits")
//       .update({
//         course_code,
//         course_name,
//         ...parsedData,
//         credits,
//         type,
//         faculty,
//         department,
//         category,
//       })
//       .eq("serial_no", serial_no);

//     if (error) throw new Error(error.message);

//     res.status(200).json({ message: "Course updated successfully!" });
//   } catch (error) {
//     console.error("Error updating course:", error);
//     res.status(500).json({ message: "Failed to update course" });
//   }
// };

// // const updateCourse = async (req, res) => {
// //   try {
// //     const { serial_no } = req.params;
// //     const {
// //       course_code,
// //       course_name,
// //       lecture,
// //       tutorial,
// //       practical,
// //       credits,
// //       ca_marks,
// //       fe_marks,
// //       total_marks,
// //       type,
// //       faculty,
// //       department,
// //       sem_no,
// //       category
// //     } = req.body;

// //     // First check if record exists
// //     const { data: existingData } = await supabase
// //       .from("credits")
// //       .select("*")
// //       .eq("serial_no", serial_no)
// //       .eq("sem_no", sem_no)
// //       .single();

// //     const parsedData = {
// //       course_code,
// //       course_name,
// //       lecture: parseInt(lecture) || 0,
// //       tutorial: parseInt(tutorial) || 0,
// //       practical: parseInt(practical) || 0,
// //       credits: parseInt(credits) || 0,
// //       ca_marks: parseInt(ca_marks) || 0,
// //       fe_marks: parseInt(fe_marks) || 0,
// //       total_marks: parseInt(total_marks) || 0,
// //       type,
// //       faculty,
// //       department,
// //       sem_no,
// //       category,
// //       serial_no
// //     };

// //     let result;
// //     if (existingData) {
// //       // Update existing record
// //       result = await supabase
// //         .from("credits")
// //         .update(parsedData)
// //         .eq("serial_no", serial_no)
// //         .eq("sem_no", sem_no);
// //     } else {
// //       // Insert new record
// //       result = await supabase
// //         .from("credits")
// //         .insert([parsedData]);
// //     }

// //     if (result.error) throw result.error;
// //     res.status(200).json({ message: "Course updated successfully!" });
// //   } catch (error) {
// //     console.error("Error updating course:", error);
// //     res.status(500).json({ message: "Failed to update course" });
// //   }
// // };


// // Get filtered table data
// const getTableData = async (req, res) => {
//     try {
//       const { data, error } = await supabase
//         .from("credits")
//         .select(`
//           course_code,
//           course_name,
//           lecture,
//           tutorial,
//           practical,
//           credits,
//           ca_marks,
//           fe_marks,
//           total_marks,
//           type
//         `)
//         .order("sem_no");
  
//       if (error) throw error;
  
//       res.json({ success: true, data });
//     } catch (err) {
//       res.status(500).json({ success: false, error: err.message });
//     }
//   };

// // const getCourses = async (req, res) => {
// //     try {
// //       const { semNo } = req.params;
// //       const { data, error } = await supabase
// //         .from("credits")
// //         .select("*")
// //         .eq("sem_no", semNo)
// //         .order("serial_no");
  
// //       if (error) throw error;
// //       res.json(data);
// //     } catch (error) {
// //       console.error("Error fetching courses:", error);
// //       res.status(500).json({ message: "Failed to fetch courses" });
// //     }
// // };



// const getCourses = async (req, res) => {
//   try {
//     const { semNo } = req.params;
//     console.log(`Fetching courses for semester: ${semNo}`);

//     const { data, error } = await supabase
//       .from("credits")
//       .select("*")
//       .eq("sem_no", Number(semNo)) // Ensure semNo is a number
//       .order("serial_no");

//     console.log('Courses data:', data);
//     console.log('Courses error:', error);

//     if (error) throw error;
//     res.json(data);
//   } catch (error) {
//     console.error("Error fetching courses:", error);
//     res.status(500).json({ message: "Failed to fetch courses" });
//   }
// };


// module.exports = { getSemesterInfo, updateCourse, getTableData , getCourses };











const supabase = require("../../supabaseClient");

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

const updateCourse = async (req, res) => {
  try {
    const { course_code } = req.params;
    const {
      serial_no,
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
      sem_no,
      category
    } = req.body;

    const parsedData = {
      serial_no: parseInt(serial_no),
      lecture: parseInt(lecture) || 0,
      tutorial: parseInt(tutorial) || 0,
      practical: parseInt(practical) || 0,
      credits: parseInt(credits) || 0,
      ca_marks: parseInt(ca_marks) || 0,
      fe_marks: parseInt(fe_marks) || 0,
      total_marks: parseInt(total_marks) || 0,
    };

    const { data, error } = await supabase
      .from("credits")
      .upsert({
        course_code,
        course_name,
        ...parsedData,
        type,
        faculty,
        department,
        sem_no,
        category
      }, {
        onConflict: 'course_code'
      });

    if (error) throw error;
    res.status(200).json({ message: "Course updated successfully!" });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Failed to update course" });
  }
};

const getCourses = async (req, res) => {
  try {
    const { semNo } = req.params;
    const { data, error } = await supabase
      .from("credits")
      .select("*")
      .eq("sem_no", Number(semNo))
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
  getCourses
};
