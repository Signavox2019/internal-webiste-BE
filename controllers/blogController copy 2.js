// controllers/blogController.js
const asyncHandler = require("express-async-handler");
const Blog = require("../models/Blogs");
const mongoose = require("mongoose");

// ✅ Create Blog
exports.createBlog = asyncHandler(async (req, res) => {
  const {
    title,
    slug,
    metaTitle,
    metaDescription,
    metaKeywords,
    category,
    tags,
    contentBlocks,
  } = req.body;

  if (!title || !slug || !category) {
    return res.status(400).json({ message: "Title, slug, and category required" });
  }

  const blogExists = await Blog.findOne({ slug });
  if (blogExists) {
    return res.status(400).json({ message: "Slug already exists" });
  }

  const blog = await Blog.create({
    title,
    slug,
    author: req.user._id,
    metaTitle,
    metaDescription,
    metaKeywords,
    coverImage: req.file ? req.file.location : null, // ✅ S3 file URL
    category,
    tags,
    contentBlocks,
  });

  res.status(201).json(blog);
});

// ✅ Get All Blogs
exports.getBlogs = asyncHandler(async (req, res) => {
  const { category, tag, author, published, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (tag) filter.tags = { $in: [tag] };
  if (author) filter.author = author;
  if (published !== undefined) filter.published = published === "true";

  const blogs = await Blog.find(filter)
    .populate("author", "name email")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Blog.countDocuments(filter);

  res.json({ total, page, limit, blogs });
});

// ✅ Get Single Blog
exports.getBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug }).populate(
    "author",
    "name email"
  );

  if (!blog) return res.status(404).json({ message: "Blog not found" });

  res.json(blog);
});

// ✅ Update Blog
exports.updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (req.file) {
    updates.coverImage = req.file.location; // ✅ update with new S3 URL
  }

  const blog = await Blog.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!blog) return res.status(404).json({ message: "Blog not found" });

  res.json(blog);
});

// ✅ Delete Blog
exports.deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findByIdAndDelete(id);

  if (!blog) return res.status(404).json({ message: "Blog not found" });

  res.json({ message: "Blog deleted successfully" });
});

// ✅ Publish / Unpublish Blog
exports.togglePublish = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findById(id);

  if (!blog) return res.status(404).json({ message: "Blog not found" });

  blog.published = !blog.published;
  blog.publishedAt = blog.published ? new Date() : null;

  await blog.save();

  res.json(blog);
});

// ✅ Blog Stats
exports.getBlogStats = asyncHandler(async (req, res) => {
  const total = await Blog.countDocuments();
  const published = await Blog.countDocuments({ published: true });
  const drafts = await Blog.countDocuments({ published: false });
  const byCategory = await Blog.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  res.json({ total, published, drafts, byCategory });
});

// ✅ Monthly Stats
exports.getMonthlyStats = asyncHandler(async (req, res) => {
  const year = new Date().getFullYear();

  const stats = await Blog.aggregate([
    {
      $match: {
        published: true,
        publishedAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$publishedAt" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id": 1 } },
  ]);

  res.json(stats);
});

// ✅ Yearly Stats
exports.getYearlyStats = asyncHandler(async (req, res) => {
  const stats = await Blog.aggregate([
    { $match: { published: true, publishedAt: { $ne: null } } },
    {
      $group: {
        _id: { $year: "$publishedAt" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id": 1 } },
  ]);

  res.json(stats);
});
