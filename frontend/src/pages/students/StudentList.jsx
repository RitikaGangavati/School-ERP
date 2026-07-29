import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import VisibilityIcon from "@mui/icons-material/VisibilityOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";

import MainLayout from "../../components/layout/MainLayout";
import ResponsiveDataList from "../../components/common/ResponsiveDataList";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import SearchBar from "../../components/common/SearchBar";
import AddButton from "../../components/common/AddButton";
import { useToast } from "../../components/common/ToastContext";
import { getStudents, deleteStudent } from "../../services/studentService";
import { getClasses } from "../../services/classService";

export default function StudentList() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [allClasses, setAllClasses] = useState([]);
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getStudents();
      setStudents(res.data.students || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load students. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await getClasses();
      setAllClasses(res.data.classes || []);
    } catch (err) {
      setAllClasses([]);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [fetchStudents, fetchClasses]);

  // Sections shown in the filter depend on which class is currently selected
  const selectedClassObj = allClasses.find((c) => c._id === classFilter);
  const availableSections = selectedClassObj?.sections || [];

  const handleClassFilterChange = (e) => {
    setClassFilter(e.target.value);
    setSectionFilter(""); // reset section filter whenever class filter changes
  };

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      `${s.personal?.firstName} ${s.personal?.lastName}`.toLowerCase().includes(term) ||
      s.academic?.admissionNumber?.toLowerCase().includes(term) ||
      (s.academic?.class?.className || "").toLowerCase().includes(term);

    const matchesClass = !classFilter || s.academic?.class?._id === classFilter;
    const matchesSection = !sectionFilter || s.academic?.section?._id === sectionFilter;

    return matchesSearch && matchesClass && matchesSection;
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteStudent(deleteTarget._id);
      showToast("Student deleted successfully");
      setDeleteTarget(null);
      fetchStudents();
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to delete student. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { field: "admissionNumber", headerName: "Admission No.", render: (row) => row.academic?.admissionNumber || "—" },
    { field: "name", headerName: "Name", render: (row) => `${row.personal?.firstName} ${row.personal?.lastName}` },
    { field: "rollNo", headerName: "Roll No.", muted: true, render: (row) => row.academic?.rollNo || "—" },
    { field: "class", headerName: "Class", render: (row) => row.academic?.class?.className || "—" },
    { field: "section", headerName: "Section", render: (row) => row.academic?.section?.sectionName || "—" },
    {
      field: "status",
      headerName: "Status",
      render: (row) => <span className="badge bg-info bg-opacity-75">{row.academic?.status}</span>,
    },
  ];

  return (
    <MainLayout>
      <div className="d-flex flex-column gap-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h4 className="fw-bold mb-0">Student Master</h4>

          <div className="d-flex flex-nowrap align-items-center gap-2">
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search students..." />
            <AddButton label="Add Student" onClick={() => navigate("/students/create")} />
          </div>
        </div>

        {/* Class / Section filters */}
        <div className="d-flex flex-wrap gap-2">
          <select
            className="form-select"
            style={{ maxWidth: 200 }}
            value={classFilter}
            onChange={handleClassFilterChange}
          >
            <option value="">All Classes</option>
            {allClasses.map((c) => (
              <option key={c._id} value={c._id}>{c.className}</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ maxWidth: 200 }}
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            disabled={!classFilter}
          >
            <option value="">{classFilter ? "All Sections" : "Select class first"}</option>
            {availableSections.map((sec) => (
              <option key={sec._id} value={sec._id}>{sec.sectionName}</option>
            ))}
          </select>

          {(classFilter || sectionFilter) && (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setClassFilter("");
                setSectionFilter("");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <ResponsiveDataList
          columns={columns}
          rows={filteredStudents}
          loading={loading}
          minWidth={950}
          emptyMessage='No students found. Click "Add Student" to create one.'
          renderActions={(row) => (
            <div className="d-flex gap-1">
              <button
                className="btn btn-sm btn-outline-secondary d-flex align-items-center"
                onClick={() => navigate(`/students/view/${row._id}`)}
                title="View"
              >
                <VisibilityIcon style={{ fontSize: 16 }} />
              </button>
              <button
                className="btn btn-sm btn-outline-primary d-flex align-items-center"
                onClick={() => navigate(`/students/edit/${row._id}`)}
                title="Edit"
              >
                <EditIcon style={{ fontSize: 16 }} />
              </button>
              <button
                className="btn btn-sm btn-outline-danger d-flex align-items-center"
                onClick={() => setDeleteTarget(row)}
                title="Delete"
              >
                <DeleteIcon style={{ fontSize: 16 }} />
              </button>
            </div>
          )}
        />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Student"
        message={`Are you sure you want to delete "${deleteTarget?.personal?.firstName} ${deleteTarget?.personal?.lastName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
}