import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Nav, Tab } from "react-bootstrap";

import EditIcon from "@mui/icons-material/EditOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBackOutlined";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/SchoolOutlined";
import FavoriteIcon from "@mui/icons-material/FavoriteBorderOutlined";
import GroupIcon from "@mui/icons-material/GroupOutlined";
import HomeIcon from "@mui/icons-material/HomeOutlined";

import MainLayout from "../../components/layout/MainLayout";
import { useToast } from "../../context/ToastContext";
import { getStudentById } from "../../services/studentService";
import { getImageUrl } from "../../utils/getImageUrl";

const formatDate = (isoString) =>
  isoString
    ? new Date(isoString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

function InfoRow({ label, value }) {
  return (
    <div className="col-md-6 mb-3">
      <div
        className="text-muted small text-uppercase"
        style={{ fontSize: 11, letterSpacing: 0.4 }}
      >
        {label}
      </div>
      <div className="fw-semibold" style={{ fontSize: 15 }}>
        {value || "—"}
      </div>
    </div>
  );
}

// Small circular avatar with initials fallback — reused for student + all three parent/guardian photos
function Avatar({ src, initials, size = 80 }) {
  return (
    <div
      className="rounded-circle bg-light d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
      style={{
        width: size,
        height: size,
        border: "3px solid #fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="w-100 h-100"
          style={{ objectFit: "cover" }}
        />
      ) : (
        <span className="text-muted fw-bold" style={{ fontSize: size * 0.35 }}>
          {initials}
        </span>
      )}
    </div>
  );
}

// One parent/guardian row with photo + details — used 3x in the Family tab
function PersonCard({ label, name, phone, extra, photo }) {
  if (!name && !phone && !extra) return null;
  return (
    <div className="d-flex align-items-center gap-3 py-2">
      <Avatar
        src={photo}
        initials={name?.[0]?.toUpperCase() || "?"}
        size={52}
      />
      <div>
        <div
          className="text-muted small text-uppercase"
          style={{ fontSize: 11, letterSpacing: 0.4 }}
        >
          {label}
        </div>
        <div className="fw-semibold">{name || "—"}</div>
        <div className="text-muted small">
          {[phone, extra].filter(Boolean).join(" · ")}
        </div>
      </div>
    </div>
  );
}

export default function StudentView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    const fetchStudent = async () => {
      setLoading(true);
      try {
        const res = await getStudentById(id);
        setStudent(res.data.student);
      } catch (err) {
        showToast(
          err.response?.data?.message || "Unable to load student.",
          "error",
        );
        navigate("/students");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id, navigate, showToast]);

  if (loading) {
    return (
      <MainLayout>
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      </MainLayout>
    );
  }

  if (!student) return null;

  const { personal, academic, health, parent, address } = student;

  return (
    <MainLayout>
      {/* --- Gradient banner header --- */}
      <div
        className="rounded-3 mb-3 position-relative"
        style={{
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          height: 90,
        }}
      >
        <button
          className="btn btn-light btn-sm position-absolute d-flex align-items-center gap-1 shadow-sm"
          style={{ top: 12, right: 12 }}
          onClick={() => navigate("/students")}
        >
          <ArrowBackIcon style={{ fontSize: 16 }} />
          Back
        </button>
      </div>

      <div className="row g-3" style={{ marginTop: -70 }}>
        {/* --- Left: Profile sidebar --- */}
        <div className="col-12 col-lg-3">
          <div
            className="card shadow-sm border-0 rounded-4 text-center p-3"
            style={{ position: "sticky", top: 16 }}
          >
            <div className="mx-auto mb-2">
              <Avatar
                src={getImageUrl(personal?.photo)}
                initials={`${personal?.firstName?.[0] || ""}${personal?.lastName?.[0] || ""}`.toUpperCase()}
                size={92}
              />
            </div>

            <div className="fw-bold fs-5">
              {personal?.firstName} {personal?.lastName}
            </div>
            <div className="text-muted small mt-1">
              {academic?.class?.className} · Section{" "}
              {academic?.section?.sectionName}
            </div>

            <div className="mt-2 d-flex justify-content-center gap-2">
              <span
                className={`badge rounded-pill ${academic?.status === "Active" ? "bg-success" : "bg-secondary"} bg-opacity-75 px-3 py-1`}
              >
                {academic?.status}
              </span>
              {academic?.academicYear?.name && (
                <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-1">
                  {academic.academicYear.name}
                </span>
              )}
            </div>

            <hr />

            <div className="text-start small">
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Admission no.</span>
                <span className="fw-medium">{academic?.admissionNumber}</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Roll no.</span>
                <span className="fw-medium">{academic?.rollNo || "—"}</span>
              </div>
            </div>

            <button
              className="btn btn-primary w-100 mt-3 d-flex align-items-center justify-content-center gap-1 rounded-3"
              onClick={() => navigate(`/students/edit/${id}`)}
            >
              <EditIcon style={{ fontSize: 18 }} />
              Edit Profile
            </button>
          </div>
        </div>

        {/* --- Right: Tabbed detail sections --- */}
        <div className="col-12 col-lg-9">
          <div
            className="card shadow-sm border-0 rounded-4 p-1"
            style={{ marginTop: 70 }}
          >
            <Tab.Container
              activeKey={activeTab}
              onSelect={(key) => setActiveTab(key)}
            >
              <Nav
                variant="pills"
                className="gap-1 p-2 flex-nowrap overflow-auto"
              >
                <Nav.Item>
                  <Nav.Link
                    eventKey="personal"
                    className="d-flex align-items-center gap-1 rounded-3"
                  >
                    <PersonIcon style={{ fontSize: 17 }} />
                    Personal
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    eventKey="academic"
                    className="d-flex align-items-center gap-1 rounded-3"
                  >
                    <SchoolIcon style={{ fontSize: 17 }} />
                    Academic
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    eventKey="health"
                    className="d-flex align-items-center gap-1 rounded-3"
                  >
                    <FavoriteIcon style={{ fontSize: 17 }} />
                    Health
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    eventKey="family"
                    className="d-flex align-items-center gap-1 rounded-3"
                  >
                    <GroupIcon style={{ fontSize: 17 }} />
                    Family
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    eventKey="address"
                    className="d-flex align-items-center gap-1 rounded-3"
                  >
                    <HomeIcon style={{ fontSize: 17 }} />
                    Address
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content className="p-3">
                {/* --- Personal --- */}
                <Tab.Pane eventKey="personal">
                  <div className="row">
                    <InfoRow
                      label="Date of Birth"
                      value={formatDate(personal?.dob)}
                    />
                    <InfoRow label="Gender" value={personal?.gender} />
                    <InfoRow label="Mobile" value={personal?.mobileNumber} />
                    <InfoRow label="Email" value={personal?.email} />
                    <InfoRow label="Aadhaar No." value={personal?.aadhaarNo} />
                    <InfoRow label="Religion" value={personal?.religion} />
                    <InfoRow
                      label="Category"
                      value={personal?.category?.categoryName}
                    />
                    <InfoRow label="Caste Name" value={personal?.casteName} />
                    <InfoRow
                      label="Mother Tongue"
                      value={personal?.motherTongue}
                    />
                  </div>
                </Tab.Pane>

                {/* --- Academic --- */}
                <Tab.Pane eventKey="academic">
                  <div className="row">
                    <InfoRow
                      label="Admission No."
                      value={academic?.admissionNumber}
                    />
                    <InfoRow
                      label="Admission Date"
                      value={formatDate(academic?.admissionDate)}
                    />
                    <InfoRow
                      label="Academic Year"
                      value={academic?.academicYear?.name}
                    />
                    <InfoRow label="Class" value={academic?.class?.className} />
                    <InfoRow
                      label="Section"
                      value={academic?.section?.sectionName}
                    />
                    <InfoRow label="Roll No." value={academic?.rollNo} />
                    <InfoRow label="House" value={academic?.house?.houseName} />
                    <InfoRow label="Status" value={academic?.status} />
                  </div>
                </Tab.Pane>

                {/* --- Health --- */}
                <Tab.Pane eventKey="health">
                  <div className="row">
                    <InfoRow label="Blood Group" value={health?.bloodGroup} />
                    <InfoRow label="Height (cm)" value={health?.height} />
                    <InfoRow label="Weight (kg)" value={health?.weight} />
                  </div>
                  {health?.medicalHistory && (
                    <div className="mt-2 p-3 bg-light rounded-3">
                      <div
                        className="text-muted small text-uppercase mb-1"
                        style={{ fontSize: 11 }}
                      >
                        Medical History
                      </div>
                      <div>{health.medicalHistory}</div>
                    </div>
                  )}
                </Tab.Pane>

                {/* --- Family (Parent / Guardian) with photos --- */}
                <Tab.Pane eventKey="family">
                  <div className="d-flex flex-column gap-2">
                    <PersonCard
                      label="Father"
                      name={parent?.fatherName}
                      phone={parent?.fatherPhone}
                      extra={parent?.fatherOccupation}
                      photo={getImageUrl(parent?.fatherPhoto)}
                    />
                    <hr className="my-1" />
                    <PersonCard
                      label="Mother"
                      name={parent?.motherName}
                      phone={parent?.motherPhone}
                      extra={parent?.motherOccupation}
                      photo={getImageUrl(parent?.motherPhoto)}
                    />
                    <hr className="my-1" />
                    <PersonCard
                      label={`Guardian (${parent?.guardianIs || "—"})`}
                      name={parent?.guardianName}
                      phone={parent?.guardianPhone}
                      extra={parent?.guardianOccupation}
                      photo={getImageUrl(parent?.guardianPhoto)}
                    />
                  </div>

                  {(parent?.guardianEmail ||
                    parent?.guardianRelation ||
                    parent?.guardianAddress) && (
                    <div className="row mt-3 pt-3 border-top">
                      <InfoRow
                        label="Guardian Relation"
                        value={parent?.guardianRelation}
                      />
                      <InfoRow
                        label="Guardian Email"
                        value={parent?.guardianEmail}
                      />
                      {parent?.guardianAddress && (
                        <div className="col-12 mb-3">
                          <div
                            className="text-muted small text-uppercase"
                            style={{ fontSize: 11 }}
                          >
                            Guardian Address
                          </div>
                          <div className="fw-semibold">
                            {parent.guardianAddress}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Tab.Pane>

                {/* --- Address --- */}
                <Tab.Pane eventKey="address">
                  <div className="row">
                    <InfoRow
                      label="Current Address"
                      value={address?.currentAddress}
                    />
                    <InfoRow
                      label="Permanent Address"
                      value={address?.permanentAddress}
                    />
                  </div>
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
