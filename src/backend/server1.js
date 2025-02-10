const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// MongoDB setup
require("dotenv").config();
dotenv.config({ path: "../.env" });

const mongoose = require("mongoose");
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
  });

const filterSchema = new mongoose.Schema({
  filterSem: { type: Number, required: true },
  FilterDep: { type: String, required: true },
});

const Filter = mongoose.model("credits", filterSchema);

const app = express();
app.use(cors());
app.use(express.json());

const { createClient } = require("@supabase/supabase-js");
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);

if (!supabase) {
  console.error("Failed to initialize Supabase client.");
} else {
  console.log("Supabase client initialized successfully.");
}

// app.get("/api/seminfo/:semNo", async (req, res) => {
//   const { semNo } = req.params;

//   try {
//     // Query the seminfo table based on semester number (semNo)
//     const { data, error } = await supabase
//       .from("seminfo")
//       .select("*")
//       .eq("sem_no", semNo)
//       .single(); // Fetch only one record for the specific semester

//     if (error) {
//       throw error;
//     }

//     if (data) {
//       res.json(data); // Return semester data if found
//     } else {
//       res.status(404).json({ message: "Semester data not found" }); // Not found
//     }
//   } catch (error) {
//     console.error("Error fetching semester info:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });





app.get("/api/seminfo/:semNo", async (req, res) => {
  const { semNo } = req.params;

  try {
    const { data, error } = await supabase
      .from("seminfo")
      .select("*")
      .eq("sem_no", semNo)
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      res.json({
        ...data,
        mandatory_courses: data.mandatory_courses || 0
      });
    } else {
      res.status(404).json({ message: "Semester data not found" });
    }
  } catch (error) {
    console.error("Error fetching semester info:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




// app.post("/api/courses", async (req, res) => {
//   try {
//     // Extract courses from the request body
//     const courses = req.body;

//     // Process each course one by one (sequentially)
//     for (let i = 0; i < courses.length; i++) {
//       const courseData = courses[i];

//       // Extract individual course data
//       const {
//         sem_no,
//         course_code,
//         course_name,
//         lecture,
//         tutorial,
//         practical,
//         credits, // Use the credits from the request body
//         ca_marks,
//         fe_marks,
//         total_marks,
//         type,
//         faculty,
//         department
//       } = courseData;

//       const parsedLecture = isNaN(lecture) || lecture === "" ? 0 : parseInt(lecture);
//       const parsedTutorial = isNaN(tutorial) || tutorial === "" ? 0 : parseInt(tutorial);
//       const parsedPractical = isNaN(practical) || practical === "" ? 0 : parseInt(practical);
//       const parsedCaMarks = isNaN(ca_marks) || ca_marks === "" ? 0 : parseInt(ca_marks);
//       const parsedFeMarks = isNaN(fe_marks) || fe_marks === "" ? 0 : parseInt(fe_marks);
//       const parsedTotalMarks = isNaN(total_marks) || total_marks === "" ? 0 : parseInt(total_marks);

//       // Insert or update course in Supabase 'credits' table using upsert
//       const { data, error } = await supabase
//         .from("credits") // Ensure 'credits' table exists
//         .upsert([{
//           sem_no,
//           course_code,
//           course_name,
//           lecture: parsedLecture,
//           tutorial: parsedTutorial,
//           practical: parsedPractical,
//           credits, // Use the credits from the request body
//           ca_marks: parsedCaMarks,
//           fe_marks: parsedFeMarks,
//           total_marks: parsedTotalMarks,
//           type,
//           faculty,
//           department,
//         }], {
//           onConflict: ['sem_no', 'course_code'] // Ensure no conflicts on sem_no and course_code
//         });

//       // If there is an error inserting a course, throw it
//       if (error) {
//         throw new Error(error.message);
//       }
//     }

//     // Return success message after all courses are inserted
//     res.status(200).json({ message: "Courses saved successfully!" });
//   } catch (error) {
//     console.error("Error saving courses:", error);
//     res.status(500).json({ message: "Failed to save courses" });
//   }
// });

app.post("/api/updateCourses", async (req, res) => {
  try {
    console.log(req.body);
    const { data, error } = await supabase
      .from("courses")
      .upsert(req.body, { returning: "minimal" });

    if (error) {
      console.error("Error updating courses:", error);
      return res.status(500).json({ error: "Failed to update courses" });
    }

    res.status(200).json({ message: "Courses updated successfully" });
  } catch (err) {
    console.error("Error updating courses:", err);
    res.status(500).json({ error: "Failed to update courses" });
  }
});

app.post("/api/credits", async (req, res) => {
  try {
    const { totalCredits } = req.body;
    // Add your logic to handle the totalCredits data
    res.status(200).json({ message: "Credits processed successfully!" });
  } catch (error) {
    console.error("Error processing credits:", error);
    res.status(500).json({ message: "Failed to process credits" });
  }
});

// Get credits data from the `credits` table
app.get("/getCredits", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("credits") // Use lowercase `credits` since it’s case-sensitive
      .select("*"); // This will fetch all the columns from the credits table.

    if (error) {
      throw error;
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add a new row to the credits table
app.post("/addRow", async (req, res) => {
  try {
    const {
      semNo,
      caMarks,
      feMarks,
      totalMarks,
      courseCode,
      courseName,
      lecture,
      tutorial,
      practical,
      type,
      faculty,
      department,
    } = req.body;

    let credits = 0;
    if (lecture + tutorial === 4) credits = 4;
    else if (lecture + tutorial === 3) credits = 3;
    else if (practical === 4 && lecture === 0 && tutorial === 0) credits = 2;
    else if (practical === 2 && lecture === 0 && tutorial === 0) credits = 1;

    const { data, error } = await supabase
      .from("credits") // Use lowercase `credits`
      .insert([
        {
          sem_no: semNo,
          ca_marks: caMarks,
          fe_marks: feMarks,
          total_marks: totalMarks,
          course_code: courseCode,
          course_name: courseName,
          lecture,
          tutorial,
          practical,
          credits,
          type,
          faculty,
          department,
        },
      ]);

    if (error) {
      throw error;
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get filtered table data from the credits table
app.get("/getTableData", async (req, res) => {
  try {
    const latestFilter = await Filter.findOne().sort({ _id: -1 });

    let query = supabase.from("credits") // Use lowercase `credits`
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
      `);

    if (latestFilter) {
      if (latestFilter.filterSem) {
        query = query.eq("sem_no", latestFilter.filterSem);
      }
      if (latestFilter.FilterDep) {
        query = query.eq("department", latestFilter.FilterDep);
      }
    }

    const { data, error } = await query.order("sem_no");

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

//entire table:
app.get("/api/creditsSummary", async (req, res) => {
  try {
    const { data, error } = await supabase.from("credits").select(`
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
        sem_no
      `);

    if (error) {
      console.error("Error fetching data:", error);
      return res.status(500).json({ error: "Failed to fetch data" });
    }

    res.json(data);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/getTotalCredits", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("seminfo")
      .select("total_credits")
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      res.json({ total_credits: data[0].total_credits });
    } else {
      res.status(404).json({ message: "No total credits found" });
    }
  } catch (error) {
    console.error("Error fetching total credits:", error);
    res.status(500).json({ message: "Error fetching total credits" });
  }
});

// app.get("/api/creditsSummary", async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from("credits")
//       .select(`
//         course_code,
//         course_name,
//         lecture,
//         tutorial,
//         practical,
//         credits,
//         ca_marks,
//         fe_marks,
//         total_marks,
//         type,
//         sem_no
//       `)
//       .order('sem_no', { ascending: true });

//     if (error) {
//       console.error("Error fetching data:", error);
//       return res.status(500).json({ error: "Failed to fetch data" });
//     }

//     // Debug: Log unique course credits by semester and type
//     const creditDebug = {};
//     data.forEach(course => {
//       if (!creditDebug[course.type]) creditDebug[course.type] = {};
//       if (!creditDebug[course.type][course.sem_no]) creditDebug[course.type][course.sem_no] = 0;
//       creditDebug[course.type][course.sem_no] += Number(course.credits);
//     });

//     console.log("Credit Distribution Debug:", JSON.stringify(creditDebug, null, 2));

//     res.json(data);
//   } catch (err) {
//     console.error("Server error:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// app.get('/api/getTotalCredits', async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from('credits')  // Changed from 'seminfo'
//       .select('credits')
//       .then(result => ({
//         total_credits: result.data.reduce((sum, course) => sum + Number(course.credits), 0)
//       }));

//     if (error) throw error;

//     res.json(data);
//   } catch (error) {
//     console.error('Error calculating total credits:', error);
//     res.status(500).json({ message: 'Error calculating total credits' });
//   }
// });

// Apply filter for the table data
app.post("/filtertable", async (req, res) => {
  try {
    const { filterSem, FilterDep } = req.body;

    if (!filterSem || !FilterDep) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    await Filter.deleteMany({});
    const newFilter = new Filter({ filterSem, FilterDep });
    await newFilter.save();

    res
      .status(200)
      .json({ success: true, message: "Filter data added successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/clearFilters", async (req, res) => {
  try {
    await Filter.deleteMany({});
    res
      .status(200)
      .json({ success: true, message: "Filters cleared successfully" });
  } catch (error) {
    console.error("Error clearing filters:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});
// Update table data in the credits table
app.put("/updateTableData", async (req, res) => {
  try {
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
    } = req.body;

    const { data, error } = await supabase
      .from("credits") // Use lowercase `credits`
      .update({
        course_name,
        lecture,
        tutorial,
        practical,
        credits,
        ca_marks,
        fe_marks,
        total_marks,
        type,
      })
      .eq("course_code", course_code);

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// app.post('/updateSemInfo', async (req, res) => {
//   const semData = req.body; // Get the data from the request body

//   if (!Array.isArray(semData) || semData.length !== 8) {
//     return res.status(400).json({ success: false, message: 'Invalid data format.' });
//   }

//   try {
//     for (let i = 0; i < semData.length; i++) {
//       const { semNo, theoryCourses, practicalCourses } = semData[i];

//       // Skip if any of the required fields are empty
//       if (theoryCourses === "" || practicalCourses === "") {
//         continue;
//       }

//       // Insert or update the semester data
//       const { error } = await supabase
//         .from('seminfo')
//         .upsert([
//           {
//             sem_no: semNo,
//             theory_courses: theoryCourses,
//             practical_courses: practicalCourses,
//           },
//         ])
//         .eq('sem_no', semNo);

//       if (error) {
//         console.error('Error upserting data:', error);
//         throw error;
//       }
//     }

//     res.status(200).json({ success: true, message: 'Semester information updated successfully.' });
//   } catch (error) {
//     console.error('Error while updating SemesterInfo:', error);
//     res.status(500).json({ success: false, message: 'Failed to update semester information.' });
//   }
// });

// app.post('/api/updateSemInfo', async (req, res) => {
//   const { semData } = req.body;

//   try {
//     const upsertOperations = semData.map(row => ({
//       sem_no: row.sem_no,
//       theory_courses: row.theory_courses,
//       practical_courses: row.practical_courses,
//       total_credits: row.total_credits
//     }));

//     const { error } = await supabase
//       .from('seminfo')
//       .upsert(upsertOperations)
//       .select();

//     if (error) {
//       console.error('Supabase full upsert error:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to update semester information.',
//         error: error.message
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Semester information updated successfully.'
//     });

//   } catch (error) {
//     console.error('Unexpected error while updating SemesterInfo:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Unexpected error occurred.',
//       error: error.message
//     });
//   }
// });

// app.post('/api/updateCredits', async (req, res) => {
//   const { creditsData } = req.body;

//   try {
//       const { error: creditsError } = await supabase
//           .from('credits')
//           .insert(creditsData);

//       if (creditsError) {
//           console.error('Supabase credits insert error:', creditsError);
//           return res.status(500).json({
//               success: false,
//               message: 'Failed to insert credits information.',
//               error: creditsError.message
//           });
//       }

//       res.status(200).json({
//           success: true,
//           message: 'Credits information updated successfully.'
//       });
//   } catch (error) {
//       console.error('Unexpected error while updating Credits:', error);
//       res.status(500).json({
//           success: false,
//           message: 'Unexpected error occurred.',
//           error: error.message
//       });
//   }
// });

// app.post('/api/updateSemInfo', async (req, res) => {
//   const { semData } = req.body;

//   try {
//     // Process each row individually to avoid overwriting existing data
//     for (const row of semData) {
//       const updates = {};

//       if (row.theory_courses) updates.theory_courses = row.theory_courses;
//       if (row.practical_courses) updates.practical_courses = row.practical_courses;
//       if (row.total_credits) updates.total_credits = row.total_credits;

//       const { error } = await supabase
//         .from('seminfo')
//         .update(updates)
//         .eq('sem_no', row.sem_no);

//       if (error) {
//         console.error('Supabase update error:', error);
//         return res.status(500).json({
//           success: false,
//           message: 'Failed to update semester information.',
//           error: error.message,
//         });
//       }
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Semester information updated successfully.',
//     });

//   } catch (error) {
//     console.error('Unexpected error while updating SemesterInfo:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Unexpected error occurred.',
//       error: error.message,
//     });
//   }
// });

// app.post('/api/updateCredits', async (req, res) => {
//   const { creditsData } = req.body;

//   if (!creditsData || creditsData.length === 0) {
//     return res.status(200).json({
//       success: true,
//       message: 'No credits data provided. Existing data remains unchanged.',
//     });
//   }

//   try {
//     const { error } = await supabase.from('credits').insert(creditsData);

//     if (error) {
//       console.error('Supabase credits insert error:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to insert credits information.',
//         error: error.message,
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Credits information updated successfully.',
//     });
//   } catch (error) {
//     console.error('Unexpected error while updating Credits:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Unexpected error occurred.',
//       error: error.message,
//     });
//   }
// });

// app.post("/api/updateSemInfo", async (req, res) => {
//   const { semData } = req.body;

//   try {
//     // Process each row individually
//     for (const row of semData) {
//       const updates = {};

//       // Only update fields that are not null or empty
//       if (row.theory_courses !== null && row.theory_courses !== "")
//         updates.theory_courses = row.theory_courses;
//       if (row.practical_courses !== null && row.practical_courses !== "")
//         updates.practical_courses = row.practical_courses;
//       if (row.total_credits !== null && row.total_credits !== "")
//         updates.total_credits = row.total_credits;

//       // Only perform update if there are actual updates
//       if (Object.keys(updates).length > 0) {
//         const { data, error } = await supabase
//           .from("seminfo")
//           .update(updates)
//           .eq("sem_no", row.sem_no)
//           .select();

//         if (error) {
//           console.error("Supabase update error:", error);
//           return res.status(500).json({
//             success: false,
//             message: "Failed to update semester information.",
//             error: error.message,
//           });
//         }
//       }
//     }

//     res.status(200).json({
//       success: true,
//       message: "Semester information updated successfully.",
//     });
//   } catch (error) {
//     console.error("Unexpected error while updating SemesterInfo:", error);
//     res.status(500).json({
//       success: false,
//       message: "Unexpected error occurred.",
//       error: error.message,
//     });
//   }
// });

// app.post("/api/updateCredits", async (req, res) => {
//   const { creditsData } = req.body;

//   if (!creditsData || creditsData.length === 0) {
//     return res.status(200).json({
//       success: true,
//       message: "No credits data provided. Existing data remains unchanged.",
//     });
//   }

//   try {
//     // First, delete existing credits for the semesters being updated
//     const semesterNumbers = [
//       ...new Set(creditsData.map((item) => item.sem_no)),
//     ];

//     const { error: deleteError } = await supabase
//       .from("credits")
//       .delete()
//       .in("sem_no", semesterNumbers);

//     if (deleteError) {
//       console.error("Supabase delete error:", deleteError);
//       return res.status(500).json({
//         success: false,
//         message: "Failed to prepare credits information.",
//         error: deleteError.message,
//       });
//     }

//     // Modify creditsData to ensure unique serial_no across all entries
//     let globalSerialNo = 1;
//     const processedCreditsData = creditsData.flatMap((semester) => {
//       const theoryRows = Array.from(
//         { length: parseInt(semester.theory_courses) || 0 },
//         () => ({
//           sem_no: semester.sem_no,
//           category: "theory",
//           serial_no: globalSerialNo++,
//         })
//       );

//       const practicalRows = Array.from(
//         { length: parseInt(semester.practical_courses) || 0 },
//         () => ({
//           sem_no: semester.sem_no,
//           category: "practical",
//           serial_no: globalSerialNo++,
//         })
//       );

//       return [...theoryRows, ...practicalRows];
//     });

//     // Insert processed credits data
//     const { error: insertError } = await supabase
//       .from("credits")
//       .insert(processedCreditsData);

//     if (insertError) {
//       console.error("Supabase credits insert error:", insertError);
//       return res.status(500).json({
//         success: false,
//         message: "Failed to insert credits information.",
//         error: insertError.message,
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Credits information updated successfully.",
//     });
//   } catch (error) {
//     console.error("Unexpected error while updating Credits:", error);
//     res.status(500).json({
//       success: false,
//       message: "Unexpected error occurred.",
//       error: error.message,
//     });
//   }
// });




app.post("/api/updateSemInfo", async (req, res) => {
  const { semData } = req.body;

  try {
    for (const row of semData) {
      const updates = {};

      if (row.theory_courses !== null && row.theory_courses !== "")
        updates.theory_courses = row.theory_courses;
      if (row.practical_courses !== null && row.practical_courses !== "")
        updates.practical_courses = row.practical_courses;
      if (row.mandatory_courses !== null && row.mandatory_courses !== "")
        updates.mandatory_courses = row.mandatory_courses; // New update
      if (row.total_credits !== null && row.total_credits !== "")
        updates.total_credits = row.total_credits;

      if (Object.keys(updates).length > 0) {
        const { data, error } = await supabase
          .from("seminfo")
          .update(updates)
          .eq("sem_no", row.sem_no)
          .select();

        if (error) {
          console.error("Supabase update error:", error);
          return res.status(500).json({
            success: false,
            message: "Failed to update semester information.",
            error: error.message,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Semester information updated successfully.",
    });
  } catch (error) {
    console.error("Unexpected error while updating SemesterInfo:", error);
    res.status(500).json({
      success: false,
      message: "Unexpected error occurred.",
      error: error.message,
    });
  }
});


app.post("/api/updateCredits", async (req, res) => {
  const { creditsData } = req.body;

  if (!creditsData || creditsData.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No credits data provided. Existing data remains unchanged.",
    });
  }

  try {
    // First, delete existing credits for the semesters being updated
    const semesterNumbers = [...new Set(creditsData.map((item) => item.sem_no))];

    const { error: deleteError } = await supabase
      .from("credits")
      .delete()
      .in("sem_no", semesterNumbers);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return res.status(500).json({
        success: false,
        message: "Failed to prepare credits information.",
        error: deleteError.message,
      });
    }

    // Modify creditsData to ensure unique serial_no across all entries
    let globalSerialNo = 1;
    const processedCreditsData = creditsData.flatMap((semester) => {
      const theoryRows = Array.from(
        { length: parseInt(semester.theory_courses) || 0 },
        () => ({
          sem_no: semester.sem_no,
          category: "theory",
          serial_no: globalSerialNo++,
        })
      );

      const practicalRows = Array.from(
        { length: parseInt(semester.practical_courses) || 0 },
        () => ({
          sem_no: semester.sem_no,
          category: "practical",
          serial_no: globalSerialNo++,
        })
      );

      return [...theoryRows, ...practicalRows];
    });

    // Insert processed credits data
    const { error: insertError } = await supabase
      .from("credits")
      .insert(processedCreditsData);

    if (insertError) {
      console.error("Supabase credits insert error:", insertError);
      return res.status(500).json({
        success: false,
        message: "Failed to insert credits information.",
        error: insertError.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "Credits information updated successfully.",
    });
  } catch (error) {
    console.error("Unexpected error while updating Credits:", error);
    res.status(500).json({
      success: false,
      message: "Unexpected error occurred.",
      error: error.message,
    });
  }
});


app.get("/api/seminfo/:semNo", async (req, res) => {
  const { semNo } = req.params;

  try {
    const { data, error } = await supabase
      .from("seminfo")
      .select("*")
      .eq("sem_no", semNo)
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      res.json(data); // Return semester data if found
    } else {
      res.status(404).json({ message: "Semester data not found" }); // Not found
    }
  } catch (error) {
    console.error("Error fetching semester info:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// app.patch("/api/credits/:serial_no", async (req, res) => {
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
//     } = req.body;

//     const parsedLecture =
//       isNaN(lecture) || lecture === "" ? 0 : parseInt(lecture);
//     const parsedTutorial =
//       isNaN(tutorial) || tutorial === "" ? 0 : parseInt(tutorial);
//     const parsedPractical =
//       isNaN(practical) || practical === "" ? 0 : parseInt(practical);
//     const parsedCaMarks =
//       isNaN(ca_marks) || ca_marks === "" ? 0 : parseInt(ca_marks);
//     const parsedFeMarks =
//       isNaN(fe_marks) || fe_marks === "" ? 0 : parseInt(fe_marks);
//     const parsedTotalMarks =
//       isNaN(total_marks) || total_marks === "" ? 0 : parseInt(total_marks);

//     const { data, error } = await supabase
//       .from("credits")
//       .update({
//         course_code,
//         course_name,
//         lecture: parsedLecture,
//         tutorial: parsedTutorial,
//         practical: parsedPractical,
//         credits,
//         ca_marks: parsedCaMarks,
//         fe_marks: parsedFeMarks,
//         total_marks: parsedTotalMarks,
//         type,
//         faculty,
//         department,
//       })
//       .eq("serial_no", serial_no);

//     if (error) {
//       throw new Error(error.message);
//     }

//     res.status(200).json({ message: "Course updated successfully!" });
//   } catch (error) {
//     console.error("Error updating course:", error);
//     res.status(500).json({ message: "Failed to update course" });
//   }
// });




app.patch("/api/credits/:serial_no", async (req, res) => {
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
      category // Add category field to handle mandatory courses
    } = req.body;

    const parsedLecture = isNaN(lecture) || lecture === "" ? 0 : parseInt(lecture);
    const parsedTutorial = isNaN(tutorial) || tutorial === "" ? 0 : parseInt(tutorial);
    const parsedPractical = isNaN(practical) || practical === "" ? 0 : parseInt(practical);
    const parsedCaMarks = isNaN(ca_marks) || ca_marks === "" ? 0 : parseInt(ca_marks);
    const parsedFeMarks = isNaN(fe_marks) || fe_marks === "" ? 0 : parseInt(fe_marks);
    const parsedTotalMarks = isNaN(total_marks) || total_marks === "" ? 0 : parseInt(total_marks);

    const { data, error } = await supabase
      .from("credits")
      .update({
        course_code,
        course_name,
        lecture: parsedLecture,
        tutorial: parsedTutorial,
        practical: parsedPractical,
        credits,
        ca_marks: parsedCaMarks,
        fe_marks: parsedFeMarks,
        total_marks: parsedTotalMarks,
        type,
        faculty,
        department,
        category
      })
      .eq("serial_no", serial_no);

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({ message: "Course updated successfully!" });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Failed to update course" });
  }
});





app.get("/api/courses/:semNo", async (req, res) => {
  try {
    const { semNo } = req.params;
    const { data, error } = await supabase
      .from("credits")
      .select("*")
      .eq("sem_no", semNo);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

// Delete courses for a specific semester
app.delete("/api/courses/:semNo", async (req, res) => {
  try {
    const { semNo } = req.params;
    const { error } = await supabase
      .from("credits")
      .delete()
      .eq("sem_no", semNo);

    if (error) throw error;
    res.json({ message: "Courses deleted successfully" });
  } catch (error) {
    console.error("Error deleting courses:", error);
    res.status(500).json({ message: "Failed to delete courses" });
  }
});

app.post("/facultyLogin", async (req, res) => {
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
});

app.post("/updateCourseDetails", async (req, res) => {
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
});

// Get courses by faculty
app.get("/getCourse", async (req, res) => {
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
});

// Get course details by course code
app.get("/getCourseDetails", async (req, res) => {
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
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});