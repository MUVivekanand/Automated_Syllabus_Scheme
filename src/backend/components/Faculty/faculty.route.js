const express = require("express");
const router = express.Router();
const {
  facultyLogin,
  updateCourseDetails,
  getCourse,
  getCourseDetails,
  addMapping,
  getAllMappings,
} = require("./faculty.controller");

// Define routes
router.post("/facultyLogin", facultyLogin);
router.post("/updateCourseDetails", updateCourseDetails);
router.get("/getCourse", getCourse);
router.get("/getCourseDetails", getCourseDetails);
router.post("/addMapping", addMapping);
router.get("/getAllMappings", getAllMappings);

module.exports = router;
