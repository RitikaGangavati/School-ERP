const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../app");
const db = require("../setup/db");
const { loginAs } = require("../setup/helpers");
const User = require("../../models/userModel");
const Student = require("../../models/studentModel");
const StudentPromotion = require("../../models/studentPromotionModel");
const AcademicYear = require("../../models/academicYearModel");
const Class = require("../../models/classModel");
const Section = require("../../models/sectionModel");

beforeAll(db.connect);
afterEach(db.clear);
afterEach(() => jest.restoreAllMocks());
afterAll(db.close);

const bearer = (token) => ({ Authorization: `Bearer ${token}` });
const newId = () => new mongoose.Types.ObjectId().toString();

let token; // Admin access token
let admin; // the Admin user document
let w; // the "world": two years, two classes, two sections

beforeEach(async () => {
  token = await loginAs(app, "Admin");
  admin = await User.findOne({ email: "admin@test.com" });

  const [fromYear, toYear] = await AcademicYear.insertMany([
    { name: "2025-26", startDate: new Date("2025-04-01"), endDate: new Date("2026-03-31") },
    { name: "2026-27", startDate: new Date("2026-04-01"), endDate: new Date("2027-03-31") },
  ]);
  const [fromClass, toClass] = await Class.insertMany([
    { className: "Class 1" },
    { className: "Class 2" },
  ]);
  const [fromSection, toSection] = await Section.insertMany([
    { sectionName: "A" },
    { sectionName: "B" },
  ]);
  w = { fromYear, toYear, fromClass, toClass, fromSection, toSection };
});

// ---------- helpers for this file ----------
let counter = 0;
const makeStudent = (academicOverrides = {}) => {
  counter += 1;
  return Student.create({
    personal: {
      firstName: `Stu${counter}`,
      lastName: "Test",
      dob: new Date("2015-01-01"),
      gender: "Male",
    },
    academic: {
      admissionNumber: `ADM${counter}`,
      academicYear: w.fromYear._id,
      class: w.fromClass._id,
      section: w.fromSection._id,
      rollNo: String(counter),
      status: "Active",
      ...academicOverrides,
    },
  });
};

const promoteBody = (students, extra = {}) => ({
  studentIds: students.map((s) => s._id.toString()),
  fromAcademicYear: w.fromYear._id.toString(),
  fromClass: w.fromClass._id.toString(),
  fromSection: w.fromSection._id.toString(),
  promoteToAcademicYear: w.toYear._id.toString(),
  promoteToClass: w.toClass._id.toString(),
  promoteToSection: w.toSection._id.toString(),
  ...extra,
});

const promote = (body, tkn = token) =>
  request(app).post("/api/student-promotion/promote").set(bearer(tkn)).send(body);

const classOf = async (student) =>
  String((await Student.findById(student._id).lean()).academic.class);

const FROM = () => String(w.fromClass._id);
const TO = () => String(w.toClass._id);

// ---------- access control ----------
describe("access control", () => {
  test("no token returns 401", async () => {
    const res = await request(app).post("/api/student-promotion/promote").send({});
    expect(res.status).toBe(401);
  });

  test("a Teacher cannot promote (403) and nothing changes", async () => {
    const s1 = await makeStudent();
    const teacherToken = await loginAs(app, "Teacher");

    const res = await promote(promoteBody([s1]), teacherToken);

    expect(res.status).toBe(403);
    expect(await classOf(s1)).toBe(FROM());
    expect(await StudentPromotion.countDocuments()).toBe(0);
  });
});

// ---------- the list of students to promote ----------
describe("GET /api/student-promotion/students", () => {
  const query = () =>
    `?academicYear=${w.fromYear._id}&class=${w.fromClass._id}&section=${w.fromSection._id}`;

  test("returns only Active students of that exact year, class and section", async () => {
    await makeStudent({ rollNo: "2" });
    await makeStudent({ rollNo: "1" });
    await makeStudent({ status: "Inactive" }); // not active
    await makeStudent({ class: w.toClass._id }); // different class

    const res = await request(app).get(`/api/student-promotion/students${query()}`).set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.students[0].academic.rollNo).toBe("1"); // sorted by roll number
  });

  test("a missing query parameter returns 400", async () => {
    const res = await request(app)
      .get(`/api/student-promotion/students?academicYear=${w.fromYear._id}`)
      .set(bearer(token));
    expect(res.status).toBe(400);
  });
});

// ---------- promoting ----------
describe("POST /api/student-promotion/promote", () => {
  test("moves the selected students and records one history entry each", async () => {
    const s1 = await makeStudent();
    const s2 = await makeStudent();
    const untouched = await makeStudent();

    const res = await promote(promoteBody([s1, s2]));

    expect(res.status).toBe(200);
    expect(res.body.promotedCount).toBe(2);

    // the selected students moved to the new year, class and section
    for (const s of [s1, s2]) {
      const doc = await Student.findById(s._id).lean();
      expect(String(doc.academic.class)).toBe(TO());
      expect(String(doc.academic.section)).toBe(String(w.toSection._id));
      expect(String(doc.academic.academicYear)).toBe(String(w.toYear._id));
    }
    // a student who was not selected stayed where they were
    expect(await classOf(untouched)).toBe(FROM());

    // history: one entry per student, same batch time, and who did it
    const history = await StudentPromotion.find().lean();
    expect(history).toHaveLength(2);
    expect(String(history[0].fromClass)).toBe(FROM());
    expect(String(history[0].toClass)).toBe(TO());
    expect(String(history[0].promotedBy)).toBe(String(admin._id));
    expect(new Set(history.map((h) => h.promotedOn.getTime())).size).toBe(1);
  });

  test("duplicate ids in the request are promoted only once", async () => {
    const s1 = await makeStudent();
    const body = promoteBody([s1]);
    body.studentIds = [body.studentIds[0], body.studentIds[0]];

    const res = await promote(body);

    expect(res.status).toBe(200);
    expect(res.body.promotedCount).toBe(1);
    expect(await StudentPromotion.countDocuments()).toBe(1);
  });

  test("promoting the same students twice is rejected the second time (400)", async () => {
    const s1 = await makeStudent();
    const body = promoteBody([s1]);

    expect((await promote(body)).status).toBe(200);
    const again = await promote(body);

    expect(again.status).toBe(400);
    expect(await StudentPromotion.countDocuments()).toBe(1); // no second history entry
  });

  test("promoting to the same year, class and section returns 400", async () => {
    const s1 = await makeStudent();
    const res = await promote(
      promoteBody([s1], {
        promoteToAcademicYear: w.fromYear._id.toString(),
        promoteToClass: w.fromClass._id.toString(),
        promoteToSection: w.fromSection._id.toString(),
      })
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("must be different");
  });

  test.each([
    ["promoteToAcademicYear", "Promote-to academic year not found"],
    ["promoteToClass", "Promote-to class not found"],
    ["promoteToSection", "Promote-to section not found"],
  ])("an unknown %s returns 404 and nothing changes", async (field, message) => {
    const s1 = await makeStudent();
    const res = await promote(promoteBody([s1], { [field]: newId() }));

    expect(res.status).toBe(404);
    expect(res.body.message).toBe(message);
    expect(await classOf(s1)).toBe(FROM());
    expect(await StudentPromotion.countDocuments()).toBe(0);
  });

  test("one ineligible student blocks the whole batch (all or nothing)", async () => {
    const eligible = await makeStudent();
    const wrongClass = await makeStudent({ class: w.toClass._id }); // not in the "from" class

    const res = await promote(promoteBody([eligible, wrongClass]));

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("nothing was promoted");
    expect(await classOf(eligible)).toBe(FROM()); // the eligible one did NOT move either
    expect(await StudentPromotion.countDocuments()).toBe(0);
  });

  test("an Inactive student cannot be promoted (400)", async () => {
    const inactive = await makeStudent({ status: "Inactive" });
    const res = await promote(promoteBody([inactive]));

    expect(res.status).toBe(400);
    expect(await classOf(inactive)).toBe(FROM());
  });

  test("an empty student list returns 400", async () => {
    const res = await promote(promoteBody([]));
    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toBe("No students selected");
  });

  test("an invalid student id returns 400", async () => {
    const s1 = await makeStudent();
    const body = promoteBody([s1]);
    body.studentIds = ["not-an-id"];

    const res = await promote(body);
    expect(res.status).toBe(400);
  });

  test("if the update fails halfway, the history is rolled back and students stay put", async () => {
    const s1 = await makeStudent();
    const s2 = await makeStudent();

    jest.spyOn(console, "error").mockImplementation(() => {}); // keep the output clean
    // make the FIRST call to Student.updateMany fail; the rollback's call works normally
    jest.spyOn(Student, "updateMany").mockRejectedValueOnce(new Error("boom"));

    const res = await promote(promoteBody([s1, s2]));

    expect(res.status).toBe(500);
    expect(await StudentPromotion.countDocuments()).toBe(0);
    expect(await classOf(s1)).toBe(FROM());
    expect(await classOf(s2)).toBe(FROM());
  });
});

// ---------- history ----------
describe("promotion history", () => {
  test("a student's history shows readable names", async () => {
    const s1 = await makeStudent();
    await promote(promoteBody([s1]));

    const res = await request(app)
      .get(`/api/student-promotion/history/${s1._id}`)
      .set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.history).toHaveLength(1);
    expect(res.body.history[0].fromClass.className).toBe("Class 1");
    expect(res.body.history[0].toClass.className).toBe("Class 2");
    expect(res.body.pagination.total).toBe(1);
  });

  test("the list can be filtered by the class students were promoted INTO", async () => {
    const s1 = await makeStudent();
    const s2 = await makeStudent();
    await promote(promoteBody([s1, s2]));

    const into = await request(app)
      .get(`/api/student-promotion/list?class=${w.toClass._id}`)
      .set(bearer(token));
    expect(into.body.promotions).toHaveLength(2);

    const from = await request(app)
      .get(`/api/student-promotion/list?class=${w.fromClass._id}`)
      .set(bearer(token));
    expect(from.body.promotions).toHaveLength(0);
  });
});