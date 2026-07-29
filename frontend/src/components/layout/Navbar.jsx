import { useState } from "react";
import { Navbar as BSNavbar, Container, Dropdown, Badge } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../redux/auth/authSlice";

import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SchoolIcon from "@mui/icons-material/School";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";

export default function Navbar({ onMenuClick, drawerWidth }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const notifications = [
    { id: 1, text: "New student registration pending approval" },
    { id: 2, text: "Fee payment received from Class 10-A" },
    { id: 3, text: "Staff meeting scheduled for tomorrow" },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <BSNavbar
      bg="white"
      fixed="top"
      className="border-bottom shadow-sm"
      style={{
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: "all 0.2s ease",
        zIndex: 1030,
      }}
    >
      <Container fluid className="d-flex justify-content-between align-items-center">
        {/* Left: Menu toggle + Logo/Title */}
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-light border-0 d-flex align-items-center"
            onClick={onMenuClick}
          >
            <MenuIcon />
          </button>

          <SchoolIcon color="primary" />
          <span className="fw-bold fs-5 d-none d-sm-inline">School ERP</span>
        </div>

        {/* Right: Notifications + Profile */}
        <div className="d-flex align-items-center gap-2">
          <Dropdown align="end">
            <Dropdown.Toggle
              as="button"
              className="btn btn-light border-0 position-relative d-flex align-items-center"
              id="notif-dropdown"
            >
              <NotificationsNoneIcon />
              {notifications.length > 0 && (
                <Badge
                  bg="danger"
                  pill
                  className="position-absolute top-0 start-100 translate-middle"
                  style={{ fontSize: "0.6rem" }}
                >
                  {notifications.length}
                </Badge>
              )}
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ width: 320, maxHeight: 400, overflowY: "auto" }}>
              <Dropdown.Header>Notifications</Dropdown.Header>
              <Dropdown.Divider />
              {notifications.map((n) => (
                <Dropdown.Item key={n.id} style={{ whiteSpace: "normal" }}>
                  {n.text}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown align="end">
            <Dropdown.Toggle
              as="button"
              className="btn btn-light border-0 rounded-circle d-flex align-items-center justify-content-center p-0"
              id="profile-dropdown"
              style={{ width: 36, height: 36, backgroundColor: "#1976d2", color: "#fff" }}
            >
              {user?.firstName?.[0]?.toUpperCase() || "U"}
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ width: 220 }}>
              <div className="px-3 py-2">
                <div className="fw-bold text-truncate">
                  {user ? `${user.firstName} ${user.lastName}` : "Guest User"}
                </div>
                <div className="text-muted small text-truncate">
                  {user?.role || ""}
                </div>
              </div>

              <Dropdown.Divider />

              <Dropdown.Item onClick={() => navigate("/profile")}>
                <PersonOutlineIcon fontSize="small" className="me-2" />
                Profile
              </Dropdown.Item>

              <Dropdown.Item onClick={() => navigate("/settings")}>
                <SettingsIcon fontSize="small" className="me-2" />
                Settings
              </Dropdown.Item>

              <Dropdown.Divider />

              <Dropdown.Item onClick={handleLogout} className="text-danger">
                <LogoutIcon fontSize="small" className="me-2" color="error" />
                Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </Container>
    </BSNavbar>
  );
}