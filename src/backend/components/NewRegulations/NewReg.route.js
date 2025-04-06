const express = require("express");
const {
  getAllCourses,
  updateCourse,
  deleteMoveCourse,
  addCourse,
  deleteCourse,
  confirmRegulation,
} = require("./NewReg.controller");

const router = express.Router();

router.get("/allcourses", getAllCourses);
router.put("/updatecourse/:course_name", updateCourse);
router.delete("/deletemovecourse/:course_name", deleteMoveCourse);
router.post("/addcourse", addCourse);
router.delete("/delete-course/:course_name", deleteCourse);
router.post("/confirm-regulation",confirmRegulation);

module.exports = router;
