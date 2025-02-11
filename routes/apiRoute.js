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

router.post("/shorten", checkAuthenticated, postShortenUrlData);

router.get("/shorten/:alias", getShortenUrlDataAndRedirectToLongUrl);
router.get("/analytics/overall", checkAuthenticated, getAnalyticsDataOverallByUserId);
router.get("/analytics/:alias", checkAuthenticated, checkResourceOwnership, getAnalyticsDataByAlias);
router.get("/analytics/topic/:topic", checkAuthenticated, getAnalyticsDataByTopic);


export default router;
