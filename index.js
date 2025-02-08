import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import dotenv from "dotenv";
import "./auth/passport.js"; // Ensure ES module compatibility
import { checkAuthenticated } from "./auth/authMiddleware.js";
import authRoute from "./routes/authRoute.js";
import apiRoute from "./routes/apiRoute.js";
import connectDB from "./utils/db.js";
import helmet from "helmet";


dotenv.config();

const app = express();

// Session Middleware
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

app.use(cors());
app.use(express.json());
// Sending HTTP Headers Securely
app.use(helmet()); 
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use("/auth", authRoute);
app.use("/api", apiRoute);
app.get("/home", checkAuthenticated, (req, res) => {
  res.send(`<h1>Welcome to URL Shortener, ${req?.user?.name}!</h1> \n</p>`);
});

// DB Connection
connectDB();



const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port: ${port}`));
