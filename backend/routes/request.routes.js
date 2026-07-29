const express = require("express");
const controller = require("../controllers/request.controller");
const validate = require("../middleware/validate.middleware");
const { writeLimiter } = require("../middleware/rateLimit.middleware");
const schemas = require("../validators/request.validator");

const router = express.Router();

router.get("/received", controller.listReceived);
router.get("/sent", controller.listSent);

router.post("/:taskId/send", writeLimiter, validate(schemas.createRequestSchema), controller.createRequest);
router.put("/:requestId", writeLimiter, validate(schemas.updateRequestSchema), controller.updateStatus);

module.exports = router;
