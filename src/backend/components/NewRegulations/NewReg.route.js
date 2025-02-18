const express = require("express");
const {
  getAllCourses,
  updateCourse,
  deleteMoveCourse,
  addCourse,
  deleteCourse,
} = require("./NewReg.controller");

const router = express.Router();

router.get("/allcourses", getAllCourses);
router.put("/updatecourse/:course_code", updateCourse);
router.delete("/deletemovecourse/:course_code", deleteMoveCourse);
router.post("/addcourse", addCourse);
router.delete("/delete-course/:course_code", deleteCourse);

module.exports = router;
