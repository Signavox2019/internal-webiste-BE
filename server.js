const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const employeeRoutes = require('./routes/employeeRoutes');
const projectRoutes = require('./routes/projectRoutes');
const projectApplicationRoutes = require('./routes/projectApplicationRoutes');
const mobilityStatsRoutes = require('./routes/mobilityStatsRoutes');
const contactRoutes = require('./routes/contactRoutes');



const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/employees', employeeRoutes);
app.use('/api/cards', require('./routes/cardRoutes'));
app.use('/api/quick-links', require('./routes/quickLinkRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));

app.use('/api/projects', projectRoutes);
app.use('/api/project-applications', projectApplicationRoutes);
app.use('/api/mobility-stats', mobilityStatsRoutes);
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));

// contact
app.use('/api/contact', contactRoutes);


// Handle errors (optional)
// Handle errors (optional)
app.use((err, req, res, next) => {
    console.error(err.stack); // log the error for debugging

    if (res.headersSent) {
        return next(err); // Pass it along if headers are already sent
    }

    res.status(500).json({ message: err.message });
});


// Static files for uploads (if storing locally too)
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// DB Connection & Server Start
const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => console.log(err));

// Cron Jobs
require('./cron/ticketChecker');
