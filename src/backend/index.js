const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Import routes
const regulationsRoutes = require("./components/NewRegulations/NewReg.route");
const courseRoutes = require("./components/CoursePage/course.route");
const summaryRoutes = require("./components/Summary/summary.route");
const seminfoRoutes = require("./components/SemInfo/seminfo.route");
const facultyRoutes = require("./components/Faculty/faculty.route");
const professionalRoutes = require("./components/Professional/proelect.route");

// Use routes with distinct prefixes
app.use("/api/regulations", regulationsRoutes);
app.use("/api/course", courseRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/seminfo", seminfoRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/proelective",professionalRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
