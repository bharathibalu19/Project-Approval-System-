export const submitProject = async (req, res) => {
  try {
    const student = req.user;  // logged-in student from token

    const project = await Project.create({
      ...req.body,
      status: "pending",
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        department: student.department,
        role: student.role
      }
    });

    res.json(project);

  } catch (err) {
    res.status(500).json({ error: true, message: "Failed to submit project" });
  }
};
