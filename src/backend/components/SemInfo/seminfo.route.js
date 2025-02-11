const express = require("express");

const{
    updateSemInfo,
    updateCredits,
} = require("./seminfo.controller")

const router = express.Router();

router.post("/updateSemInfo", updateSemInfo);
router.post("/updateCredits", updateCredits);

module.exports = router;