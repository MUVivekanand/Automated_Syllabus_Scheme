const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const dotenv = require('dotenv');

//mongo db for filtering:

require('dotenv').config();

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

//mysql pool:
const MYSQL_PASSWORD=process.env.MYSQL_PASSWORD

// MySQL pool setup
const pool = mysql.createPool({
  host: process.env.host, 
  user: process.env.user,          // Your MySQL username
  password: process.env.password,      // Your MySQL password
  database: process.env.database,          
  waitForpools: true,
  poolLimit: 10,
  queueLimit: 0
});

// Connect to the database
// pool.connect((err) => {
//   if (err) {
//     console.error("Error connecting to the database:", err.message);
//     process.exit(1); 
//   } else {
//     console.log("Connected to the MySQL database");
//   }
// });

pool.query('SELECT 1 + 1 AS solution', (err, results) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
    process.exit(1); // Exit the process if the connection fails
  } else {
    console.log("Connected to the MySQL Heliohost database. The result of 1 + 1 is:", results[0].solution);
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
    INSERT INTO Credits (
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

  pool.query(query, values, (err, results) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
      return;
    }
    res.json({ success: true, id: results.insertId });
  });
});

app.get("/getCourse", async (req, res) => {
  const facultyName = req.query.facultyName;

  if (!facultyName) {
    return res.status(400).send({ message: "Faculty name is required" });
  }

  console.log("Received faculty name:", facultyName);

  const query = `SELECT course_name FROM Credits WHERE faculty = ?`;

  pool.query(query, [facultyName], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send({ message: "Error fetching data from the database" });
    }

    console.log("Query results:", results);

    if (results.length > 0) {
      return res.status(200).send({ courseTitle: results[0].course_name });
    } else {
      return res.status(404).send({ message: "Faculty not found or no course assigned" });
    }
  });
});

app.get("/getTableData", async (req, res) => {
  try {
    const latestFilter = await Filter.findOne().sort({ _id: -1 });

    let query = `SELECT course_code, course_name, lecture, tutorial, practical, credits,
                ca_marks, fe_marks, total_marks, type FROM Credits`;

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

    pool.query(query, (err, results) => {
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

  const query = `UPDATE Credits SET 
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

  pool.query(
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