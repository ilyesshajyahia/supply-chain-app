const express = require("express");
const controller = require("../controllers/public.controller");

const router = express.Router();

router.get("/qr/:qrId", controller.publicProductPage);

module.exports = router;
