import express from "express";
import passport from "passport";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

// Redirect /login to Google authentication
router.get("/login", (req, res) => {
  res.redirect("/auth/google");
});

router.get(
  "/google/callback",
  passport.authenticate("google", { successRedirect: "/home" }),
  (req, res) => {
    res.json({ token: req.user.token });
  }
);

router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    req.session.destroy(() => {
      res.clearCookie("connect.sid"); // Clear session cookie
      res.json({ message: "Logged out successfully" });
    });
  });
});

export default router;
