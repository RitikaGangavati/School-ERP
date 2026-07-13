import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {

    return (

        <Routes>

            <Route  path="/" element={<Login />}/>
            <Route path="/dashboard" element={ <ProtectedRoute> <Dashboard /> </ProtectedRoute>} />
            

        </Routes>

    );

}
