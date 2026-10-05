// Attendance days are stored as UTC midnight of the calendar date,
// so the stored value is identical on any server timezone.
const toDayStart = (dateStr) => new Date(`${dateStr}T00:00:00.000Z`);

// Today's calendar date in India as "YYYY-MM-DD" (en-CA formats that way)
const todayIST = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

module.exports = { toDayStart, todayIST };