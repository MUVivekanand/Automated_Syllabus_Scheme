const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// MongoDB setup
require("dotenv").config();
dotenv.config({ path: "../../.env" });

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

// Supabase setup
const { createClient } = require("@supabase/supabase-js");
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);

console.log(supabase)

if (!supabase) {
  console.error("Failed to initialize Supabase client.");
} else {
  console.log("Supabase client initialized successfully.");
}

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

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
