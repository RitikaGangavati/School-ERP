import { useEffect, useState, useCallback } from "react";

import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddIcon from "@mui/icons-material/Add";

import MainLayout from "../../components/layout/MainLayout";
import ResponsiveDataList from "../../components/common/ResponsiveDataList";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StatusChip from "../../components/common/StatusChip";
import SearchBar from "../../components/common/SearchBar";
import { useToast } from "../../components/common/ToastContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import AcademicYearBadge from "../../components/common/AcademicYearBadge";
import RowActions from "../../components/common/RowActions";
import { getClasses } from "../../services/classService";
import { getTeachers } from "..//../services/teacherService";

import {
  getClassTeachers,
  createClassTeacher,
  updateClassTeacher,
  deleteClassTeacher,
} from "../../services/classTeacherService";

const emptyForm = {
  class: "",
  section: "",
  teacher: "",
  active: true,
};

export default function ClassTeachersList() {
  const { showToast } = useToast();
  const { currentYear } = useAcademicYear();

  const [classTeachers, setClassTeachers] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [nameError, setNameError] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true);

    try {
      const [classRes, teacherRes] = await Promise.all([
        getClasses(),
        getTeachers(),
      ]);

      setAllClasses(classRes.data.classes || []);
      setTeachers(teacherRes.data.teachers || []);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  const fetchClassTeachers = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getClassTeachers();
      setClassTeachers(res.data.classTeachers || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
    fetchClassTeachers();
  }, [fetchOptions, fetchClassTeachers]);

  const selectedClass = allClasses.find((c) => c._id === form.class);

  const availableSections = selectedClass?.sections || [];

  const validate = () => {
    const err = {};

    if (!form.class) err.class = "Class is required";

    if (!form.section) err.section = "Section is required";

    if (!form.teacher) err.teacher = "Teacher is required";

    setNameError(err);

    return Object.keys(err).length === 0;
  };

  const handleEditClick = (row) => {
    setForm({
      class: row.class?._id,
      section: row.section?._id,
      teacher: row.teacher?._id,
      active: row.active,
    });

    setEditingId(row._id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
     if (!currentYear) {
      showToast(
        "No current academic year set. Set one in Academic Year master first.",
        "error",
      );
      return;
    }

    if (!validate()) return;

    setSubmitting(true);

    try {
       const payload = { ...form, academicYear: currentYear._id };
      if (editingId) {
        await updateClassTeacher(editingId, payload);
        showToast("Class teacher updated successfully");
      } else {
        await createClassTeacher(payload);
        showToast("Class teacher assigned successfully");
      }

      resetForm();
      fetchClassTeachers();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Something went wrong.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteClassTeacher(deleteTarget._id);

      showToast("Assignment deleted");

      fetchClassTeachers();

      setDeleteTarget(null);

      if (editingId === deleteTarget._id) resetForm();
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setNameError({});
  };

  const columns = [
    {
    field: "academicYear",
    headerName: "Year",
    render: (row) => row.academicYear?.name || "—",
  },
    {
      field: "class",
      headerName: "Class",
      render: (row) => row.class?.className || "—",
    },
    {
      field: "section",
      headerName: "Section",
      render: (row) => row.section?.sectionName || "—",
    },
    {
      field: "teacher",
      headerName: "Teacher",
      render: (row) => `${row.teacher?.firstName} ${row.teacher?.lastName}`,
    },
    {
      field: "active",
      headerName: "Status",
      render: (row) => <StatusChip active={row.active} />,
    },
  ];


const filteredRows = classTeachers.filter(
  (row) =>
    row.class?.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.teacher?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.teacher?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()),
);

return (
  <MainLayout>
    <div className="row g-3">
      {/* Form */}
      <div className="col-12 col-lg-4">
        <div className="card shadow-sm rounded-3 h-100">
          <div className="card-body">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-1">
              <AddIcon fontSize="small" />
              {editingId ? "Edit Class Teacher" : "Assign Class Teacher"}
            </h6>

            <form onSubmit={handleSubmit}>
            <AcademicYearBadge/>
            
              {/* Class */}
              <div className="mb-3">
                <label className="form-label">
                  Class <span className="text-danger">*</span>
                </label>

                <select
                  className={`form-select ${
                    nameError.class ? "is-invalid" : ""
                  }`}
                  value={form.class}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      class: e.target.value,
                      section: "",
                    })
                  }
                >
                  <option value="">Select Class</option>

                  {allClasses.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.className}
                    </option>
                  ))}
                </select>

                {nameError.class && (
                  <div className="invalid-feedback d-block">
                    {nameError.class}
                  </div>
                )}
              </div>

              {/* Section */}
              <div className="mb-3">
                <label className="form-label">
                  Section <span className="text-danger">*</span>
                </label>

                <select
                  className={`form-select ${
                    nameError.section ? "is-invalid" : ""
                  }`}
                  value={form.section}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      section: e.target.value,
                    })
                  }
                >
                  <option value="">Select Section</option>

                  {availableSections.map((sec) => (
                    <option key={sec._id} value={sec._id}>
                      {sec.sectionName}
                    </option>
                  ))}
                </select>

                {nameError.section && (
                  <div className="invalid-feedback d-block">
                    {nameError.section}
                  </div>
                )}
              </div>

              {/* Teacher */}
              <div className="mb-3">
                <label className="form-label">
                  Teacher <span className="text-danger">*</span>
                </label>

                <select
                  className={`form-select ${
                    nameError.teacher ? "is-invalid" : ""
                  }`}
                  value={form.teacher}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      teacher: e.target.value,
                    })
                  }
                >
                  <option value="">Select Teacher</option>

                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.firstName} {teacher.lastName}
                    </option>
                  ))}
                </select>

                {nameError.teacher && (
                  <div className="invalid-feedback d-block">
                    {nameError.teacher}
                  </div>
                )}
              </div>

              {/* Active */}
              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      active: e.target.checked,
                    })
                  }
                />

                <label className="form-check-label">
                  {form.active ? "Active" : "Inactive"}
                </label>
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary flex-grow-1"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : editingId ? "Update" : "Save"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="col-12 col-lg-8">
        <div className="card shadow-sm rounded-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Class Teacher List</h6>

              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search..."
              />
            </div>

            <ResponsiveDataList
              columns={columns}
              rows={filteredRows}
              loading={loading}
              minWidth={750}
              emptyMessage="No class teachers assigned."
              renderActions={(row) => (
                <RowActions
                  onEdit={() => handleEditClick(row)}
                  onDelete={() => setDeleteTarget(row)}
                />
              )}
            />
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      open={!!deleteTarget}
      title="Delete Assignment"
      message={`Are you sure you want to remove "${deleteTarget?.teacher?.firstName} ${deleteTarget?.teacher?.lastName}" as class teacher?`}
      onConfirm={handleDeleteConfirm}
      onCancel={() => setDeleteTarget(null)}
      loading={deleting}
    />
  </MainLayout>
);
}