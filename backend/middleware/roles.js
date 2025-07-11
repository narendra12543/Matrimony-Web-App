// Role-based access control middleware

// Middleware to check if user has required roles
export const roles = (requiredRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user && !req.admin) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // For admin routes, check if user is admin
      if (requiredRoles.includes('admin')) {
        if (!req.isAdmin || !req.admin) {
          return res.status(403).json({ error: 'Admin access required' });
        }
        return next();
      }

      // For user routes, check if user has required roles
      if (req.user) {
        // You can add role checking logic here based on your user model
        // For now, we'll allow all authenticated users
        return next();
      }

      return res.status(403).json({ error: 'Insufficient permissions' });
    } catch (error) {
      return res.status(500).json({ error: 'Role verification failed' });
    }
  };
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.isAdmin || !req.admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware to check if user is a regular user
export const requireUser = (req, res, next) => {
  if (req.isAdmin || !req.user) {
    return res.status(403).json({ error: 'User access required' });
  }
  next();
};

export default { roles, requireAdmin, requireUser };
