const express = require("express");

const{
    updateSemInfo,
    getSemInfo,
} = require("./seminfo.controller")

const router = express.Router();

router.post("/updateSemInfo", updateSemInfo);

router.get("/getSemInfo", getSemInfo);


module.exports = router;