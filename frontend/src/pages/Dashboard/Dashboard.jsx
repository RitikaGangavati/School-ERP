import MainLayout from "../../components/layout/MainLayout";

const cards = [
  { title: "Students", value: 1250 },
  { title: "Teachers", value: 85 },
  { title: "Classes", value: 30 },
  { title: "Today's Attendance", value: "92%" },
];

export default function Dashboard() {
  return (
    <MainLayout>
      <div style={{ backgroundColor: "#fafafa", minHeight: "100vh" }}>
        <h2 className="fw-bold mb-4">Dashboard</h2>

        <div className="row g-3">
          {cards.map((card, index) => (
            <div className="col-12 col-sm-6 col-md-3" key={index}>
              <div className="card shadow-sm rounded-3">
                <div className="card-body">
                  <p className="text-muted mb-1">{card.title}</p>
                  <h3 className="fw-bold mb-0">{card.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card shadow-sm rounded-3 mt-4">
          <div className="card-body p-4">
            <h5 className="mb-3">Welcome to School ERP 🎓</h5>

            <p className="text-muted mb-3">
              Your dashboard is working successfully.
              <br />
              Next we'll add:
            </p>

            <ul className="mt-2">
              <li>Responsive Sidebar</li>
              <li>Top Navbar</li>
              <li>Charts</li>
              <li>Recent Students</li>
              <li>Fee Collection</li>
              <li>Attendance Report</li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}