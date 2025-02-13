import { v4 as uuidv4 } from "uuid";
import {
  fnv1aHash,
  base10ToBase62,
  parseUserAgent,
  getshortUrlHostName,
} from "../utils/utils.js";
import Url from "../models/Url.js";
import UrlClick from "../models/UrlClick.js";
import {
  getUrlAnalyticsDataOverallByUserId,
  getClicksByDate,
  getDeviceAnalyticsArray,
  getOsAnalyticsArray,
  getTotalClicks,
  getUniqueUsers,
  getUrlAnalyticsDataByTopic,
} from "../utils/dbUtils.js";
import geoip from"geoip-lite";
import redisClient from "../utils/redis.js";
import { CACHE_EXPIRATION } from "../utils/constants.js";

export const postShortenUrlData = async (req, res) => {
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
      timestamp: new Date().toUTCString(),
      createdBy: req.user?.id || "",
      topic: topic || "",
    });

    await url.save();
    res.status(201).send({
      shortUrl: `${getshortUrlHostName(req)}/api/shorten/${alias}`,
      createdAt: url.timestamp,
    });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error
      return res.status(400).send({ error: "Alias already exists!" });
    }
    res
      .status(500)
      .send({ error: "Failed to create Url Data", message: err.message });
  }
};

export const getShortenUrlDataAndRedirectToLongUrl = async (req, res) => {
  try {
    const { alias } = req.params;
    
    const cachedUrl = await redisClient.get(`url:${alias}`);
    let urlObj;

    if (cachedUrl) {
      urlObj = JSON.parse(cachedUrl);
    } else {
      urlObj = await Url.findOne({ alias });
      
      if (!urlObj) {
        return res.status(404).json({ error: "URL not found" });
      }
      
      await redisClient.setEx(
        `url:${alias}`,
        CACHE_EXPIRATION,
        JSON.stringify(urlObj)
      );
    }


    const userAgent = parseUserAgent(req.headers["user-agent"]);
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const geoData = geoip.lookup(ip);

    // Store analytics asynchronously to not block the redirect
    const urlClick = new UrlClick({
      urlId: urlObj._id,
      userIp: req.ip,
      userAgent: req.headers["user-agent"],
      os: userAgent?.os,
      device: userAgent?.device,
      country: geoData?.country || "",
      city: geoData?.city || "",
    });

    // Not awaiting this to speed up response time and let this happen in background
    urlClick.save().catch(err => console.error('Error saving click analytics:', err));
    res.redirect(urlObj?.longUrl);

  } catch (err) {
    console.error('Error in URL redirect:', err);
    res.status(500).send({ 
      error: "Failed to get Url Data", 
      message: err.message 
    });
  }
};

export const getAnalyticsDataByAlias = async (req, res) => {
  try {
    const { alias } = req.params;
    const url = await Url.findOne({ alias });

    if (!url) {
      return res.status(404).json({ message: "URL not found" });
    }

    const totalClicks = await getTotalClicks(url._id);
    const uniqueUsers = await getUniqueUsers(url._id);
    const clicksByDate = await getClicksByDate(url._id);
    const osAnalytics = await getOsAnalyticsArray(url._id);
    const deviceAnalytics = await getDeviceAnalyticsArray(url._id);

    res.status(200).json({
      totalClicks,
      uniqueUsers,
      clicksByDate: clicksByDate.map((item) => ({
        date: item._id,
        clickCount: item.clickCount,
      })),
      osType: osAnalytics,
      deviceType: deviceAnalytics,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving analytics", error: err.message });
  }
};

export const getAnalyticsDataOverallByUserId = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId || userId === "") {
      res.status(401).json({ error: "Unauthorized! Please Log in" });
    }
    const analyticsDataOverallById = await getUrlAnalyticsDataOverallByUserId(
      userId
    );
    res.status(200).json(analyticsDataOverallById);
  } catch (err) {
    console.error("Analytics Endpoint Error:", err);
    res.status(500).json({
      error: "Failed to retrieve overall analytics",
      details: err.message,
    });
  }
};

export const getAnalyticsDataByTopic = async (req, res) => {
  try {
    const { topic } = req.params;
    const userId = req.user?._id;
    if (!topic || topic === "") {
      res.status(400).json({ error: "Topic not provided" });
    }
    if (!userId || userId === "") {
      res.status(401).json({ error: "Unauthorized! Please Log in" });
    }

    const shortUrlHostname = getshortUrlHostName(req);
    const analyticsDataByTopic = await getUrlAnalyticsDataByTopic(
      topic,
      userId,
      shortUrlHostname
    );
    res.status(200).json(analyticsDataByTopic);
  } catch (err) {
    console.error("Analytics Endpoint Error:", err);
    res.status(500).json({
      error: "Failed to retrieve overall analytics",
      details: err.message,
    });
  }
};
