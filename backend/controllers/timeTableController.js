const Timetable = require("../models/timetableModel");
const SubjectGroup = require("../models/subjectGroupModel");
const SubjectTeacher = require("../models/subjectTeacherModel");
const TimeSlot = require("../models/timeSlotModel");

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const populateFields = [
  { path: "academicYear", select: "name" },
  { path: "class", select: "className" },
  { path: "section", select: "sectionName" },
  { path: "timeSlot", select: "periodName startTime endTime" },
  { path: "subject", select: "subjectName subjectCode" },
  { path: "teacher", select: "firstName lastName employeeId" },
];

const duplicateKeyMessage = (error) => {
  if (error.keyPattern?.teacher) {
    return "This teacher is already assigned to another class at this exact day and time slot.";
  }
  if (error.keyPattern?.section) {
    return "This section already has a period assigned at this day and time slot.";
  }
  return "Duplicate timetable entry.";
};

// Look up the teacher assigned to a subject for this exact class+section+year
const resolveTeacher = async (academicYear, classId, section, subject) => {
  const assignment = await SubjectTeacher.findOne({ academicYear, class: classId, section, subject });
  return assignment?.teacher || null;
};

// ---------------- MANUAL ----------------

const createTimetable = async (req, res) => {
  try {
    const { academicYear, class: classId, section, day, timeSlot, subject, roomNo, remarks } = req.body;

    if (!academicYear || !classId || !section || !day || !timeSlot || !subject) {
      return res.status(400).json({ success: false, message: "Please fill all required fields" });
    }

    const subjectGroup = await SubjectGroup.findOne({
      academicYear, class: classId, sections: section, "subjects.subject": subject, active: true,
    });

    if (!subjectGroup) {
      return res.status(400).json({
        success: false,
        message: "Selected subject is not available for this class and section.",
      });
    }

    const teacher = await resolveTeacher(academicYear, classId, section, subject);
    if (!teacher) {
      return res.status(400).json({
        success: false,
        message: "No teacher is assigned for this subject. Assign one in Subject Teacher first.",
      });
    }

    const timetable = await Timetable.create({
      academicYear, class: classId, section, day, timeSlot, subject, teacher, roomNo, remarks,
    });

    const populated = await timetable.populate(populateFields);

    return res.status(201).json({
      success: true,
      message: "Timetable entry created successfully",
      timetable: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: duplicateKeyMessage(error) });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ success: false, message: "Timetable entry not found" });
    }

    const { day, timeSlot, subject, roomNo, remarks } = req.body;

    // If subject is changing, re-validate against SubjectGroup and re-resolve teacher
    if (subject && String(subject) !== String(timetable.subject)) {
      const subjectGroup = await SubjectGroup.findOne({
        academicYear: timetable.academicYear,
        class: timetable.class,
        sections: timetable.section,
        "subjects.subject": subject,
        active: true,
      });

      if (!subjectGroup) {
        return res.status(400).json({
          success: false,
          message: "Selected subject is not available for this class and section.",
        });
      }

      const teacher = await resolveTeacher(
        timetable.academicYear, timetable.class, timetable.section, subject,
      );
      if (!teacher) {
        return res.status(400).json({
          success: false,
          message: "No teacher is assigned for this subject. Assign one in Subject Teacher first.",
        });
      }

      timetable.subject = subject;
      timetable.teacher = teacher;
    }

    if (day !== undefined) timetable.day = day;
    if (timeSlot !== undefined) timetable.timeSlot = timeSlot;
    if (roomNo !== undefined) timetable.roomNo = roomNo;
    if (remarks !== undefined) timetable.remarks = remarks;

    await timetable.save();
    const populated = await timetable.populate(populateFields);

    return res.status(200).json({
      success: true,
      message: "Timetable entry updated successfully",
      timetable: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: duplicateKeyMessage(error) });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid timetable ID" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    if (!timetable) {
      return res.status(404).json({ success: false, message: "Timetable entry not found" });
    }
    return res.status(200).json({ success: true, message: "Timetable entry deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid timetable ID" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- READ ----------------

const getTimetable = async (req, res) => {
  try {
    const { academicYear, class: classId, section, teacher } = req.query;
    const filter = {};
    if (academicYear) filter.academicYear = academicYear;
    if (classId) filter.class = classId;
    if (section) filter.section = section;
    if (teacher) filter.teacher = teacher;

    const timetable = await Timetable.find(filter).populate(populateFields).sort({ day: 1, timeSlot: 1 });
    return res.status(200).json({ success: true, timetable });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTimetableById = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id).populate(populateFields);
    if (!timetable) {
      return res.status(404).json({ success: false, message: "Timetable entry not found" });
    }
    return res.status(200).json({ success: true, timetable });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid timetable ID" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- AUTO-GENERATE ----------------

const generateTimetable = async (req, res) => {
  try {
    const { academicYear, class: classId, section, subjectGroup: groupId } = req.body;

    if (!academicYear || !classId || !section || !groupId) {
      return res.status(400).json({
        success: false,
        message: "academicYear, class, section and subjectGroup are required",
      });
    }

    const group = await SubjectGroup.findOne({
      _id: groupId, academicYear, class: classId, sections: section, active: true,
    }).populate("subjects.subject", "subjectName");

    if (!group) {
      return res.status(404).json({ success: false, message: "Subject group not found for this class and section" });
    }

    const subjectIds = group.subjects.map((s) => s.subject._id);
    const subjectTeacherDocs = await SubjectTeacher.find({
      academicYear, class: classId, section, subject: { $in: subjectIds },
    });

    const teacherMap = {};
    subjectTeacherDocs.forEach((st) => { teacherMap[String(st.subject)] = st.teacher; });

    const unresolved = [];
    const subjectsToPlace = group.subjects
      .map((s) => ({
        subjectId: String(s.subject._id),
        subjectName: s.subject.subjectName,
        periodsPerWeek: s.periodsPerWeek,
        teacher: teacherMap[String(s.subject._id)] || null,
      }))
      .filter((s) => {
        if (!s.teacher) {
          unresolved.push({ subject: s.subjectName, needed: s.periodsPerWeek, placed: 0, reason: "No teacher assigned" });
          return false;
        }
        return true;
      })
      .sort((a, b) => b.periodsPerWeek - a.periodsPerWeek);

    const timeSlots = await TimeSlot.find({ active: true, type: "Period" }).sort({ displayOrder: 1 });
    if (timeSlots.length === 0) {
      return res.status(400).json({ success: false, message: "No active Period time slots configured" });
    }

    const totalWeeklySlots = timeSlots.length * DAYS.length;
    const totalNeeded = subjectsToPlace.reduce((sum, s) => sum + s.periodsPerWeek, 0);
    if (totalNeeded > totalWeeklySlots) {
      return res.status(400).json({
        success: false,
        message: `Not enough weekly slots. Need ${totalNeeded} periods but only ${totalWeeklySlots} are available.`,
      });
    }

    const existingEntries = await Timetable.find({ academicYear }).select("class section teacher day timeSlot");
    const teacherBusy = new Set();
    const sectionBusy = new Set();
    existingEntries.forEach((e) => {
      teacherBusy.add(`${e.teacher}_${e.day}_${e.timeSlot}`);
      if (String(e.class) === String(classId) && String(e.section) === String(section)) {
        sectionBusy.add(`${e.day}_${e.timeSlot}`);
      }
    });

    const toInsert = [];

    const tryPlace = (subj, day, slot) => {
      const sectionKey = `${day}_${slot._id}`;
      const teacherKey = `${subj.teacher}_${day}_${slot._id}`;
      if (sectionBusy.has(sectionKey) || teacherBusy.has(teacherKey)) return false;
      sectionBusy.add(sectionKey);
      teacherBusy.add(teacherKey);
      toInsert.push({
        academicYear, class: classId, section, day,
        timeSlot: slot._id, subject: subj.subjectId, teacher: subj.teacher,
      });
      return true;
    };

    for (const subj of subjectsToPlace) {
      let placed = 0;
      const usedDays = new Set();

      for (const day of DAYS) {
        if (placed >= subj.periodsPerWeek) break;
        for (const slot of timeSlots) {
          if (placed >= subj.periodsPerWeek) break;
          if (tryPlace(subj, day, slot)) { placed++; usedDays.add(day); break; }
        }
      }

      if (placed < subj.periodsPerWeek) {
        outer: for (const day of DAYS) {
          for (const slot of timeSlots) {
            if (placed >= subj.periodsPerWeek) break outer;
            if (tryPlace(subj, day, slot)) placed++;
          }
        }
      }

      if (placed < subj.periodsPerWeek) {
        unresolved.push({
          subject: subj.subjectName, needed: subj.periodsPerWeek, placed,
          reason: "Not enough conflict-free slots — teacher or section already booked elsewhere",
        });
      }
    }

    let insertedCount = 0;
    if (toInsert.length > 0) {
      const result = await Timetable.insertMany(toInsert, { ordered: false });
      insertedCount = result.length;
    }

    return res.status(201).json({
      success: true,
      message: `Generated ${insertedCount} period(s)${unresolved.length ? `, ${unresolved.length} subject(s) had issues` : ""}.`,
      insertedCount,
      unresolved,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTimetable,
  updateTimetable,
  deleteTimetable,
  getTimetable,
  getTimetableById,
  generateTimetable,
};