const express = require("express");
const controller = require("../controllers/health.controller");

const router = express.Router();
router.get("/", controller.health);
router.get("/details", controller.healthDetails);

module.exports = router;
