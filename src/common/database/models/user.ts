import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId },
  instanceLink: { type: String, required: true },
});

export default mongoose.model("User", userSchema);
