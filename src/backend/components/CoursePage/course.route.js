const express = require("express");
const {
  getSemesterInfo,
  updateCourse,
  getTableData,
  getCourses,
} = require("./course.controller");

const router = express.Router();

router.get("/seminfo/:semNo", getSemesterInfo);
router.patch("/credits/:course_code", updateCourse);
router.get("/getTableData", getTableData);
router.get("/courses/:semNo",getCourses);

module.exports = router;
