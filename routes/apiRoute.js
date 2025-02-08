import { v4 as uuidv4 } from "uuid";
import express from "express";
import passport from "passport";
import { base10ToBase62, fnv1aHash } from "../utils/encoding.js";
import Url from "../models/Url.js";
import { checkAuthenticated } from "../auth/authMiddleware.js";

const router = express.Router();

router.post("/shorten", checkAuthenticated, async (req, res) => {
  const { longUrl, customAlias, topic } = req.body;

  if (!longUrl) {
    return res.status(400).send({ error: "Long URL is required!" });
  }

  const numericId = fnv1aHash(uuidv4());
  const alias = customAlias || base10ToBase62(numericId.toString());

  if (!alias) {
    return res.status(400).send({ error: "Alias generation failed!" });
  }

  const baseUrl = process.env.BASE_URL || "http://shortener.url";
  const shortUrl = `${baseUrl}/${alias}`;

  try {
    const url = new Url({
      alias,
      longUrl,
      shortUrl,
      createdAt: new Date().toUTCString(),
      createdBy: req.user?.id || "12345",
      topic: topic || "",
    });

    await url.save();
    res.status(200).send({ url });
  } catch (err) {
    res.status(500).send({ error: err });
  }
});

export default router;
