const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// MongoDB setup
require("dotenv").config();
dotenv.config({ path: "../.env" });

const mongoose = require("mongoose");
const MONGO_URI = process.env.MONGO_URI

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
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);

if (!supabase) {
  console.error("Failed to initialize Supabase client.");
} else {
  console.log("Supabase client initialized successfully.");
}

app.get("/api/seminfo/:semNo", async (req, res) => {
  const { semNo } = req.params;

  try {
    // Query the seminfo table based on semester number (semNo)
    const { data, error } = await supabase
      .from("seminfo")
      .select("*")
      .eq("sem_no", semNo)
      .single(); // Fetch only one record for the specific semester

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

app.post("/api/courses", async (req, res) => {
  try {
    // Extract courses from the request body
    const courses = req.body;

    // Process each course one by one (sequentially)
    for (let i = 0; i < courses.length; i++) {
      const courseData = courses[i];

      // Extract individual course data
      const { 
        sem_no, 
        course_code, 
        course_name, 
        lecture, 
        tutorial, 
        practical, 
        credits, // Use the credits from the request body
        ca_marks, 
        fe_marks, 
        total_marks, 
        type, 
        faculty, 
        department 
      } = courseData;

      const parsedLecture = isNaN(lecture) || lecture === "" ? 0 : parseInt(lecture);
      const parsedTutorial = isNaN(tutorial) || tutorial === "" ? 0 : parseInt(tutorial);
      const parsedPractical = isNaN(practical) || practical === "" ? 0 : parseInt(practical);
      const parsedCaMarks = isNaN(ca_marks) || ca_marks === "" ? 0 : parseInt(ca_marks);
      const parsedFeMarks = isNaN(fe_marks) || fe_marks === "" ? 0 : parseInt(fe_marks);
      const parsedTotalMarks = isNaN(total_marks) || total_marks === "" ? 0 : parseInt(total_marks);

      // Insert or update course in Supabase 'credits' table using upsert
      const { data, error } = await supabase
        .from("credits") // Ensure 'credits' table exists
        .upsert([{
          sem_no,
          course_code,
          course_name,
          lecture: parsedLecture,
          tutorial: parsedTutorial,
          practical: parsedPractical,
          credits, // Use the credits from the request body
          ca_marks: parsedCaMarks,
          fe_marks: parsedFeMarks,
          total_marks: parsedTotalMarks,
          type,
          faculty,
          department,
        }], {
          onConflict: ['sem_no', 'course_code'] // Ensure no conflicts on sem_no and course_code
        });

      // If there is an error inserting a course, throw it
      if (error) {
        throw new Error(error.message);
      }
    }

    // Return success message after all courses are inserted
    res.status(200).json({ message: "Courses saved successfully!" });
  } catch (error) {
    console.error("Error saving courses:", error);
    res.status(500).json({ message: "Failed to save courses" });
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

// Get a course by faculty name
app.get("/getCourse", async (req, res) => {
  try {
    const facultyName = req.query.facultyName;

    if (!facultyName) {
      return res.status(400).send({ message: "Faculty name is required" });
    }

    const { data, error } = await supabase
      .from("credits") // Use lowercase `credits`
      .select("course_name")
      .eq("faculty", facultyName);

    if (error) throw error;

    if (data.length > 0) {
      return res.status(200).send({ courseTitle: data[0].course_name });
    } else {
      return res.status(404).send({ message: "Faculty not found or no course assigned" });
    }
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

// Apply filter for the table data
app.post("/filtertable", async (req, res) => {
  try {
    const { filterSem, FilterDep } = req.body;

    if (!filterSem || !FilterDep) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    await Filter.deleteMany({});
    const newFilter = new Filter({ filterSem, FilterDep });
    await newFilter.save();

    res.status(200).json({ success: true, message: "Filter data added successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.post("/clearFilters", async (req, res) => {
  try {
    await Filter.deleteMany({});
    res.status(200).json({ success: true, message: "Filters cleared successfully" });
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

app.post('/updateSemInfo', async (req, res) => {
  const semData = req.body; // Get the data from the request body

  if (!Array.isArray(semData) || semData.length !== 8) {
    return res.status(400).json({ success: false, message: 'Invalid data format.' });
  }

  try {
    for (let i = 0; i < semData.length; i++) {
      const { semNo, theoryCourses, practicalCourses, totalCredits } = semData[i];

      // Skip if any of the required fields are empty
      if (theoryCourses === "" || practicalCourses === "" || totalCredits === "") {
        continue;
      }

      // Insert or update the semester data
      const { error } = await supabase
        .from('seminfo')
        .upsert([
          {
            sem_no: semNo,
            theory_courses: theoryCourses,
            practical_courses: practicalCourses,
            total_credits: totalCredits,
          },
        ])
        .eq('sem_no', semNo); 

      if (error) {
        console.error('Error upserting data:', error);
        throw error;
      }
    }

    res.status(200).json({ success: true, message: 'Semester information updated successfully.' });
  } catch (error) {
    console.error('Error while updating SemesterInfo:', error);
    res.status(500).json({ success: false, message: 'Failed to update semester information.' });
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


const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});