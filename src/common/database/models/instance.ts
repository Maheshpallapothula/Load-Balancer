import mongoose from "mongoose";

const instanceSchema = new mongoose.Schema({
  link: { type: String, required: true, unique: true },
  eventId: { type: mongoose.Schema.Types.ObjectId },
  isActive: { type: Boolean, default: true },
  assignedUsers: [{ type: String }],
});

export default mongoose.model("Instance", instanceSchema);
