import Url from "../models/Url.js";
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

export const getUrlAnalyticsDataByTopic = async (topic, userId) => {
  const topicUrls = await Url.find({ topic: topic, createdBy: userId });
  if (!topicUrls.length) {
    return {
      totalUrls: 0,
      totalClicks: 0,
      uniqueUsers: 0,
      clicksByDate: [],
      urls: [],
    };
  }

  const urlsById = topicUrls.reduce((map, url) => {
    map[url._id] = url;
    return map;
  }, {});

  const urlIds = topicUrls.map((url) => url._id);
  const allClicks = await UrlClick.find({ urlId: { $in: urlIds } });

  const totalUrls = topicUrls.length;
  const totalClicks = allClicks.length;
  const uniqueUsers = new Set(allClicks.map((click) => click.userIp)).size;

  // Process clicks by date
  const clicksByDate = allClicks.reduce((acc, click) => {
    const date = click.timestamp.toISOString().split("T")[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const clicksByDateArray = Object.entries(clicksByDate).map(
    ([date, clickCount]) => ({
      date,
      clickCount,
    })
  );

  const shortUrlHostName = process.env.SHORT_URL_HOSTNAME;
  if (!shortUrlHostName) {
    throw new Error("SHORT_URL_HOSTNAME environment variable is not set");
  }


  const urlsClicksObj = allClicks.reduce((acc, click) => {
    const urlObj = urlsById[click.urlId];
    if (!urlObj) {
      console.error(`No URL found for urlId: ${click.urlId}`);
      return acc;
    }

    const url = `${shortUrlHostName}/${urlObj.alias}`;
    if (!acc[url]) {
      acc[url] = {
        totalClicks: 0,
        uniqueUsers: new Set(),
        urlId: click.urlId,
        alias: urlObj.alias,
      };
    }

    acc[url].totalClicks++;
    acc[url].uniqueUsers.add(click.userIp);
    return acc;
  }, {});

  const urlsArrayFinal = Object.entries(urlsClicksObj).map(
    ([shortUrl, data]) => ({
      shortUrl,
      totalClicks: data.totalClicks,
      uniqueUsers: data.uniqueUsers.size,
    })
  );

  return {
    totalUrls,
    totalClicks,
    uniqueUsers,
    clicksByDate: clicksByDateArray,
    urls: urlsArrayFinal,
  };
};

export const getUrlAnalyticsDataOverallByUserId = async (userId) => {
  const userUrls = await Url.find({ createdBy: userId });
  const urlIds = userUrls.map((url) => url._id);

  const allClicks = await UrlClick.find({ urlId: { $in: urlIds } });

  const totalUrls = userUrls.length;

  const totalClicks = allClicks.length;

  const uniqueUsers = new Set(allClicks.map((click) => click.userIp)).size;

  const clicksByDate = allClicks.reduce((acc, click) => {
    const date = click.timestamp.toISOString().split("T")[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const clicksByDateArray = Object.entries(clicksByDate).map(
    ([date, clickCount]) => ({
      date,
      clickCount,
    })
  );

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

  const osType = Object.entries(osCounts).map(([osName, data]) => ({
    osName,
    uniqueClicks: data.uniqueClicks,
    uniqueUsers: data.uniqueUsers.size,
  }));

  const deviceCounts = allClicks.reduce((acc, click) => {
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

  const deviceType = Object.entries(deviceCounts).map(([deviceName, data]) => ({
    deviceName,
    uniqueClicks: data.uniqueClicks,
    uniqueUsers: data.uniqueUsers.size,
  }));

  return {
    totalUrls,
    totalClicks,
    uniqueUsers,
    clicksByDate: clicksByDateArray,
    osType,
    deviceType,
  };
};
