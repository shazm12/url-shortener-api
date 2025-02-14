import request from "supertest";
import app from "../index.js";
import Url from "../models/Url.js";
import UrlClick from "../models/UrlClick.js";
import redisClient from "../utils/redis.js";
import * as dbUtils from "../utils/dbUtils.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


jest.mock("../models/Url.js");
jest.mock("../models/UrlClick.js");
jest.mock("../utils/redis.js");
jest.mock("../utils/dbUtils.js");


let mockToken;

describe("URL Shortener API Integration Tests", () => {
  
  beforeAll(async () => {

    mockToken = jwt.sign(
      { userId: "testuser123", email: "test@example.com" },
      process.env.JWT_SECRET || "test_secret_key",
      { expiresIn: "1h" }
    );
    

    redisClient.get.mockImplementation(() => null);
    redisClient.set.mockImplementation(() => true);
    redisClient.quit.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await redisClient.quit();

    await new Promise(resolve => setTimeout(resolve, 500));
  });

  beforeEach(() => {

    jest.clearAllMocks();
    

    dbUtils.getTotalClicks.mockResolvedValue(100);
    dbUtils.getUniqueUsers.mockResolvedValue(50);
    dbUtils.getClicksByDate.mockResolvedValue([{ _id: "2025-02-14", clickCount: 10 }]);
    dbUtils.getOsAnalyticsArray.mockResolvedValue([{ os: "Windows", count: 70 }]);
    dbUtils.getDeviceAnalyticsArray.mockResolvedValue([{ device: "Mobile", count: 80 }]);
  });

  describe("POST /api/shorten", () => {
    it("should shorten a URL with a valid longUrl", async () => {

      const requestBody = {
        longUrl: "https://example.com",
      };

      const mockUrlDoc = {
        _id: new mongoose.Types.ObjectId(),
        alias: "shortAlias123",
        longUrl: "https://example.com",
        timestamp: new Date().toISOString(),
        save: jest.fn().mockResolvedValue(true)
      };

      Url.findOne.mockResolvedValueOnce(null);
      Url.mockImplementationOnce(() => mockUrlDoc);


      const response = await request(app)
        .post("/api/shorten")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(requestBody)
        .expect(201);


      expect(response.body).toHaveProperty("shortUrl");
      expect(response.body.shortUrl).toContain("shortAlias123");
      expect(Url.prototype.save).toHaveBeenCalledTimes(1);
    });

    it("should return an error when longUrl is missing", async () => {

      const response = await request(app)
        .post("/api/shorten")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({})
        .expect(400);


      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Long URL is required!");
    });

    it("should return an existing shortUrl if the longUrl already exists", async () => {

      const existingUrl = {
        alias: "existingAlias",
        longUrl: "https://example.com/existing",
      };
      
      Url.findOne.mockResolvedValueOnce(existingUrl);


      const response = await request(app)
        .post("/api/shorten")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({ longUrl: existingUrl.longUrl })
        .expect(200);


      expect(response.body.shortUrl).toContain(existingUrl.alias);
      expect(Url.prototype.save).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/shorten/:alias", () => {
    it("should redirect to the long URL if alias exists", async () => {

      const mockUrl = {
        alias: "shortAlias123",
        longUrl: "https://example.com",
      };

      redisClient.get.mockResolvedValueOnce(null); // Cache miss
      Url.findOne.mockResolvedValueOnce(mockUrl);
      

      const mockUrlClick = {
        save: jest.fn().mockResolvedValue(true)
      };
      UrlClick.mockImplementationOnce(() => mockUrlClick);


      const response = await request(app)
        .get("/api/shorten/shortAlias123")
        .expect(302); // Expect redirect status


      expect(response.header.location).toBe("https://example.com");
      expect(redisClient.set).toHaveBeenCalledWith(
        expect.stringContaining("shortAlias123"),
        expect.any(String),
        expect.any(String),
        expect.any(Number)
      );
    });

    it("should use cached URL if available", async () => {

      redisClient.get.mockResolvedValueOnce(JSON.stringify({
        longUrl: "https://cached-example.com"
      }));


      const response = await request(app)
        .get("/api/shorten/cachedAlias")
        .expect(302);


      expect(response.header.location).toBe("https://cached-example.com");
      expect(Url.findOne).not.toHaveBeenCalled();
    });

    it("should return 404 if alias does not exist", async () => {

      redisClient.get.mockResolvedValueOnce(null);
      Url.findOne.mockResolvedValueOnce(null);


      const response = await request(app)
        .get("/api/shorten/nonexistentAlias")
        .expect(404);


      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("URL not found");
    });
  });

  describe("GET /api/analytics/:alias", () => {
    it("should return analytics data for a valid alias", async () => {

      const alias = "shortAlias123";
      const mockUrlObj = { alias, _id: new mongoose.Types.ObjectId() };
      
      Url.findOne.mockResolvedValueOnce(mockUrlObj);


      const response = await request(app)
        .get(`/api/analytics/${alias}`)
        .set("Authorization", `Bearer ${mockToken}`)
        .expect(200);


      expect(response.body).toHaveProperty("totalClicks", 100);
      expect(response.body).toHaveProperty("uniqueUsers", 50);
      expect(response.body).toHaveProperty("clicksByDate");
      expect(response.body.clicksByDate).toEqual([
        { date: "2025-02-14", clickCount: 10 },
      ]);
      expect(dbUtils.getTotalClicks).toHaveBeenCalledWith(mockUrlObj._id);
      expect(dbUtils.getUniqueUsers).toHaveBeenCalledWith(mockUrlObj._id);
    });

    it("should return 404 if alias does not exist", async () => {

      Url.findOne.mockResolvedValueOnce(null);


      const response = await request(app)
        .get("/api/analytics/nonexistentAlias")
        .set("Authorization", `Bearer ${mockToken}`)
        .expect(404);


      expect(response.body).toHaveProperty("message", "URL not found");
    });

    it("should handle errors in analytics retrieval", async () => {
      const mockUrlObj = { _id: new mongoose.Types.ObjectId(), alias: "errorAlias" };
      Url.findOne.mockResolvedValueOnce(mockUrlObj);
      dbUtils.getTotalClicks.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .get("/api/analytics/errorAlias")
        .set("Authorization", `Bearer ${mockToken}`)
        .expect(500);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Error fetching analytics");
    });
  });

  
});