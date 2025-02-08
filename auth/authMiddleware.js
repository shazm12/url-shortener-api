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

