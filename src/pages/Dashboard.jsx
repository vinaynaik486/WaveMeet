import React from "react";
import { useAuth } from "../context/AuthContext";
import MeetingDashboard from "../components/meeting/Dashboard";

function Dashboard() {
    const { user } = useAuth();

    if (!user) {
        return <p>Loading...</p>;
    }

    return (
        <div className="dashboard-page">
            <MeetingDashboard />
        </div>
    );
}

export default Dashboard; 