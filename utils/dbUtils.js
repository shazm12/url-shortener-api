import Url from '../models/Url.js';
import UrlClick from "../models/UrlClick.js";
import moment from "moment";

export const getTotalClicks = async (urlId) => {
  return await UrlClick.countDocuments({ urlId: urlId });
};

export const getUniqueUsers = async (urlId) => {
  const uniqueUsers = await UrlClick.aggregate([
    { $match: { urlId: urlId } },
    {
      $group: {
        _id: "$userIp",
      },
    },
    { $count: "uniqueUserCount" },
  ]);
  return uniqueUsers[0]?.uniqueUserCount || 0;
};

export const getClicksByDate = async (urlId) => {
  const sevenDaysBack = moment().subtract(7, "days").startOf("day");

  const clicksByDateArray = await UrlClick.aggregate([
    {
      $match: {
        urlId: urlId,
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

  return clicksByDateArray;
};

export const getOsAnalyticsArray = async (urlId) => {
  const osAnalytics = await UrlClick.aggregate([
    { $match: { urlId: urlId } },
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

  return osAnalytics;
};

export const getDeviceAnalyticsArray = async (urlId) => {
  const deviceAnalytics = await UrlClick.aggregate([
    { $match: { urlId: urlId } },
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

  return deviceAnalytics;
};

export const getUrlAnalyticsDataOverallByUserId = async (userId) => {
  const userUrls = await Url.find({createdBy: userId});
  const urlIds = userUrls.map((url) => url._id);

  const allClicks = await UrlClick.find({ urlId: { $in: urlIds } });

  const totalUrls = userUrls.length;

  const totalClicks = allClicks.length;

  const uniqueUsers = new Set(allClicks.map((click) => click.userIp)).size;

  // Process clicks by date
  const clicksByDate = allClicks.reduce((acc, click) => {
    const date = click.timestamp.toISOString().split("T")[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // Transform clicksByDate into required array format
  const clicksByDateArray = Object.entries(clicksByDate).map(
    ([date, clickCount]) => ({
      date,
      clickCount,
    })
  );

  // Process OS analytics
  const osCounts = allClicks.reduce((acc, click) => {
    if (!acc[click.os]) {
      acc[click.os] = {
        uniqueClicks: 0,
        uniqueUsers: new Set(),
      };
    }

    acc[click.os].uniqueClicks++;
    acc[click.os].uniqueUsers.add(click.userIp);
    return acc;
  }, {});

  // Transform OS data into required format
  const osType = Object.entries(osCounts).map(([osName, data]) => ({
    osName,
    uniqueClicks: data.uniqueClicks,
    uniqueUsers: data.uniqueUsers.size,
  }));

  // Process device analytics
  const deviceCounts = allClicks.reduce((acc, click) => {
    // Initialize device entry if it doesn't exist
    if (!acc[click.device]) {
      acc[click.device] = {
        uniqueClicks: 0,
        uniqueUsers: new Set(),
      };
    }

    acc[click.device].uniqueClicks++;
    acc[click.device].uniqueUsers.add(click.userIp);
    return acc;
  }, {});

  // Transform device data into required format
  const deviceType = Object.entries(deviceCounts).map(([deviceName, data]) => ({
    deviceName,
    uniqueClicks: data.uniqueClicks,
    uniqueUsers: data.uniqueUsers.size,
  }));

  const urlClickAnalyticsDataOverallObj = {
    totalUrls,
    totalClicks,
    uniqueUsers,
    clicksByDate: clicksByDateArray,
    osType,
    deviceType,
  };

  return urlClickAnalyticsDataOverallObj;
};
