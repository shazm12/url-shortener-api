import Url from "../models/Url.js";
export const checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  // Check if the request is an API call
  if (req.originalUrl.startsWith("/api")) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }

  // Redirect to login page for non-API requests
  res.redirect("/auth/login");
};

export const checkResourceOwnership = async (req, res, next) => {
  // Assuming you have user ID in the request
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
