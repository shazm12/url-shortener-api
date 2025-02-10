import express from "express";
import { checkAuthenticated } from "../auth/authMiddleware.js";
import {
  getAnalyticsData,
  getShortenUrlDataAndRedirectToLongUrl,
  postShortenUrlData,
} from "../controller/apiController.js";

const router = express.Router();

router.post("/shorten", checkAuthenticated, postShortenUrlData);

router.get("/shorten/:alias", getShortenUrlDataAndRedirectToLongUrl);
router.get("/shorten/:alias", getShortenUrlDataAndRedirectToLongUrl);
router.get("/analytics/:alias", checkAuthenticated, getAnalyticsData);

export default router;
