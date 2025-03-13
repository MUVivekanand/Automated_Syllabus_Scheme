const express = require("express");

const {
    insertProfessional,
    updateProfessional,
    getProfessional,
} = require("./proelect.controller");

const router = express.Router();

// Define all routes
router.get("/getproelective", getProfessional);
router.post("/postelective", insertProfessional);
router.put("/updateelective", updateProfessional);

module.exports = router;