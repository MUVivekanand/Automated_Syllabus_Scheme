const express = require("express");
const { getCreditsSummary, getTotalCredits } = require("./summary.controller");

const router = express.Router();

router.get("/creditsSummary", getCreditsSummary);
router.get("/getTotalCredits", getTotalCredits);

module.exports = router;
