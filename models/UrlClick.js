// models/Click.js
import mongoose from "mongoose";

const UrlClickSchema = new mongoose.Schema({
  urlId: { type: mongoose.Schema.Types.ObjectId, ref: 'Url', required: true },
  userIp: { type: String, required: true },
  userAgent: { type: String, required: true },
  os: { type: String, required: true },
  device: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const UrlClick = mongoose.model('UrlClick', UrlClickSchema);

export default UrlClick;