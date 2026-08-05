const express = require('express');
const app = express();
require('dotenv').config();
const connectDB = require('./db/connect');
const cors = require('cors');
const path = require("path"); 

// database connect
connectDB();

//Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const authRT = require("./routes/authRT");
const roleRT = require("./routes/roleRT");
const userRT = require("./routes/userRT");
const academicYearRT = require("./routes/academicYearRT");
const sectionRT = require("./routes/sectionRT");
const classRT = require("./routes/classRT");
const subjectRT = require("./routes/subjectRT");
const subjectGroupRT = require("./routes/subjectGroupRT");
const categoryRT = require("./routes/categoryRT");
const houseRT = require("./routes/houseRT");
const studentRT = require("./routes/studentRT");
const uploadRT = require("./routes/uploadRT");
const teacherRT = require("./routes/teacherRT");
const classTeacherRT = require("./routes/classTeacherRT");
const studentPromotionRT = require("./routes/studentPromotionRT");
const timeSlotRT = require("./routes/timeSlotRT");
const timeTableRT = require("./routes/timeTableRT");
const subjectTeacherRT = require("./routes/subjectTeacherRT")
const attendanceRT = require("./routes/attendanceRT");

app.use('/api/auth',authRT);
app.use('/api/roles',roleRT);
app.use("/api/users", userRT);
app.use("/api/academic-Years",academicYearRT);
app.use("/api/sections",sectionRT);
app.use("/api/classes", classRT);
app.use("/api/subjects", subjectRT);
app.use("/api/subject-groups", subjectGroupRT);
app.use("/api/category", categoryRT);
app.use("/api/house", houseRT);
app.use("/api/students", studentRT);
app.use("/api/upload", uploadRT);
app.use("/api/teachers", teacherRT);
app.use("/api/class-teachers", classTeacherRT);
app.use("/api/student-promotion", studentPromotionRT);
app.use("/api/time-slots", timeSlotRT);
app.use("/api/timetable", timeTableRT);
app.use("/api/subject-teachers", subjectTeacherRT);
app.use("/api/attendance", attendanceRT);


//Route test
app.get("/", (req, res) => {
    res.send("School ERP Backend Running");
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});

