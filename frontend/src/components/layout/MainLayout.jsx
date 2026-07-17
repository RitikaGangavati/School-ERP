import { useState } from "react";
import { Box, Toolbar, useMediaQuery, useTheme } from "@mui/material";

import Sidebar, { DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED } from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function MainLayout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const currentDrawerWidth = isMobile
    ? 0
    : collapsed
      ? DRAWER_WIDTH_COLLAPSED
      : DRAWER_WIDTH;

  const handleMenuClick = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Navbar onMenuClick={handleMenuClick} drawerWidth={currentDrawerWidth} />

      <Sidebar
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          minWidth: 0, // allow this flex child to shrink below its content's natural width
          overflowX: "hidden", // prevent this container from ever scrolling horizontally
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        {/* Spacer to offset the fixed Navbar height */}
        <Toolbar />

        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            bgcolor: "#f7f9fc",
            minWidth: 0, // same fix, one level deeper
            overflowX: "hidden",
          }}
        >
          {children}
        </Box>

        <Footer />
      </Box>
    </Box>
  );
}
