const express = require("express");
const {
  getSemesterInfo,
  updateCourse,
  getTableData,
  getCourses,
  deleteCourse,
} = require("./course.controller");

const {
  getAllSemestersData,
  exportToWord,
  courseDetailsInfo,
} = require("./course-word.controller");

const router = express.Router();

// Existing routes
router.get("/seminfo/:semNo", getSemesterInfo);
router.patch("/credits/:course_name", updateCourse);
router.get("/getTableData", getTableData);
router.get("/courses/:semNo", getCourses);
router.delete("/credits/:course_name", deleteCourse);

// New routes for CourseWord functionality
router.get("/getAllSemestersData", getAllSemestersData);
router.get("/exportToWord", exportToWord);
router.get("/courseDetailsInfo", courseDetailsInfo);

module.exports = router;
