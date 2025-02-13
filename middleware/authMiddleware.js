import Url from "../models/Url.js";
export const checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  if (req.originalUrl.startsWith("/api")) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }
  res.redirect("/auth/login");
};

export const checkResourceOwnership = async (req, res, next) => {
  const currentUserId = req.user._id;
  const { alias } = req.params;
  try {
    const resource = await Url.findOne({ alias });

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (resource.createdBy.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        error: "You don't have permission to access this resource",
      });
    }

    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err || "Internal Server error" });
  }
};
