import mongoose from "mongoose";

const UrlSchema = new mongoose.Schema({
  alias: { type: String, required: true, unique: true },
  longUrl: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  topic: { type: String, default: "" },
});

const Url = mongoose.model("Url", UrlSchema);
export default Url;