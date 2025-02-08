import mongoose from "mongoose";

const UrlSchema = new mongoose.Schema({
  longUrl: { type: String, required: true },
  shortUrl: { type: String, unique: true, required: true },
  createdAt: { type: String, required: true },
  createdBy: { type: String, required: true },
  topic: { type:String },
  alias: { type: String, unique: true, required: true}
});

const Url = mongoose.model("Url", UrlSchema);
export default Url;