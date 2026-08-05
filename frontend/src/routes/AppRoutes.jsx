import { Routes, Route } from "react-router-dom";

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
import ClassTimetableView from "../pages/class-timetable/ClassTimetableView";
import AddClassTimetable from "../pages/class-timetable/AddClassTimetable";
import TeacherTimetableView from "../pages/teacher-timetable/TeacherTimetableView";
import SubjectTeacher from "../pages/subject-teachers";
import ClassRoutine from "../pages/class-timetable/ClassRoutine";
import  Attendance from "../pages/attendance"

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {" "}
            <Dashboard />{" "}
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles"
        element={
          <ProtectedRoute>
            {" "}
            <RoleList />{" "}
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
      // AppRoutes.jsx
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
        path="/class-timetable"
        element={
          <ProtectedRoute>
         <ClassTimetableView/>
          </ProtectedRoute>
        }
      />
       <Route
        path="/add-class-timetable"
        element={
          <ProtectedRoute>
         <AddClassTimetable/>
          </ProtectedRoute>
        }
      />
       <Route
        path="/teacher-timetable"
        element={
          <ProtectedRoute>
         <TeacherTimetableView/>
          </ProtectedRoute>
        }
      />
       <Route
        path="/subject-teachers"
        element={
          <ProtectedRoute>
         <SubjectTeacher/>
          </ProtectedRoute>
        }
      />
      <Route
        path="/class-routine"
        element={
          <ProtectedRoute>
         <ClassRoutine/>
          </ProtectedRoute>
        }
      />
       <Route
        path="/attendance"
        element={
          <ProtectedRoute>
          <Attendance/>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
