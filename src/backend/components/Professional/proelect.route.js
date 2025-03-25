const express = require("express");

const {
    insertProfessional,
    updateProfessional,
    getProfessional,


    getCoursesElectiveAll,
    getCoursesElective,
    postCoursesElective,
    putCoursesElective,
    deleteCoursesElective
} = require("./proelect.controller");

const router = express.Router();

// Define all routes
router.get("/getproelective", getProfessional);
router.post("/postelective", insertProfessional);
router.put("/updateelective", updateProfessional);

router.get("/courses", getCoursesElectiveAll);
router.get("/courses/:code", getCoursesElective);
router.post("/courses", postCoursesElective);
router.put("/courses/:code", putCoursesElective);
router.delete("/courses/:code", deleteCoursesElective);



module.exports = router;