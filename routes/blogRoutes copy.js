// routes/blogRoutes.js
const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const upload = require("../middleware/upload");
const { protect } = require("../middleware/auth");

// CRUD
router.post("/", protect, upload.single("coverImage"), blogController.createBlog);
router.get("/", blogController.getBlogs);
router.get("/:slug", blogController.getBlog);
router.put("/:id", protect, upload.single("coverImage"), blogController.updateBlog);
router.delete("/:id", protect, blogController.deleteBlog);

// Publish / Unpublish
router.patch("/:id/toggle", protect, blogController.togglePublish);

// Stats
router.get("/stats/overview", protect, blogController.getBlogStats);
router.get("/stats/monthly", protect, blogController.getMonthlyStats);
router.get("/stats/yearly", protect, blogController.getYearlyStats);

module.exports = router;
