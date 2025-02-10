
import express from "express";


import { checkAuthenticated } from "../auth/authMiddleware.js";
import { getShortenUrlDataAndRedirectToLongUrl, postShortenUrlData } from "../controller/apiController.js";

const router = express.Router();

router.post("/shorten", checkAuthenticated, postShortenUrlData);

router.get("/shorten/:alias", getShortenUrlDataAndRedirectToLongUrl);

export default router;
