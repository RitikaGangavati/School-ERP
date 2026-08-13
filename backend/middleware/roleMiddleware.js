const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const roleName = req.user?.role?.roleName;

    if (!roleName) {
      return res.status(403).json({
        success: false,
        message: "User role not found",
      });
    }

    if (!allowedRoles.includes(roleName)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
      });
    }

    next();
  };
};

module.exports = {
  authorize,
};