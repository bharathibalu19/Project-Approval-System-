// routes/projectRoutes.js
import express from "express";
import Project from "../models/Project.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// submit (student)
router.post("/", protect, async (req, res) => {
  try {
    const { title, abstract, technology, teamMembers, document } = req.body;
    const project = await Project.create({
      title, abstract, technology, teamMembers, document, student: req.user._id
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// get projects (role-aware)
// admin -> all, faculty -> pending + faculty-approved, student -> own
router.get("/", protect, async (req, res) => {
  try {
    let projects;
    if (req.user.role === "admin") {
      projects = await Project.find().populate("student", "name email");
    } else if (req.user.role === "faculty") {
      projects = await Project.find({ status: { $in: ["pending","faculty-approved"] } }).populate("student", "name email");
    } else {
      projects = await Project.find({ student: req.user._id }).populate("student", "name email");
    }
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// review
router.put("/:id/review", protect, async (req, res) => {
  try {
    const { action, comment } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (req.user.role === "faculty") {
      project.facultyReview = { action, comment, reviewedBy: req.user.name, reviewedAt: new Date() };
      project.status = action === "approved" ? "faculty-approved" : "rejected";
    } else if (req.user.role === "admin") {
      project.adminReview = { action, comment, reviewedBy: req.user.name, reviewedAt: new Date() };
      if (action === "approved" && project.status === "faculty-approved") project.status = "approved";
      else if (action === "revision") project.status = "needs-revision";
      else if (action === "rejected") project.status = "rejected";
    } else {
      return res.status(403).json({ message: "Not allowed to review" });
    }

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
