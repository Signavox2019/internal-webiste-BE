const Project = require('../models/Project');
const Employee = require('../models/Employee');
const moment = require('moment'); // Use for consistent date formatting




// exports.createProject = async (req, res) => {
//   try {
//     const { title, teamLead, teamSizeLimit = 1 } = req.body;

//     if (!title || title.length < 2) {
//       return res.status(400).json({ error: 'Project title must be at least 2 characters' });
//     }

//     // Generate projectId
//     const dateStr = moment().format('YYYYMMDD');
//     const suffix = title.trim().substring(0, 2).toUpperCase();

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const tomorrow = new Date(today);
//     tomorrow.setDate(today.getDate() + 1);

//     const countToday = await Project.countDocuments({
//       createdAt: { $gte: today, $lt: tomorrow }
//     });

//     const count = countToday + 1;
//     const projectId = `PRJ-${dateStr}-${suffix}${count}`;

//     // Initialize assignedEmployees array
//     const assignedEmployees = [];

//     // Check and assign team lead if provided
//     if (teamLead) {
//       const lead = await Employee.findById(teamLead);
//       if (!lead) {
//         return res.status(404).json({ error: 'Team lead not found' });
//       }

//       if (!lead.isOnBench) {
//         return res.status(400).json({ error: 'Team lead is already assigned to another project' });
//       }

//       // Mark as off-bench and add to assigned
//       await Employee.findByIdAndUpdate(teamLead, { isOnBench: false });
//       assignedEmployees.push(teamLead);
//     }

//     // Create project
//     const project = await Project.create({
//       ...req.body,
//       projectId,
//       createdBy: req.user._id,
//       assignedEmployees,
//       vacancy: teamSizeLimit - assignedEmployees.length
//     });

//     const populatedProject = await Project.findById(project._id)
//       .populate('createdBy', 'name employeeId')
//       .populate('teamLead', 'name employeeId')
//       .populate('assignedEmployees', 'name employeeId');

//     res.status(201).json(populatedProject);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

exports.createProject = async (req, res) => {
  try {
    const { title, teamLead, teamSizeLimit = 1 } = req.body;

    if (!title || title.length < 2) {
      return res.status(400).json({ error: 'Project title must be at least 2 characters' });
    }

    const dateStr = moment().format('YYYYMMDD');
    const suffix = title.trim().substring(0, 2).toUpperCase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const countToday = await Project.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });
    const count = countToday + 1;
    const projectId = `PRJ-${dateStr}-${suffix}${count}`;

    const assignedEmployees = [];

    if (teamLead) {
      const lead = await Employee.findById(teamLead);
      if (!lead) return res.status(404).json({ error: 'Team lead not found' });
      if (!lead.isOnBench) return res.status(400).json({ error: 'Team lead is already assigned' });

      assignedEmployees.push(teamLead);
    }

    const project = await Project.create({
      ...req.body,
      projectId,
      createdBy: req.user._id,
      assignedEmployees,
      vacancy: teamSizeLimit - assignedEmployees.length
    });

    if (teamLead) {
      await Employee.findByIdAndUpdate(teamLead, {
        isOnBench: false,
        isTeamLead: true,
        currentProject: project._id
      });
    }


    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name employeeId')
      .populate('teamLead', 'name employeeId')
      .populate('assignedEmployees', 'name employeeId');

    res.status(201).json(populatedProject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};



exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate('createdBy', 'name employeeId').populate('teamLead', 'name employeeId').populate('assignedEmployees', 'name employeeId');
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('createdBy', 'name employeeId').populate('teamLead', 'name employeeId').populate('assignedEmployees', 'name employeeId');
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// exports.updateProject = async (req, res) => {
//   try {
//     const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!project) return res.status(404).json({ error: 'Project not found' });
//     res.json(project);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// exports.updateProject = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const updatedProject = await Project.findByIdAndUpdate(
//             id,
//             { $set: req.body }, // Ensures deep updates
//             { new: true, runValidators: true }
//         ).populate('createdBy', 'name employeeId').populate('teamLead', 'name employeeId').populate('assignedEmployees', 'name employeeId');

//         if (!updatedProject) {
//             return res.status(404).json({ error: 'Project not found' });
//         }

//         res.json(updatedProject);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// };

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { teamLead, assignedEmployees = [] } = req.body;

    const existingProject = await Project.findById(id);
    if (!existingProject) return res.status(404).json({ error: 'Project not found' });

    // Revert old team lead's isTeamLead to false if changed
    if (existingProject.teamLead && existingProject.teamLead.toString() !== teamLead) {
      await Employee.findByIdAndUpdate(existingProject.teamLead, { isTeamLead: false, isOnBench: true, currentProject: null});
    }

    // Set new team lead's isTeamLead to true
    if (teamLead) {
      await Employee.findByIdAndUpdate(teamLead, { isTeamLead: true, isOnBench: false, currentProject: req.params.id });
    }

    // Update all employees who were previously assigned and are now removed
    const removedEmployees = existingProject.assignedEmployees.filter(
      emp => !assignedEmployees.includes(emp.toString())
    );
    await Employee.updateMany(
      { _id: { $in: removedEmployees } },
      { isOnBench: true }
    );

    // Mark new assigned employees as off-bench
    await Employee.updateMany(
      { _id: { $in: assignedEmployees } },
      { isOnBench: false, currentProject: req.params.id }
    );

    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name employeeId')
      .populate('teamLead', 'name employeeId')
      .populate('assignedEmployees', 'name employeeId');

    res.json(updatedProject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};



// exports.deleteProject = async (req, res) => {
//     try {
//         const project = await Project.findByIdAndDelete(req.params.id);
//         if (!project) return res.status(404).json({ error: 'Project not found' });
//         res.json({ message: 'Project deleted successfully' });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };


exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Reset team lead
    if (project.teamLead) {
      await Employee.findByIdAndUpdate(project.teamLead, { isTeamLead: false, isOnBench: true, currentProject: null });
    }

    // Reset all assigned employees to be on bench
    if (project.assignedEmployees?.length > 0) {
      await Employee.updateMany(
        { _id: { $in: project.assignedEmployees } },
        { isOnBench: true, currentProject: null }
      );
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
