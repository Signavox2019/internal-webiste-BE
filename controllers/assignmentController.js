// controllers/assignmentController.js
const Assignment = require('../models/Assignment');
const Attempt = require('../models/Attempt');
const User = require('../models/User');

// Create Assignment (executive only)
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, cutoff, deadline, questions, assignedTo } = req.body;
    const assignment = new Assignment({
      title,
      description,
      cutoff,
      deadline,
      questions,
      assignedTo,
      createdBy: req.user._id
    });

    await assignment.save();
    res.status(201).json({ message: 'Assignment created successfully', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
};

// Get assignments created by executive
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ createdBy: req.user._id });
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
    const userId = req.user._id;

    const assignment = await Assignment.findById(id);
    if (!assignment || !assignment.isActive) return res.status(404).json({ message: 'Assignment not available' });

    // Check deadline
    if (new Date() > new Date(assignment.deadline)) {
      return res.status(400).json({ message: 'Deadline has passed' });
    }

    // Get previous attempts to count attempt number
    const previousAttempts = await Attempt.find({ assignment: id, user: userId });
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
      user: userId,
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
    const userId = req.user._id;
    const attempts = await Attempt.find({ assignment: id, user: userId }).sort({ attemptNumber: 1 });
    res.status(200).json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attempts', error: error.message });
  }
};

// Admin or executive can view attempts by all users
exports.getAllAttempts = async (req, res) => {
  try {
    const { id } = req.params;
    const attempts = await Attempt.find({ assignment: id }).populate('user', 'name email');
    res.status(200).json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attempts', error: error.message });
  }
};
