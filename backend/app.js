const express = require('express');
const app = express();
require('dotenv').config();
const connectDB = require('./db/connect');
const cors = require('cors');

// database connect
connectDB();

//Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

const authRT = require("./routes/authRT");

app.use('/api/auth',authRT);


//Route test
app.get("/", (req, res) => {
    res.send("School ERP Backend Running");
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});

