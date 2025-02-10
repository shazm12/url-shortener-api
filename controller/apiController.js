import { v4 as uuidv4 } from "uuid";
import { fnv1aHash, base10ToBase62, parseUserAgent } from "../utils/utils.js";
import Url from "../models/Url.js";
import UrlClick from "../models/UrlClick.js";
import moment from "moment";

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
};

export const getShortenUrlDataAndRedirectToLongUrl = async (req, res) => {
  try {
    const { alias } = req.params;
    console.log(alias);
    const urlObj = await Url.findOne({ alias });

    if (!urlObj) {
      return res.status(404).json({ error: "URL not found" });
    }

    const userAgent = parseUserAgent(req.headers["user-agent"]);

    const urlClick = new UrlClick({
      urlId: urlObj._id,
      userIp: req.ip,
      userAgent: req.headers["user-agent"],
      os: userAgent?.os,
      device: userAgent?.device,
    });

    await urlClick.save();
    res.redirect(urlObj?.longUrl);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: err || "Internal Server Error" });
  }
};

export const getAnalyticsData = async (req, res) => {
  try {
    const { alias } = req.params;

    const url = await Url.findOne({ alias });

    if (!url) {
      return res.status(404).json({ message: "URL not found" });
    }

    const totalClicks = await UrlClick.countDocuments({ urlId: url._id });
    const uniqueUsers = await UrlClick.aggregate([
        { $match: { urlId: url._id } },
        {
          $group: {
            _id: "$userIp" 
          }
        },
        { $count: "uniqueUserCount" }
      ]);
      
    // Extract the count (aggregation returns an array)
    const uniqueUserCount = uniqueUsers[0]?.uniqueUserCount || 0;

    const sevenDaysBack = moment().subtract(7, "days").startOf("day");

    const clicksByDate = await UrlClick.aggregate([
      {
        $match: {
          urlId: url._id,
          timestamp: { $gte: sevenDaysBack.toDate() },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          clickCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const osAnalytics = await UrlClick.aggregate([
      { $match: { urlId: url._id } },
      {
        $group: {
          _id: "$os",
          uniqueClicks: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userIp" },
        },
      },
      {
        $project: {
          osName: "$_id",
          uniqueClicks: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
        },
      },
    ]);

    const deviceAnalytics = await UrlClick.aggregate([
      { $match: { urlId: url._id } },
      {
        $group: {
          _id: "$device",
          uniqueClicks: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userIp" },
        },
      },
      {
        $project: {
          deviceName: "$_id",
          uniqueClicks: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
        },
      },
    ]);

    res.status(200).json({
      totalClicks,
      uniqueUsers: uniqueUserCount,
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
