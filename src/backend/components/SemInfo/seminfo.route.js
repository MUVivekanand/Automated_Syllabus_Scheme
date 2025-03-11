const express = require("express");

const{
    updateSemInfo,
    updateCredits,
    getSemInfo,
} = require("./seminfo.controller")

const router = express.Router();

router.post("/updateSemInfo", updateSemInfo);
router.post("/updateCredits", updateCredits);

router.get("/getSemInfo", getSemInfo);


module.exports = router;