export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-top bg-white text-center py-3">
      <span className="text-muted small">
        © {currentYear} School ERP. All rights reserved.
      </span>
    </footer>
  );
}