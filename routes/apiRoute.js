import { v4 as uuidv4 } from "uuid";
import express from "express";
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
  let alias = customAlias || base10ToBase62(numericId.toString());
  alias = alias.trim().toLowerCase();
  if (!alias) {
    return res.status(400).send({ error: "Alias generation failed!" });
  }

  try {
    // Check if the user already has an alias for this long URL
    const existingUrlForUser = await Url.findOne({
      longUrl,
      createdBy: req.user?.id || "12345",
    });

    if (existingUrlForUser) {
      return res.status(400).send({
        error: "You already have a shortened URL for this long URL!",
        existingUrl: existingUrlForUser,
      });
    }

    // Check if the alias already exists in the database
    const existingAlias = await Url.findOne({ alias });

    if (existingAlias) {
      return res.status(400).send({ error: "Alias already exists!" });
    }

    const url = new Url({
      alias: alias,
      longUrl: longUrl,
      createdAt: new Date().toUTCString(),
      createdBy: req.user?.id || "12345",
      topic: topic || "",
    });

    await url.save();
    res.status(200).send({ url });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error
      return res
        .status(400)
        .send({ error: "Alias already exists!", systemErr: err });
    }
    res.status(500).send({ error: err.message || "Internal server error" });
  }
});

router.get("/shorten/:alias", async (req, res) => {
  try {
    const { alias } = req.params;
    const urlObj = await Url.findOne({ alias });

    if (!urlObj) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    const visitorId = req.session.id || req.ip;

    res.redirect(urlObj?.longUrl);
  } catch (err) {
    res.status(500).send({ error: err });
  }
});

export default router;
