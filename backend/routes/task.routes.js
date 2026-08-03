const express = require("express");
const controller = require("../controllers/task.controller");
const validate = require("../middleware/validate.middleware");
const { single } = require("../middleware/upload.middleware");
const { writeLimiter } = require("../middleware/rateLimit.middleware");
const schemas = require("../validators/task.validator");

const router = express.Router();

router.get("/categories", controller.listCategories);

router.get("/me", controller.listMyTasks);
router.get("/feed", controller.listFeed);
router.get("/other", controller.listFeed);

router.post("/create", writeLimiter, ...single("picture"), validate(schemas.createTaskSchema), controller.createTask);

router.get("/:taskId", validate(schemas.taskIdSchema), controller.getTask);
router.put("/:taskId", writeLimiter, ...single("picture"), validate(schemas.updateTaskSchema), controller.updateTask);
router.delete("/:taskId", writeLimiter, validate(schemas.taskIdSchema), controller.deleteTask);

module.exports = router;
