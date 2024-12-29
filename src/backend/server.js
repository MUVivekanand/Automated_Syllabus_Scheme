const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const dotenv = require('dotenv');

//mongo db for filtering:

const mongoose=require("mongoose");

const MONGO_URI=process.env.MONGO_URI

mongoose
  .connect(
    MONGO_URI,
  )
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

const Filter =mongoose.model("credits",filterSchema)

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

//mysql connection:
const MYSQL_PASSWORD=process.env.MYSQL_PASSWORD

// MySQL connection setup
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.MYSQL_PASSWORD,
  database: "finai",
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
    process.exit(1); 
  } else {
    console.log("Connected to the MySQL database");
  }
});


app.post("/addRow", (req, res) => {
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

  if (lecture + tutorial === 4) {
    credits = 4;
  } else if (lecture + tutorial === 3) {
    credits = 3;
  } else if (practical === 4 && lecture === 0 && tutorial === 0) {
    credits = 2;
  } else if (practical === 2 && lecture === 0 && tutorial === 0) {
    credits = 1;
  }

  console.log('Calculated credits:', credits);

  const query = `
    INSERT INTO creditssem (
      sem_no, ca_marks, fe_marks, total_marks,
      course_code, course_name, lecture, tutorial,
      practical, credits, type, faculty, department
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  values=[
    semNo,
    caMarks,
    feMarks,
    totalMarks,
    courseCode,
    courseName,
    lecture,
    tutorial,
    practical,
    credits,
    type,
    faculty,
    department,
  ]

  connection.query(query, values, (err, results) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
      return;
    }
    res.json({ success: true, id: results.insertId });
  });
});

app.get("/getTableData", async (req, res) => {
  try {
    const latestFilter = await Filter.findOne().sort({ _id: -1 });

    let query = `SELECT course_code, course_name, lecture, tutorial, practical, credits,
                ca_marks, fe_marks, total_marks, type FROM creditssem`;

    let conditions = [];

    if (latestFilter) {
      if (latestFilter.filterSem) {
        conditions.push(`sem_no = ${latestFilter.filterSem}`);
      }
      if (latestFilter.FilterDep) {
        conditions.push(`department = '${latestFilter.FilterDep}'`);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
    }

    query += " ORDER BY sem_no";

    connection.query(query, (err, results) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
        return;
      }

      res.json({ success: true, data: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


app.post("/filtertable", async (req, res) => {
  try {
    console.log(req.body);

    const { filterSem, FilterDep } = req.body;

    if (!filterSem || !FilterDep) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    await Filter.deleteMany({});
    
    const newFilter = new Filter({ filterSem, FilterDep });
    await newFilter.save();

    res.status(200).json({ success: true, message: "Filter data added successfully" });
  } catch (error) {
    console.error("Error saving filter data:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
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

app.put("/updateTableData", (req, res) => {
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

  const query = `UPDATE creditssem SET 
                  course_name = ?, 
                  lecture = ?, 
                  tutorial = ?, 
                  practical = ?, 
                  credits = ?, 
                  ca_marks = ?, 
                  fe_marks = ?, 
                  total_marks = ?, 
                  type = ? 
                  WHERE course_code = ?`;

  connection.query(
    query,
    [
      course_name,
      lecture,
      tutorial,
      practical,
      credits,
      ca_marks,
      fe_marks,
      total_marks,
      type,
      course_code,
    ],
    (err, result) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
        return;
      }
      res.json({ success: true, message: "Row updated successfully" });
    }
  );
});


const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});