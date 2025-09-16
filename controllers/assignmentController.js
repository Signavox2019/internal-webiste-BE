const Assignment = require('../models/Assignment');
const Attempt = require('../models/Attempt');
const Employee = require('../models/Employee');

// Create Assignment (executive only)
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, cutoff, questions } = req.body;

    // Fetch all active employees
    const employees = await Employee.find({ status: 'Active' });
    const employeeIds = employees.map(emp => emp._id);

    const assignment = new Assignment({
      title,
      description,
      cutoff,
      questions,
      assignedTo: employeeIds, // ✅ assign to all employees
      createdBy: req.user._id // ✅ use req.user instead of req.employee
    });

    await assignment.save();

    res.status(201).json({
      message: 'Assignment created and assigned to all employees',
      assignment
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
};

// Get assignments created by executive
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find(); // Fetch all assignments
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
};


// Get assignment details
exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.status(200).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignment', error: error.message });
  }
};

// Submit assignment attempt
exports.submitAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const employeeId = req.user._id;

    const assignment = await Assignment.findById(id);
    if (!assignment || !assignment.isActive) {
      return res.status(404).json({ message: 'Assignment not available' });
    }

    if (assignment.deadline && new Date() > new Date(assignment.deadline)) {
      return res.status(400).json({ message: 'Deadline has passed' });
    }

    const previousAttempts = await Attempt.find({ assignment: id, employee: employeeId });
    const attemptNumber = previousAttempts.length + 1;

    let score = 0;
    for (let q of assignment.questions) {
      const answerObj = answers.find(a => a.questionId === q._id.toString());
      if (answerObj) {
        let isCorrect = false;
        if (q.type === 'MCQ' || q.type === 'TrueFalse') {
          isCorrect = q.correctAnswer === answerObj.answer;
        } else if (q.type === 'Blank' || q.type === 'ShortAnswer') {
          isCorrect = q.correctAnswer.trim().toLowerCase() === answerObj.answer.trim().toLowerCase();
        }
        if (isCorrect) {
          score += q.marks;
        }
      }
    }

    const passed = score >= assignment.cutoff;

    const attempt = new Attempt({
      assignment: id,
      employee: employeeId,
      answers,
      score,
      passed,
      attemptNumber
    });

    await attempt.save();

    res.status(200).json({
      message: passed ? 'Assignment passed' : 'Assignment failed, please reattempt',
      score,
      passed,
      attemptNumber
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting attempt', error: error.message });
  }
};

// Get attempt history for a user
exports.getAttemptHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user._id;

    const attempts = await Attempt.find({ assignment: id, employee: employeeId }).sort({ attemptNumber: 1 });

    res.status(200).json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attempt history', error: error.message });
  }
};

// Admin or executive can view attempts by all employees
exports.getAllAttempts = async (req, res) => {
  try {
    const { id } = req.params;
    const attempts = await Attempt.find({ assignment: id }).populate('employee', 'name email');
    res.status(200).json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attempts', error: error.message });
  }
};

// Count of assignments created by the user
exports.getAssignmentCount = async (req, res) => {
  try {
    const count = await Assignment.countDocuments({ createdBy: req.user._id });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignment count', error: error.message });
  }
};

// Edit assignment (executive only)
exports.editAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, cutoff, questions, isActive } = req.body;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this assignment' });
    }

    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.cutoff = cutoff || assignment.cutoff;
    assignment.questions = questions || assignment.questions;
    if (isActive !== undefined) {
      assignment.isActive = isActive;
    }

    await assignment.save();

    res.status(200).json({ message: 'Assignment updated', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating assignment', error: error.message });
  }
};

// Delete assignment (executive only)
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this assignment' });
    }

    await assignment.deleteOne();

    res.status(200).json({ message: 'Assignment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting assignment', error: error.message });
  }
};
