import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Box,
  Typography,
  Tooltip,
  IconButton,
} from "@mui/material";

import { COLORS } from "../../theme/colors";

// Main icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import SchoolIcon from "@mui/icons-material/School";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

// Academic icons
import MenuBookIcon from "@mui/icons-material/MenuBook";
import TuneIcon from "@mui/icons-material/Tune";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ClassIcon from "@mui/icons-material/Class";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import CategoryIcon from "@mui/icons-material/Category";

// Teaching icons
import GroupsIcon from "@mui/icons-material/Groups";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";

// Timetable icons
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarViewWeekIcon from "@mui/icons-material/CalendarViewWeek";
import TodayIcon from "@mui/icons-material/Today";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";

// Student icons
import PersonIcon from "@mui/icons-material/Person";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

// People icons
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

// Arrow icons
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

// Close icon
import CloseIcon from "@mui/icons-material/Close";

// ============================================================
// DRAWER WIDTH
// ============================================================

export const DRAWER_WIDTH = 310;
export const DRAWER_WIDTH_COLLAPSED = 76;


// ============================================================
// MENU STRUCTURE
// ============================================================

const MENU_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: DashboardIcon,
    path: "/dashboard",
  },

  // ==========================================================
  // ACADEMICS
  // ==========================================================

  {
    key: "academics",
    label: "Academics",
    icon: SchoolIcon,
    children: [
      {
        key: "academic-setup",
        label: "Academic Setup",
        icon: TuneIcon,
        children: [
          {
            key: "academic-year",
            label: "Academic Year",
            icon: CalendarMonthIcon,
            path: "/academic-years",
          },
          {
            key: "classes",
            label: "Classes",
            icon: ClassIcon,
            path: "/classes",
          },
          {
            key: "sections",
            label: "Sections",
            icon: AccountTreeIcon,
            path: "/sections",
          },
          {
            key: "subjects",
            label: "Subjects",
            icon: LibraryBooksIcon,
            path: "/subjects",
          },
          {
            key: "subject-groups",
            label: "Subject Groups",
            icon: CategoryIcon,
            path: "/subject-groups",
          },
        ],
      },

      {
        key: "teaching",
        label: "Teaching",
        icon: GroupsIcon,
        children: [
          {
            key: "teachers",
            label: "Teachers",
            icon: PersonIcon,
            path: "/teachers",
          },
          {
            key: "class-teachers",
            label: "Assign Class Teachers",
            icon: AssignmentIndIcon,
            path: "/class-teachers",
          },
          {
            key: "subject-teachers",
            label: "Assign Subject Teachers",
            icon: PersonAddAlt1Icon,
            path: "/subject-teachers",
          },
        ],
      },

      {
        key: "timetable",
        label: "Timetable",
        icon: AccessTimeIcon,
        children: [
          {
            key: "time-slots",
            label: "Time Slots",
            icon: AccessTimeIcon,
            path: "/time-slots",
          },
          {
            key: "weekly-periods",
            label: "Weekly Periods",
            icon: EventRepeatIcon,
            path: "/weekly-periods",
          },
          {
            key: "class-timetable",
            label: "Class Timetable",
            icon: CalendarViewWeekIcon,
            path: "/time-table",
          },
          {
            key: "teacher-timetable",
            label: "Teacher Timetable",
            icon: TodayIcon,
            path: "/teacher-timetable",
          },
        ],
      },
    ],
  },

  // ==========================================================
  // STUDENTS
  // ==========================================================

  {
    key: "students",
    label: "Students",
    icon: PeopleIcon,
    children: [
      {
        key: "student-list",
        label: "Students",
        icon: PersonIcon,
        path: "/students",
      },
      {
        key: "student-category",
        label: "Student Categories",
        icon: CategoryIcon,
        path: "/category",
      },
      {
        key: "student-houses",
        label: "Student Houses",
        icon: HomeWorkIcon,
        path: "/house",
      },
      {
        key: "student-promotion",
        label: "Student Promotion",
        icon: TrendingUpIcon,
        path: "/student-promotion",
      },
    ],
  },

  // ==========================================================
  // PEOPLE
  // ==========================================================

  {
    key: "people",
    label: "People",
    icon: ManageAccountsIcon,
    children: [
      {
        key: "users",
        label: "Users",
        icon: PeopleIcon,
        path: "/users",
      },
      {
        key: "roles",
        label: "Roles",
        icon: AdminPanelSettingsIcon,
        path: "/roles",
      },
    ],
  },

  // ==========================================================
  // ATTENDANCE
  // ==========================================================

  {
    key: "attendance",
    label: "Attendance",
    icon: EventAvailableIcon,
    path: "/attendance",
  },

  // ==========================================================
  // SETTINGS
  // ==========================================================

  {
    key: "settings",
    label: "Settings",
    icon: SettingsIcon,
    path: "/settings",
  },
];


// ============================================================
// CHECK ACTIVE CHILD
// ============================================================

function hasActiveChild(item, pathname) {
  if (item.path) {
    return pathname === item.path;
  }

  if (!item.children) {
    return false;
  }

  return item.children.some((child) =>
    hasActiveChild(child, pathname)
  );
}


// ============================================================
// GET PARENT KEYS FOR CURRENT PATH
// ============================================================

function getActiveParentKeys(items, pathname, parents = []) {
  for (const item of items) {
    if (item.path === pathname) {
      return parents;
    }

    if (item.children) {
      const result = getActiveParentKeys(
        item.children,
        pathname,
        [...parents, item.key]
      );

      if (result.length > 0) {
        return result;
      }
    }
  }

  return [];
}


// ============================================================
// SIDEBAR
// ============================================================

export default function Sidebar({
  isMobile,
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
}) {
  const location = useLocation();

  const [openGroups, setOpenGroups] = useState({});


  // ==========================================================
  // AUTOMATICALLY OPEN CURRENT MENU
  // ==========================================================

  useEffect(() => {
    const activeParents = getActiveParentKeys(
      MENU_ITEMS,
      location.pathname
    );

    if (activeParents.length > 0) {
      setOpenGroups((prev) => {
        const updated = { ...prev };

        activeParents.forEach((key) => {
          updated[key] = true;
        });

        return updated;
      });
    }
  }, [location.pathname]);


  // ==========================================================
  // TOGGLE GROUP
  // ==========================================================

  const handleGroupClick = (item) => {
    // --------------------------------------------------------
    // If sidebar is collapsed:
    // automatically expand it first
    // --------------------------------------------------------

    if (collapsed && !isMobile) {
      onToggleCollapse();

      setOpenGroups((prev) => ({
        ...prev,
        [item.key]: true,
      }));

      return;
    }

    // --------------------------------------------------------
    // Normal expanded state
    // --------------------------------------------------------

    setOpenGroups((prev) => ({
      ...prev,
      [item.key]: !prev[item.key],
    }));
  };


  // ==========================================================
  // CLOSE MOBILE SIDEBAR AFTER NAVIGATION
  // ==========================================================

  const handleLinkClick = () => {
    if (isMobile) {
      onMobileClose();
    }
  };


  // ==========================================================
  // RENDER CHILDREN
  // ==========================================================

  const renderChildren = (items, level = 0) => {
    return items.map((item) => {
      if (item.children) {
        return (
          <MenuGroup
            key={item.key}
            item={item}
            level={level}
            collapsed={collapsed}
            openGroups={openGroups}
            onGroupClick={handleGroupClick}
            renderChildren={renderChildren}
          />
        );
      }

      return (
        <MenuLink
          key={item.key}
          item={item}
          level={level}
          collapsed={collapsed}
          onClick={handleLinkClick}
        />
      );
    });
  };


  // ==========================================================
  // SIDEBAR WIDTH
  // ==========================================================

  const sidebarWidth = isMobile
    ? DRAWER_WIDTH
    : collapsed
    ? DRAWER_WIDTH_COLLAPSED
    : DRAWER_WIDTH;


  // ==========================================================
  // SIDEBAR
  // ==========================================================

  return (
    <>
      {/* ====================================================
          MOBILE OVERLAY
      ==================================================== */}

      {isMobile && mobileOpen && (
        <Box
          onClick={onMobileClose}
          sx={{
            position: "fixed",
            inset: 0,

            backgroundColor:
              "rgba(15,23,42,0.55)",

            zIndex: 1199,
          }}
        />
      )}


      {/* ====================================================
          SIDEBAR
      ==================================================== */}

      <Box
        component="aside"
        sx={{
          position: "fixed",

          top: 0,
          left: 0,
          bottom: 0,

          width: sidebarWidth,

          backgroundColor:
            COLORS.sidebarBg,

          color: COLORS.textPrimary,

          zIndex: 1200,

          display: "flex",
          flexDirection: "column",

          transition:
            "width 0.2s ease, transform 0.25s ease",

          transform:
            isMobile
              ? mobileOpen
                ? "translateX(0)"
                : "translateX(-100%)"
              : "translateX(0)",

          boxShadow:
            isMobile
              ? "4px 0 20px rgba(0,0,0,0.18)"
              : "none",

          overflow: "hidden",
        }}
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <Box
          sx={{
            height: 80,

            minHeight: 80,

            px:
              collapsed && !isMobile
                ? 1
                : 2,

            display: "flex",
            alignItems: "center",

            borderBottom:
              `1px solid ${COLORS.divider}`,
          }}
        >

          {/* LOGO */}

          <Box
            sx={{
              width: 42,
              height: 42,

              minWidth: 42,

              borderRadius: "11px",

              backgroundColor:
                COLORS.sidebarBgSoft,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              fontSize: 23,

              mr:
                collapsed && !isMobile
                  ? 0
                  : 1.5,
            }}
          >
            🏫
          </Box>


          {/* TITLE */}

          {(!collapsed || isMobile) && (
            <Box
              sx={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: "18px",
                  fontWeight: 700,

                  color:
                    COLORS.textPrimary,

                  lineHeight: 1.2,
                }}
              >
                School ERP
              </Typography>

              <Typography
                sx={{
                  fontSize: "12px",

                  color:
                    COLORS.textMuted,

                  mt: 0.4,
                }}
              >
                Administration
              </Typography>
            </Box>
          )}


          {/* MOBILE CLOSE */}

          {isMobile && (
            <IconButton
              onClick={onMobileClose}
              sx={{
                color:
                  COLORS.textMuted,

                ml: "auto",

                "&:hover": {
                  backgroundColor:
                    COLORS.hoverBg,

                  color:
                    COLORS.textPrimary,
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>


        {/* ==================================================
            MAIN MENU TITLE
        ================================================== */}

        {(!collapsed || isMobile) && (
          <Typography
            sx={{
              px: 2,

              pt: 2.5,
              pb: 1.25,

              fontSize: "13px",

              fontWeight: 700,

              letterSpacing: "0.5px",

              color:
                COLORS.textMuted,
            }}
          >
            MAIN MENU
          </Typography>
        )}


        {/* ==================================================
            MENU
        ================================================== */}

        <Box
          sx={{
            flex: 1,

            overflowY: "auto",
            overflowX: "hidden",

            px:
              collapsed && !isMobile
                ? 1
                : 0.75,

            pb: 2,

            "&::-webkit-scrollbar": {
              width: "6px",
            },

            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },

            "&::-webkit-scrollbar-thumb": {
              backgroundColor:
                "rgba(255,255,255,0.25)",

              borderRadius: "10px",
            },

            scrollbarWidth: "thin",

            scrollbarColor:
              "rgba(255,255,255,0.25) transparent",
          }}
        >
          {renderChildren(MENU_ITEMS)}
        </Box>
      </Box>
    </>
  );
}


// ============================================================
// MENU GROUP
// ============================================================

function MenuGroup({
  item,
  level,
  collapsed,
  openGroups,
  onGroupClick,
  renderChildren,
}) {
  const Icon = item.icon;

  const location = useLocation();

  const isOpen = !!openGroups[item.key];

  const hasActive = hasActiveChild(
    item,
    location.pathname
  );


  // ==========================================================
  // COLLAPSED
  // ==========================================================

  if (collapsed) {
    return (
      <Tooltip
        title={item.label}
        placement="right"
        arrow
      >
        <Box
          onClick={() =>
            onGroupClick(item)
          }
          sx={{
            width: 48,
            height: 46,

            mx: "auto",
            mb: 0.5,

            borderRadius: "10px",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            cursor: "pointer",

            color: hasActive
              ? COLORS.activeAccent
              : COLORS.textPrimary,

            backgroundColor:
              hasActive
                ? "rgba(255,255,255,0.08)"
                : "transparent",

            "&:hover": {
              backgroundColor:
                COLORS.hoverBg,
            },
          }}
        >
          <Icon
            sx={{
              fontSize: 22,
            }}
          />
        </Box>
      </Tooltip>
    );
  }


  // ==========================================================
  // EXPANDED
  // ==========================================================

  return (
    <Box
      sx={{
        mb: 0.3,
      }}
    >

      {/* ====================================================
          GROUP HEADER
      ==================================================== */}

      <Box
        onClick={() =>
          onGroupClick(item)
        }
        sx={{
          minHeight:
            level === 0
              ? 52
              : 45,

          px:
            level === 0
              ? 1.5
              : 1,

          ml:
            level === 0
              ? 0
              : 0.5,

          mr: 0.5,

          borderRadius: "10px",

          display: "flex",
          alignItems: "center",

          cursor: "pointer",

          color:
            level === 0
              ? COLORS.textPrimary
              : COLORS.textMuted,

          backgroundColor:
            hasActive && level === 0
              ? COLORS.sidebarBgSoft
              : "transparent",

          transition:
            "all 0.15s ease",

          "&:hover": {
            backgroundColor:
              COLORS.hoverBg,

            color:
              COLORS.textPrimary,
          },
        }}
      >

        {/* ICON */}

        <Icon
          sx={{
            fontSize:
              level === 0
                ? 22
                : 20,

            mr: 1.25,

            flexShrink: 0,

            color:
              level === 0
                ? COLORS.textPrimary
                : COLORS.groupIcon,
          }}
        />


        {/* LABEL */}

        <Box
          sx={{
            flex: 1,

            minWidth: 0,

            fontSize:
              level === 0
                ? "15px"
                : "14px",

            fontWeight:
              level === 0
                ? 600
                : 500,

            color:
              "inherit",

            // DO NOT CUT TEXT
            whiteSpace: "normal",

            overflow: "visible",

            textOverflow: "unset",

            lineHeight: 1.3,
          }}
        >
          {item.label}
        </Box>


        {/* ARROW */}

        {isOpen ? (
          <ExpandMoreIcon
            sx={{
              fontSize: 20,

              color:
                COLORS.textMuted,

              flexShrink: 0,
            }}
          />
        ) : (
          <ChevronRightIcon
            sx={{
              fontSize: 20,

              color:
                COLORS.textMuted,

              flexShrink: 0,
            }}
          />
        )}
      </Box>


      {/* ====================================================
          CHILDREN
      ==================================================== */}

      {isOpen && (
        <Box
          sx={{
            position: "relative",

            // SMALL INDENT
            ml:
              level === 0
                ? 2
                : 2,

            mt: 0.25,

            pl: 1,

            borderLeft:
              `1px solid ${COLORS.divider}`,
          }}
        >
          {renderChildren(
            item.children,
            level + 1
          )}
        </Box>
      )}
    </Box>
  );
}


// ============================================================
// MENU LINK
// ============================================================

function MenuLink({
  item,
  level,
  collapsed,
  onClick,
}) {
  const Icon = item.icon;


  // ==========================================================
  // COLLAPSED
  // ==========================================================

  if (collapsed) {
    return (
      <Tooltip
        title={item.label}
        placement="right"
        arrow
      >
        <NavLink
          to={item.path}
          onClick={onClick}
          style={{
            textDecoration: "none",
          }}
        >
          {({ isActive }) => (
            <Box
              sx={{
                width: 48,
                height: 46,

                mx: "auto",
                mb: 0.5,

                borderRadius: "10px",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                color:
                  isActive
                    ? COLORS.activeAccent
                    : COLORS.textPrimary,

                backgroundColor:
                  isActive
                    ? COLORS.activeBg
                    : "transparent",

                cursor: "pointer",

                "&:hover": {
                  backgroundColor:
                    isActive
                      ? COLORS.activeBg
                      : COLORS.hoverBg,
                },
              }}
            >
              <Icon
                sx={{
                  fontSize: 21,
                }}
              />
            </Box>
          )}
        </NavLink>
      </Tooltip>
    );
  }


  // ==========================================================
  // EXPANDED
  // ==========================================================

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      style={{
        textDecoration: "none",
      }}
    >
      {({ isActive }) => (
        <Box
          sx={{
            minHeight:
              level === 0
                ? 48
                : 44,

            px:
              level === 0
                ? 1.25
                : 1,

            ml: 0,

            mr: 0.5,

            mb: 0.25,

            borderRadius: "9px",

            display: "flex",
            alignItems: "center",

            cursor: "pointer",

            backgroundColor:
              isActive
                ? COLORS.activeBg
                : "transparent",

            color:
              isActive
                ? COLORS.activeText
                : level === 0
                ? COLORS.textPrimary
                : COLORS.textMuted,

            position: "relative",

            transition:
              "all 0.15s ease",

            "&:hover": {
              backgroundColor:
                isActive
                  ? COLORS.activeBg
                  : COLORS.hoverBg,

              color:
                isActive
                  ? COLORS.activeText
                  : COLORS.textPrimary,
            },
          }}
        >

          {/* ICON */}

          <Icon
            sx={{
              fontSize:
                level === 0
                  ? 21
                  : 19,

              mr: 1.25,

              flexShrink: 0,

              color:
                isActive
                  ? COLORS.activeAccent
                  : level === 0
                  ? COLORS.textPrimary
                  : COLORS.textMuted,
            }}
          />


          {/* TEXT */}

          <Box
            sx={{
              flex: 1,

              minWidth: 0,

              fontSize:
                level === 0
                  ? "15px"
                  : "14px",

              fontWeight:
                isActive
                  ? 600
                  : level === 0
                  ? 500
                  : 400,

              color:
                "inherit",

              // IMPORTANT:
              // don't truncate menu names

              whiteSpace: "normal",

              overflow: "visible",

              textOverflow: "unset",

              lineHeight: 1.3,

              wordBreak: "normal",
            }}
          >
            {item.label}
          </Box>


          {/* ACTIVE INDICATOR */}

          {isActive && (
            <Box
              sx={{
                position: "absolute",

                right: 7,

                top: "50%",

                transform:
                  "translateY(-50%)",

                width: 5,

                height: 27,

                borderRadius: "5px",

                backgroundColor:
                  COLORS.activeAccent,
              }}
            />
          )}
        </Box>
      )}
    </NavLink>
  );
}