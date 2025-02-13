import request from "supertest";
import app from "../index.js";
import Url from "../models/Url.js";
import redisClient from "../utils/redis.js";

// Mock your model and Redis Client
jest.mock("../models/Url.js");
jest.mock("../utils/redis.js");

describe("URL Shortener API", () => {
  beforeAll(() => {});

  afterAll(async () => {
    await redisClient.quit();
  });

  describe("POST /api/shorten", () => {
    it("should shorten a URL with a valid longUrl", async () => {
      const requestBody = {
        longUrl: "https://example.com",
      };

      Url.findOne.mockResolvedValue(null);
      Url.prototype.save = jest.fn().mockResolvedValue({
        alias: "shortAlias123",
        longUrl: "https://example.com",
        timestamp: new Date().toUTCString(),
      });

      const response = await request(app)
        .post("/api/shorten")
        .send(requestBody)
        .expect(201);

      expect(response.body).toHaveProperty("shortUrl");
      expect(response.body.shortUrl).toContain("shortAlias123");
    });

    it("should return an error when longUrl is missing", async () => {
      const response = await request(app)
        .post("/api/shorten")
        .send({})
        .expect(400);

      expect(response.body.error).toBe("Long URL is required!");
    });
  });

  describe("GET /api/shorten/:alias", () => {
    it("should redirect to the long URL if alias exists", async () => {
      Url.findOne.mockResolvedValue({
        alias: "shortAlias123",
        longUrl: "https://example.com",
      });

      redisClient.get.mockResolvedValue(null); // Mock cache miss

      const response = await request(app)
        .get("/api/shorten/shortAlias123")
        .expect(302); // Expect redirect status

      expect(response.header.location).toBe("https://example.com");
    });

    it("should return 404 if alias does not exist", async () => {
      Url.findOne.mockResolvedValue(null);
      redisClient.get.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/shorten/nonexistentAlias")
        .expect(404);

      expect(response.body.error).toBe("URL not found");
    });
  });

  describe("GET /api/analytics/:alias", () => {
    it("should return analytics data for a valid alias", async () => {
      const alias = "shortAlias123";
      Url.findOne.mockResolvedValue({ alias, _id: "123" });

      
      jest.mock("../utils/dbUtils.js", () => ({
        getTotalClicks: jest.fn().mockResolvedValue(100),
        getUniqueUsers: jest.fn().mockResolvedValue(50),
        getClicksByDate: jest.fn().mockResolvedValue([{ _id: "2025-02-14", clickCount: 10 }]),
        getOsAnalyticsArray: jest.fn().mockResolvedValue([{ os: "Windows", count: 70 }]),
        getDeviceAnalyticsArray: jest.fn().mockResolvedValue([{ device: "Mobile", count: 80 }]),
      }));

      const response = await request(app)
        .get(`/api/analytics/${alias}`)
        .expect(200);

      expect(response.body.totalClicks).toBe(100);
      expect(response.body.uniqueUsers).toBe(50);
      expect(response.body.clicksByDate).toEqual([
        { date: "2025-02-14", clickCount: 10 },
      ]);
    });

    it("should return 404 if alias does not exist", async () => {
      Url.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/analytics/nonexistentAlias")
        .expect(404);

      expect(response.body.message).toBe("URL not found");
    });
  });
});
