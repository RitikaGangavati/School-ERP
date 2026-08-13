import { useState, useEffect } from "react";
import Sidebar, { DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED } from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function MainLayout({ children }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    <div className="d-flex" style={{ minHeight: "100vh", width: "100%" }}>
      <Navbar onMenuClick={handleMenuClick} drawerWidth={currentDrawerWidth} />

      <Sidebar
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      <div
        className="d-flex flex-column flex-grow-1"
        style={{
          marginLeft: isMobile ? 0 : currentDrawerWidth,
          minWidth: 0,
          transition: "margin-left 0.2s ease",
          width: "100%", // Explicit full width
        }}
      >
        <div style={{ height: 56, flexShrink: 0 }} /> {/* Navbar spacer */}
        <main className="flex-grow-1 p-3 p-sm-4">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
