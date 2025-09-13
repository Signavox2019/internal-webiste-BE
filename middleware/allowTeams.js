// middleware/allowTeams.js
module.exports = function allowTeams(teams = []) {
  return (req, res, next) => {
    const employeeTeam = req.employee.team;
    if (teams.includes(employeeTeam)) {
      return next();
    }
    return res.status(403).json({ message: 'Access denied: insufficient permissions' });
  };
};
