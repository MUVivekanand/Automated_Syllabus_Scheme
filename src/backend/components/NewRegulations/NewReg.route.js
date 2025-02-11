const express = require("express");
const {
  getAllCourses,
  updateCourse,
  deleteCourse,
  addCourse,
} = require("./NewReg.controller");

const router = express.Router();

router.get("/allcourses", getAllCourses);
router.put("/updatecourse/:course_code", updateCourse);
router.delete("/deletecourse/:course_code", deleteCourse);
router.post("/addcourse", addCourse);

module.exports = router;
