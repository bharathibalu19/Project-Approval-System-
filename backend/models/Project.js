// // // models/Project.js
// // import mongoose from "mongoose";

// // const projectSchema = new mongoose.Schema({
// //   title: { type: String, required: true },
// //   abstract: { type: String, required: true },
// //   technology: { type: String, required: true },
// //   teamMembers: { type: String, required: true },
// //   document: { type: String, required: true },
// //   student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
// //   status: {
// //     type: String,
// //     enum: ["pending","faculty-approved","approved","rejected","needs-revision"],
// //     default: "pending"
// //   },
// //   facultyReview: {
// //     action: String, comment: String, reviewedBy: String, reviewedAt: Date
// //   },
// //   adminReview: {
// //     action: String, comment: String, reviewedBy: String, reviewedAt: Date
// //   }
// // }, { timestamps: true });

// // export default mongoose.model("Project", projectSchema);
// const ProjectSchema = new mongoose.Schema({
//   title: String,
//   abstract: String,
//   technology: String,
//   teamMembers: String,
//   document: String,

//   student: {
//     _id: String,
//     name: String,
//     email: String,
//     department: String,
//     role: String
//   },

//   status: { type: String, default: "pending" },
// }, { timestamps: true });
import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    title: String,
    abstract: String,
    technology: String,
    teamMembers: String,
    document: String,

    student: {
      _id: String,
      name: String,
      email: String,
      department: String,
      role: String
    },

    status: {
      type: String,
      default: "pending"
    }
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", ProjectSchema);

export default Project;
