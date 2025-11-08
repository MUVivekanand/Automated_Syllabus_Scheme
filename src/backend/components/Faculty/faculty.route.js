const express = require("express");
const router = express.Router();
const {
  updateCourseDetails,
  getCourse,
  getCourseDetails,
  addMapping,
  getAllMappings,
} = require("./faculty.controller");

const {
  facultyLogin,
  facultyRegister,
  findUser,
  verifyAnswer,
  updatePassword,
} = require("./faculty.login.controller");

// Define routes
router.post("/updateCourseDetails", updateCourseDetails);
router.get("/getCourse", getCourse);
router.get("/getCourseDetails", getCourseDetails);
router.post("/addMapping", addMapping);
router.get("/getAllMappings", getAllMappings);

router.post("/findUser", findUser);
router.post("/facultyLogin", facultyLogin);
router.post("/facultyRegister", facultyRegister);
router.post("/verifyAnswer", verifyAnswer);
router.post("/updatePassword", updatePassword);


module.exports = router;
