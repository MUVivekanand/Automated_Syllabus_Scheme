const express = require("express");
const router = express.Router();

const {
  facultyLogin,
  facultyRegister,
  findUser,
  verifyAnswer,
  updatePassword,
} = require("./faculty.login.controller");

const {
  updateCourseDetails,
  getCourse,
  getCourseDetails,
} = require("./faculty.controller");

router.post("/facultyLogin", facultyLogin);
router.post("/facultyRegister", facultyRegister);
router.post("/updateCourseDetails", updateCourseDetails);
router.get("/getCourse", getCourse);
router.get("/getCourseDetails", getCourseDetails);
router.post("/findUser", findUser);
router.post("/verifyAnswer", verifyAnswer);
router.post("/updatePassword", updatePassword);


module.exports = router;
