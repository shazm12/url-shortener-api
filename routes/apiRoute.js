import express from "express";
import { checkAuthenticated, checkResourceOwnership } from "../middleware/authMiddleware.js";
import {
  getAnalyticsDataByAlias,
  getAnalyticsDataByTopic,
  getAnalyticsDataOverallByUserId,
  getShortenUrlDataAndRedirectToLongUrl,
  postShortenUrlData,
} from "../controller/apiController.js";
import { apiLimiter } from "../middleware/limiterMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * '/api/shorten':
 *  post:
 *     tags:
 *     - URL Shortener
 *     summary: Create a new short URL
 *     description: >
 *       Create a new short URL for easy sharing of long URLs. The generated short URL can be used across communication channels, and users have the option to specify a custom alias and categorize the link under a topic.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - longUrl
 *             properties:
 *               longUrl:
 *                 type: string
 *                 description: The original URL to be shortened
 *               customAlias:
 *                 type: string
 *                 description: (Optional) A custom alias for the short URL (if not provided, a unique one will be generated)
 *               topic:
 *                 type: string
 *                 description: (Optional) A category under which the short URL is grouped (e.g., acquisition, activation, retention)
 *     responses:
 *       201:
 *         description: Short URL created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shortUrl:
 *                   type: string
 *                   description: The generated short URL
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: The timestamp indicating when the short URL was created
 *       400:
 *         description: Bad request - invalid URL or missing required parameters
 *       409:
 *         description: Conflict - custom alias already in use
 *       500:
 *         description: Server Error
 */
router.post("/shorten", checkAuthenticated, apiLimiter, postShortenUrlData);


/**
 * @openapi
 * '/api/shorten/{alias}':
 *  get:
 *     tags:
 *     - URL Shortener
 *     summary: Redirect to the original long URL using the alias
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *         description: The alias used to fetch and redirect to the original URL
 *     responses:
 *       302:
 *         description: Redirects to the original long URL
 *       404:
 *         description: Alias not found
 *       500:
 *         description: Server Error
 *     description: >
 *       Redirects the user to the original long URL based on the alias. 
 *       Logs redirect events for analytics, including timestamp, user agent, IP address, and geolocation data.
 */
router.get("/shorten/:alias", getShortenUrlDataAndRedirectToLongUrl);

/**
 * @openapi
 * '/api/analytics/overall':
 *  get:
 *     tags:
 *     - Analytics
 *     summary: Retrieve overall analytics for all short URLs created by the authenticated user
 *     description: >
 *       Provides a comprehensive view of link performance, including total URLs, clicks, unique users, clicks by date,
 *       OS types, and device types for all short URLs created by the authenticated user.
 *     responses:
 *       200:
 *         description: Overall analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUrls:
 *                   type: number
 *                   description: Total number of short URLs created by the user
 *                 totalClicks:
 *                   type: number
 *                   description: Total number of clicks across all URLs created by the user
 *                 uniqueUsers:
 *                   type: number
 *                   description: Total number of unique users who accessed any of the user's short URLs
 *                 clicksByDate:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         description: The date of the click event
 *                       totalClicks:
 *                         type: number
 *                         description: Total click counts for that date
 *                 osType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       osName:
 *                         type: string
 *                         description: The name of the operating system (e.g., Windows, macOS, Linux, iOS, Android)
 *                       uniqueClicks:
 *                         type: number
 *                         description: Number of unique clicks for that OS
 *                       uniqueUsers:
 *                         type: number
 *                         description: Number of unique users for that OS
 *                 deviceType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       deviceName:
 *                         type: string
 *                         description: The type of device used (e.g., mobile, desktop)
 *                       uniqueClicks:
 *                         type: number
 *                         description: Number of unique clicks for that device type
 *                       uniqueUsers:
 *                         type: number
 *                         description: Number of unique users for that device type
 *       401:
 *         description: Unauthorized - user authentication required
 *       500:
 *         description: Server Error
 */
router.get("/analytics/overall", checkAuthenticated, getAnalyticsDataOverallByUserId);

/**
 * @openapi
 * '/api/analytics/{alias}':
 *  get:
 *     tags:
 *     - Analytics
 *     summary: Retrieve detailed analytics for a specific short URL
 *     description: >
 *       Provides insights into the performance of a specific short URL, including total clicks, unique users, 
 *       clicks by date, operating system distribution, and device type distribution.
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *         description: The alias of the short URL for which analytics is to be retrieved
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClicks:
 *                   type: number
 *                   description: Total number of times the short URL has been accessed
 *                 uniqueUsers:
 *                   type: number
 *                   description: Number of unique users who accessed the short URL
 *                 clicksByDate:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         description: The date of the click event (recent 7 days)
 *                       clickCount:
 *                         type: number
 *                         description: Click count for that date
 *                 osType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       osName:
 *                         type: string
 *                         description: The name of the operating system (e.g., Windows, macOS, Linux, iOS, Android)
 *                       uniqueClicks:
 *                         type: number
 *                         description: Number of unique clicks for that OS
 *                       uniqueUsers:
 *                         type: number
 *                         description: Number of unique users for that OS
 *                 deviceType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       deviceName:
 *                         type: string
 *                         description: The type of device used (e.g., mobile, desktop)
 *                       uniqueClicks:
 *                         type: number
 *                         description: Number of unique clicks for that device type
 *                       uniqueUsers:
 *                         type: number
 *                         description: Number of unique users for that device type
 *       404:
 *         description: Alias not found
 *       401:
 *         description: Unauthorized - user authentication required
 *       500:
 *         description: Server Error
 */
router.get("/analytics/:alias", checkAuthenticated, checkResourceOwnership, getAnalyticsDataByAlias);

/**
 * @openapi
 * '/api/analytics/topic/{topic}':
 *  get:
 *     tags:
 *     - Analytics
 *     summary: Retrieve analytics for all short URLs grouped under a specific topic
 *     description: >
 *       Provides performance insights for all URLs under the specified topic, including total clicks, unique users,
 *       clicks by date, and detailed stats for each short URL in the topic.
 *     parameters:
 *       - in: path
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *         description: The topic for which analytics should be retrieved
 *     responses:
 *       200:
 *         description: Analytics for the specified topic retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClicks:
 *                   type: number
 *                   description: Total number of clicks across all URLs in the specified topic
 *                 uniqueUsers:
 *                   type: number
 *                   description: Number of unique users who accessed URLs in the specified topic
 *                 clicksByDate:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         description: Date of the click event
 *                       totalClicks:
 *                         type: number
 *                         description: Total click counts for all URLs on that date
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       shortUrl:
 *                         type: string
 *                         description: The generated short URL
 *                       totalClicks:
 *                         type: number
 *                         description: Total number of clicks for the short URL
 *                       uniqueUsers:
 *                         type: number
 *                         description: Number of unique users who accessed the short URL
 *       404:
 *         description: Topic not found
 *       401:
 *         description: Unauthorized - user authentication required
 *       500:
 *         description: Server Error
 */
router.get("/analytics/topic/:topic", checkAuthenticated, getAnalyticsDataByTopic);


export default router;
