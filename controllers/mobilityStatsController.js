const Project = require('../models/Project');
const ProjectApplication = require('../models/ProjectApplication');
// const Employee = require('../models/Employee')

// exports.getMobilityStats = async (req, res) => {
//   try {
//     const totalProjects = await Project.countDocuments();
//     const openProjects = await Project.countDocuments({ status: 'open' });
//     const closedProjects = await Project.countDocuments({ status: 'closed' });

//     const totalApplications = await ProjectApplication.countDocuments();
//     const pending = await ProjectApplication.countDocuments({ status: 'pending' });
//     const approved = await ProjectApplication.countDocuments({ status: 'approved' });
//     const rejected = await ProjectApplication.countDocuments({ status: 'rejected' });
//     const dropped = await ProjectApplication.countDocuments({ status: 'dropped' });

//     res.json({
//       totalProjects,
//       openProjects,
//       closedProjects,
//       totalApplications,
//       pending,
//       approved,
//       rejected,
//       dropped
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// Date-wise application counts (grouped by appliedAt date)
// GET /api/mobility/datewise?startDate=2024-01-01&endDate=2024-12-31

exports.getMobilityStats = async (req, res) => {
  try {
    const [
      totalProjects,
      openProjects,
      closedProjects,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      droppedApplications
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'open' }),
      Project.countDocuments({ status: 'closed' }),
      ProjectApplication.countDocuments(),
      ProjectApplication.countDocuments({ status: 'pending' }),
      ProjectApplication.countDocuments({ status: 'approved' }),
      ProjectApplication.countDocuments({ status: 'rejected' }),
      ProjectApplication.countDocuments({ status: 'dropped' })
    ]);

    return res.status(200).json({
      projects: {
        total: totalProjects,
        open: openProjects,
        closed: closedProjects
      },
      applications: {
        total: totalApplications,
        pending: pendingApplications,
        approved: approvedApplications,
        rejected: rejectedApplications,
        dropped: droppedApplications
      }
    });
  } catch (error) {
    console.error('Error fetching mobility stats:', error);
    return res.status(500).json({ error: 'Server error while getting mobility stats.' });
  }
};


// const ProjectApplication = require('../models/ProjectApplication');

exports.getApplicationStats = async (req, res) => {
  try {
    const applications = await ProjectApplication.find()
      .populate('employee', 'name employeeId')  // populate name and employeeId
      .populate('project', 'title');            // populate title

    const projectMap = {};

    applications.forEach(app => {
      const title = app.project?.title || 'Unknown';
      const project = app.project?._id;

      if (!projectMap[title]) {
        projectMap[title] = {
          project,
          title,
          count: 0,
          applications: [],
        };
      }

      projectMap[title].count++;
      projectMap[title].applications.push({
        employeeName: app.employee?.name || 'Unknown',
        employeeId: app.employee?.employeeId || 'N/A',
        appliedAt: app.appliedAt,
      });
    });

    res.status(200).json({
      success: true,
      totalProjects: Object.keys(projectMap).length,
      projects: Object.values(projectMap),
    });

  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


exports.getApplicationsByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required in YYYY-MM-DD format' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999); // Include end of day

    const data = await ProjectApplication.aggregate([
      {
        $match: {
          appliedAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          counts: {
            $push: {
              k: '$_id.status',
              v: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          total: 1,
          counts: {
            $arrayToObject: '$counts'
          }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json(data);
  } catch (err) {
    console.error('Error in getApplicationsByDate:', err);
    res.status(500).json({ error: err.message });
  }
};


