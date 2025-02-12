// models/Click.js
import mongoose from "mongoose";

const UrlClickSchema = new mongoose.Schema({
  urlId: { type: mongoose.Schema.Types.ObjectId, ref: 'Url', required: true },
  userIp: { type: String, required: true },
  userAgent: { type: String, required: true },
  os: { type: String },
  device: { type: String },
  timestamp: { type: Date, default: Date.now },
  country: { type: String },
  city: { type: String }
});

const UrlClick = mongoose.model('UrlClick', UrlClickSchema);

export default UrlClick;