const express = require("express");
const {
  getAllCourses,
  updateCourse,
  deleteCourse,
  addCourse,
} = require("./NewReg.controller");

const router = express.Router();

router.get("/allcourses", getAllCourses);
router.put("/updatecourse/:serial_no", updateCourse);
router.delete("/deletecourse/:serial_no", deleteCourse);
router.post("/addcourse", addCourse);

module.exports = router;
