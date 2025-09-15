// controllers/assignmentController.js
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
      assignedTo: employeeIds, // Assign to all employees
      createdBy: req.employee._id // ✅ use req.user instead of req.Employee
    });

    await assignment.save();

    res.status(201).json({ message: 'Assignment created and assigned to all employees', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
};


// Get assignments created by executive
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ createdBy: req.employee._id });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
};

// Get assignment details
exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
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
    const EmployeeId = req.employee._id;

    const assignment = await Assignment.findById(id);
    if (!assignment || !assignment.isActive) return res.status(404).json({ message: 'Assignment not available' });

    // Check deadline
    if (new Date() > new Date(assignment.deadline)) {
      return res.status(400).json({ message: 'Deadline has passed' });
    }

    // Get previous attempts to count attempt number
    const previousAttempts = await Attempt.find({ assignment: id, Employee: EmployeeId });
    const attemptNumber = previousAttempts.length + 1;

    // Evaluate score
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
      Employee: EmployeeId,
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

// Get attempt history for a Employee
exports.getAttemptHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const EmployeeId = req.Employee._id;
    const attempts = await Attempt.find({ assignment: id, Employee: EmployeeId }).sort({ attemptNumber: 1 });
    res.status(200).json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attempts', error: error.message });
  }
};

// Admin or executive can view attempts by all Employees
exports.getAllAttempts = async (req, res) => {
  try {
    const { id } = req.params;
    const attempts = await Attempt.find({ assignment: id }).populate('Employee', 'name email');
    res.status(200).json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attempts', error: error.message });
  }
};
