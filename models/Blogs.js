const mongoose = require("mongoose");

// Content Block Schema
const ContentBlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["paragraph", "heading", "quote", "image", "code", "list", "link"],
      required: true,
    },
    content: { type: String }, // text, quote, heading, code
    url: { type: String },     // image or link
    language: { type: String }, // for code snippets (js, html, css etc.)
    order: { type: Number, required: true }, // maintain block order

    // ✅ Heading Level (only valid when type = "heading")
    level: {
      type: String,
      enum: ["h1", "h2", "h3", "h4", "h5", "h6", "h7"],
      required: function () {
        return this.type === "heading";
      },
    },
  },
  { _id: false }
);

// Blog Schema
const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, unique: true, required: true }, // SEO friendly URL
    author: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    metaTitle: { type: String, maxlength: 60 },  
    metaDescription: { type: String, maxlength: 160 }, 
    metaKeywords: [{ type: String }], 
    coverImage: { type: String }, 
    category: { type: String, required: true },
    tags: [{ type: String }],
    contentBlocks: [ContentBlockSchema], 
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", BlogSchema);
