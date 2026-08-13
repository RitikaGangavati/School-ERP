import { Routes, Route, Outlet } from "react-router-dom";
import { AcademicYearProvider } from "../context/AcademicYearContext";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import RoleList from "../pages/role/RoleList";
import SectionList from "../pages/sections";
import ClassList from "../pages/classes";
import SubjectList from "../pages/subjects";
import SubjectGroupList from "../pages/subject-groups";
import AcademicYearList from "../pages/academic-years";
import UserList from "../pages/users/UserList";
import UserForm from "../pages/users/UserForm";
import CategoryList from "../pages/category";
import HouseList from "../pages/house";
import StudentForm from "../pages/students/StudentForm";
import StudentList from "../pages/students/StudentList";
import StudentView from "../pages/students/StudentView";
import TeacherForm from "../pages/teachers/TeacherForm";
import TeacherList from "../pages/teachers/TeacherList";
import ClassTeachersList from "../pages/class-teachers";
import StudentPromotion from "../pages/student-promotion";
import TimeSlots from "../pages/time-slots";
import SubjectTeacher from "../pages/subject-teachers";
import Attendance from "../pages/attendance";
import SubjectWeeklyPeriod from "../pages/subjectWeeklyPeriods";
import Timetable from "../pages/class-timetable";
import TeacherTimetable from "../pages/teacher-timetable";


function AcademicYearLayout() {
  return (
    <AcademicYearProvider>
      <Outlet />
    </AcademicYearProvider>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* LOGIN — AcademicYearProvider does NOT run here */}
      <Route path="/" element={<Login />} />

      {/* PROTECTED ROUTES */}
      <Route element={<AcademicYearLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/roles"
          element={
            <ProtectedRoute>
              <RoleList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sections"
          element={
            <ProtectedRoute>
              <SectionList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/classes"
          element={
            <ProtectedRoute>
              <ClassList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/subjects"
          element={
            <ProtectedRoute>
              <SubjectList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/subject-groups"
          element={
            <ProtectedRoute>
              <SubjectGroupList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/academic-years"
          element={
            <ProtectedRoute>
              <AcademicYearList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UserList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users/create"
          element={
            <ProtectedRoute>
              <UserForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users/edit/:id"
          element={
            <ProtectedRoute>
              <UserForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/category"
          element={
            <ProtectedRoute>
              <CategoryList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/house"
          element={
            <ProtectedRoute>
              <HouseList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <StudentList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/create"
          element={
            <ProtectedRoute>
              <StudentForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/edit/:id"
          element={
            <ProtectedRoute>
              <StudentForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/view/:id"
          element={
            <ProtectedRoute>
              <StudentView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teachers"
          element={
            <ProtectedRoute>
              <TeacherList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teachers/create"
          element={
            <ProtectedRoute>
              <TeacherForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teachers/edit/:id"
          element={
            <ProtectedRoute>
              <TeacherForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/class-teachers"
          element={
            <ProtectedRoute>
              <ClassTeachersList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-promotion"
          element={
            <ProtectedRoute>
              <StudentPromotion />
            </ProtectedRoute>
          }
        />

        <Route
          path="/time-slots"
          element={
            <ProtectedRoute>
              <TimeSlots />
            </ProtectedRoute>
          }
        />

        <Route
          path="/subject-teachers"
          element={
            <ProtectedRoute>
              <SubjectTeacher />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <Attendance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/weekly-periods"
          element={
            <ProtectedRoute>
              <SubjectWeeklyPeriod />
            </ProtectedRoute>
          }
        />

        <Route
          path="/time-table"
          element={
            <ProtectedRoute>
              <Timetable />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-timetable"
          element={
            <ProtectedRoute>
              <TeacherTimetable />
            </ProtectedRoute>
          }
        />

      </Route>
    </Routes>
  );
}
