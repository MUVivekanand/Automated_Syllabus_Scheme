const express = require("express");

const {
    insertProfessional,
    updateProfessional,
    getProfessional,


    getCoursesElectiveAll,
    getCoursesElective,
    postCoursesElective,
    putCoursesElective,
    deleteCoursesElective,
    getVerticals,
    getVertical,
    postVertical,
    putVertical,
    deleteVertical
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

router.get('/verticals', getVerticals);
router.get('/verticals/:id', getVertical);
router.post('/verticals', postVertical);
router.put('/verticals/:id', putVertical);
router.delete('/verticals/:id', deleteVertical);



module.exports = router;