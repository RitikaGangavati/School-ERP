import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
} from "@mui/material";

import MainLayout from "../../components/layout/MainLayout";


const cards = [
  { title: "Students", value: 1250 },
  { title: "Teachers", value: 85 },
  { title: "Classes", value: 30 },
  { title: "Today's Attendance", value: "92%" },
];

export default function Dashboard() {
  return (
    <>
    <MainLayout>
    <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh", p: 3 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              elevation={3}
              sx={{
                borderRadius: 3,
              }}
            >
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  {card.title}
                </Typography>

                <Typography variant="h4" fontWeight="bold">
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper
        elevation={3}
        sx={{
          mt: 4,
          p: 3,
          borderRadius: 3,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Welcome to School ERP 🎓
        </Typography>

        <Typography color="text.secondary">
          Your dashboard is working successfully.
          <br />
          Next we'll add:
        </Typography>

        <Box component="ul" sx={{ mt: 2 }}>
          <li>Responsive Sidebar</li>
          <li>Top Navbar</li>
          <li>Charts</li>
          <li>Recent Students</li>
          <li>Fee Collection</li>
          <li>Attendance Report</li>
        </Box>
      </Paper>
    </Box>
    </MainLayout>
    </>
  );
}