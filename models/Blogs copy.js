const mongoose = require("mongoose");

const ContentBlockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["paragraph", "heading", "quote", "image", "code", "list", "link"],
    required: true,
  },
  content: { type: String }, // for text, quote, heading, code
  url: { type: String },     // for image or link
  language: { type: String }, // for code snippets (js, html, css etc.)
  order: { type: Number, required: true }, // to maintain block order
}, { _id: false });

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  slug: { type: String, unique: true, required: true }, // SEO friendly URL
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  metaTitle: { type: String, maxlength: 60 },  // SEO meta title
  metaDescription: { type: String, maxlength: 160 }, // SEO meta description
  metaKeywords: [{ type: String }], // SEO keywords
  coverImage: { type: String }, // cloudinary/s3 url
  category: { type: String, required: true },
  tags: [{ type: String }],
  contentBlocks: [ContentBlockSchema], // rich content
  published: { type: Boolean, default: false },
  publishedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("Blog", BlogSchema);
