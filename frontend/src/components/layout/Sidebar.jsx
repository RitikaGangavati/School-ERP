import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Offcanvas } from "react-bootstrap";
import { COLORS } from "../../theme/colors";

import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ClassIcon from "@mui/icons-material/ClassOutlined";
import MenuBookIcon from "@mui/icons-material/MenuBookOutlined";
import CollectionsBookmarkIcon from "@mui/icons-material/CollectionsBookmarkOutlined";
import EventNoteIcon from "@mui/icons-material/EventNoteOutlined";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import PeopleAltIcon from "@mui/icons-material/PeopleAltOutlined";
import GroupsIcon from "@mui/icons-material/GroupsOutlined";
import SchoolIcon from "@mui/icons-material/SchoolOutlined";
import FactCheckIcon from "@mui/icons-material/FactCheckOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboardOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import Diversity3Icon from "@mui/icons-material/Diversity3Outlined";
import BuildCircleIcon from "@mui/icons-material/BuildCircleOutlined";
import DashboardIcon from "@mui/icons-material/DashboardOutlined";

export const DRAWER_WIDTH = 270;
export const DRAWER_WIDTH_COLLAPSED = 76;

const menuGroups = [
  {
    label: "General",
    groupIcon: <SpaceDashboardIcon />,
    items: [{ label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> }],
  },
  {
    label: "Academics",
    groupIcon: <MenuBookOutlinedIcon />,
    items: [
      { label: "Assign Class Teachers", path: "/class-teachers" },
      { label: "Subject Group", path: "/subject-groups" },
      { label: "Classes", path: "/classes" },
      { label: "Sections", path: "/sections" },
      { label: "Subjects", path: "/subjects" },
      { label: "Academic Year", path: "/academic-years"},
    ],
  },
  {
    label: "People",
    groupIcon: <Diversity3Icon />,
    items: [
      { label: "Roles", path: "/roles" },
      { label: "Users", path: "/users" },
      { label: "Teachers", path: "/teachers" },
    ],
  },
  {
    label: "Student Information",
    groupIcon: <Diversity3Icon />,
    items: [
      { label: "Students", path: "/students" },
      { label: "Student Category", path: "/category" },
      { label: "Student House", path: "/house" },
      
      

    ],
  },
  {
    label: "Operations",
    groupIcon: <BuildCircleIcon />,
    items: [
      { label: "Attendance", path: "/attendance" },
      { label: "Settings", path: "/settings" },
   
    ],
  },
];

export default function Sidebar({
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
  isMobile,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    menuGroups.forEach((group) => {
      initial[group.label] = group.items.some(
        (item) => item.path === location.pathname
      );
    });
    if (!Object.values(initial).some(Boolean)) {
      initial[menuGroups[0].label] = true;
    }
    return initial;
  });

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) onMobileClose();
  };

  const menuContent = (
    <div
      className="d-flex flex-column h-100"
      style={{ background: COLORS.sidebarBg }}
    >
      {!isMobile && (
        <>
          <div
            className={`d-flex align-items-center ${
              collapsed ? "justify-content-center" : "justify-content-end"
            } p-2`}
            style={{ minHeight: 56 }}
          >
            <button
              className="btn btn-sm"
              onClick={onToggleCollapse}
              style={{
                background: COLORS.hoverBg,
                color: COLORS.textPrimary,
                border: "none",
              }}
            >
              {collapsed ? (
                <ChevronRightIcon fontSize="small" />
              ) : (
                <ChevronLeftIcon fontSize="small" />
              )}
            </button>
          </div>
          <hr className="my-0" style={{ borderColor: COLORS.divider, opacity: 1 }} />
        </>
      )}

      <nav className="flex-grow-1 overflow-auto p-2">
        {menuGroups.map((group, idx) => {
          const isOpen = collapsed && !isMobile ? true : !!openGroups[group.label];
          const groupHasActive = group.items.some((i) => i.path === location.pathname);

          return (
            <div key={group.label} className={idx !== 0 ? "mt-1" : ""}>
              {/* --- Main menu header (icon + name) --- */}
              <button
                onClick={() => toggleGroup(group.label)}
                className={`btn w-100 d-flex align-items-center gap-2 mb-1 rounded-3 border-0 ${
                  collapsed && !isMobile ? "justify-content-center" : "justify-content-between"
                }`}
                style={{
                  height: 48,
                  background: groupHasActive && !isOpen ? COLORS.hoverBg : "transparent",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.hoverBg)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    groupHasActive && !isOpen ? COLORS.hoverBg : "transparent")
                }
              >
                <span className="d-flex align-items-center gap-2">
                  <span
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 26, height: 26, color: COLORS.groupIcon }}
                  >
                    {group.groupIcon}
                  </span>
                  {(!collapsed || isMobile) && (
                    <span
                      className="text-truncate"
                      style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary }}
                    >
                      {group.label}
                    </span>
                  )}
                </span>

                {(!collapsed || isMobile) && (
                  <ExpandMoreIcon
                    style={{
                      fontSize: 20,
                      color: COLORS.textMuted,
                      transition: "transform 0.2s ease",
                      transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>

              {/* --- Sub menu items: naming only, no icons --- */}
              <div
                style={{
                  maxHeight: isOpen ? group.items.length * 44 + 8 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.25s ease",
                }}
              >
                <div
                  className={collapsed && !isMobile ? "" : "ps-3 ms-1"}
                  style={{
                    borderLeft:
                      collapsed && !isMobile ? "none" : `1px solid ${COLORS.divider}`,
                  }}
                >
                {group.items.map((item) => {
  const isActive = location.pathname === item.path;
  return (
    <button
      key={item.path}
      onClick={() => handleNavigate(item.path)}
      className={`btn w-100 text-start d-flex align-items-center mb-2 border-0 ${
        collapsed && !isMobile ? "justify-content-center" : ""
      }`}
      style={{
        height: 42,
        borderRadius: 10,                 // rounded rectangle, not full pill
        background: isActive ? COLORS.activeBg : "transparent",
        color: isActive ? COLORS.activeText : COLORS.textMuted,
        fontWeight: isActive ? 600 : 500,
        paddingLeft: 16,                  // even padding, no accent bar offset
        transition: "background 0.15s ease, color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = COLORS.hoverBg;
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
      title={collapsed && !isMobile ? item.label : ""}
    >
      {(!collapsed || isMobile) ? (
        <span className="text-truncate" style={{ fontSize: 13.5 }}>
          {item.label}
        </span>
      ) : (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isActive ? COLORS.activeAccent : COLORS.textMuted,
          }}
        />
      )}
    </button>
  );
})}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );

  if (isMobile) {
    return (
      <Offcanvas show={mobileOpen} onHide={onMobileClose} responsive="md">
        <Offcanvas.Header
          closeButton
          style={{ background: COLORS.sidebarBg, color: COLORS.textPrimary }}
        >
          <Offcanvas.Title className="fs-6 fw-bold">Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">{menuContent}</Offcanvas.Body>
      </Offcanvas>
    );
  }

  return (
    <div
      className="position-fixed top-0 start-0 h-100"
      style={{
        width: collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
        transition: "width 0.2s ease",
        overflowX: "hidden",
        zIndex: 1020,
        boxShadow: "2px 0 12px rgba(0,0,0,0.15)",
      }}
    >
      {menuContent}
    </div>
  );
}