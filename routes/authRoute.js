import express from "express";
import passport from "passport";
import { authLimiter } from "../middleware/limiterMiddleware.js";

const router = express.Router();

router.get(
  "/google",
  authLimiter,
  passport.authenticate("google", { scope: ["email", "profile"] })
);


/**
 * @openapi
 * '/login':
 *  get:
 *     tags:
 *     - Authentication
 *     summary: Redirect to Google authentication
 *     description: >
 *       Initiates Google Sign-In by redirecting the user to the Google authentication endpoint. This route is the first step in the OAuth 2.0 login flow.
 *     responses:
 *       302:
 *         description: Redirects to Google authentication URL
 *       500:
 *         description: Server Error
 */

// Redirect /login to Google authentication
router.get("/login", authLimiter, (req, res) => {
  res.redirect("/auth/google");
});

router.get(
  "/google/callback",
  passport.authenticate("google", { successRedirect: "/home" }),
  (req, res) => {
    res.json({ token: req.user.token });
  }
);


/**
 * @openapi
 * '/logout':
 *  get:
 *     tags:
 *     - Authentication
 *     summary: Log out the user
 *     description: >
 *       Logs out the authenticated user by ending their session, clearing session cookies, and destroying the session data.
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message for successful logout
 *                   example: "Logged out successfully"
 *       500:
 *         description: Server error during logout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message indicating logout failure
 *                   example: "Logout failed"
 */
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    req.session.destroy(() => {
      res.clearCookie("connect.sid"); // Clear session cookie
      res.json({ message: "Logged out successfully" });
    });
  });
});

export default router;
