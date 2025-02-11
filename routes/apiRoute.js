import express from "express";
import { checkAuthenticated, checkResourceOwnership } from "../auth/authMiddleware.js";
import {
  getAnalyticsDataByAlias,
  getAnalyticsDataByTopic,
  getAnalyticsDataOverallByUserId,
  getShortenUrlDataAndRedirectToLongUrl,
  postShortenUrlData,
} from "../controller/apiController.js";

const router = express.Router();

/**
 * @openapi
 * '/api/shorten':
 *  post:
 *     tags:
 *     - API Controller
 *     summary: Post Long Url to get Shorten Url
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - longUrl
 *            properties:
 *              longUrl:
 *                type: string
 *                description: The long URL to be shortened
 *              customAlias:
 *                type: string
 *                description: (Optional) Custom alias for the shortened URL
 *              topic:
 *                type: string
 *                description: (Optional) Topic associated with the shortened URL
 *     responses:
 *      201:
 *        description: Created
 *      500:
 *        description: Server Error
 */
router.post("/shorten", checkAuthenticated, postShortenUrlData);

router.get("/shorten/:alias", getShortenUrlDataAndRedirectToLongUrl);
router.get("/analytics/overall", checkAuthenticated, getAnalyticsDataOverallByUserId);
router.get("/analytics/:alias", checkAuthenticated, checkResourceOwnership, getAnalyticsDataByAlias);
router.get("/analytics/topic/:topic", checkAuthenticated, getAnalyticsDataByTopic);


export default router;
