module.exports = function allowTeams(teams = []) {
  return (req, res, next) => {
    const employeeTeam = req.user.team; // ✅ use req.user instead of req.employee
    if (teams.includes(employeeTeam)) {
      return next();
    }
    return res.status(403).json({ message: 'Access denied: insufficient permissions' });
  };
};
