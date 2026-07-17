import { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Box,
  Tooltip,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SchoolIcon from "@mui/icons-material/School";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../redux/auth/authSlice";

export default function Navbar({ onMenuClick, drawerWidth }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);

  const [profileAnchor, setProfileAnchor] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);

  const isProfileOpen = Boolean(profileAnchor);
  const isNotifOpen = Boolean(notifAnchor);

  const handleLogout = () => {
    setProfileAnchor(null);
    dispatch(logout());
    navigate("/");
  };

  const notifications = [
    { id: 1, text: "New student registration pending approval" },
    { id: 2, text: "Fee payment received from Class 10-A" },
    { id: 3, text: "Staff meeting scheduled for tomorrow" },
  ];

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        bgcolor: "background.paper",
        color: "text.primary",
        borderBottom: "1px solid",
        borderColor: "divider",
        transition: (theme) =>
          theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Left: Menu toggle + Logo/Title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={onMenuClick} edge="start" sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>

          <SchoolIcon color="primary" />
          <Typography
            variant="h6"
            noWrap
            fontWeight="bold"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            School ERP
          </Typography>
        </Box>

        {/* Right: Notifications + Profile */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Notifications">
            <IconButton
              onClick={(e) => setNotifAnchor(e.currentTarget)}
              color="inherit"
            >
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={notifAnchor}
            open={isNotifOpen}
            onClose={() => setNotifAnchor(null)}
            PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
          >
            <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
              Notifications
            </Typography>
            <Divider />
            {notifications.map((n) => (
              <MenuItem
                key={n.id}
                onClick={() => setNotifAnchor(null)}
                sx={{ whiteSpace: "normal" }}
              >
                <Typography variant="body2">{n.text}</Typography>
              </MenuItem>
            ))}
          </Menu>

          <Tooltip title="Account">
            <IconButton
              onClick={(e) => setProfileAnchor(e.currentTarget)}
              size="small"
              sx={{ ml: 1 }}
            >
              <Avatar
                sx={{ width: 36, height: 36, bgcolor: "primary.main" }}
                src={user?.avatar}
              >
                {user?.firstName?.[0]?.toUpperCase() || "U"}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={profileAnchor}
            open={isProfileOpen}
            onClose={() => setProfileAnchor(null)}
            PaperProps={{ sx: { width: 220 } }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" noWrap>
                {user ? `${user.firstName} ${user.lastName}` : "Guest User"}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.role || ""}
              </Typography>
            </Box>

            <Divider />

            <MenuItem
              onClick={() => {
                setProfileAnchor(null);
                navigate("/profile");
              }}
            >
              <ListItemIcon>
                <PersonOutlineIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>

            <MenuItem
              onClick={() => {
                setProfileAnchor(null);
                navigate("/settings");
              }}
            >
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
