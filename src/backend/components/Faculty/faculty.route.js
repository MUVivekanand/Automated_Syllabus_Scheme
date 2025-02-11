const express = require("express");
const router = express.Router();
const {
  facultyLogin,
  updateCourseDetails,
  getCourse,
  getCourseDetails,
} = require("./faculty.controller");

// Define routes
router.post("/facultyLogin", facultyLogin);
router.post("/updateCourseDetails", updateCourseDetails);
router.get("/getCourse", getCourse);
router.get("/getCourseDetails", getCourseDetails);

module.exports = router;
