import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MeetingRoom from "../pages/MeetingRoom";

const PrivateRoutes = () => {
    const { user } = useAuth();

    return (
        <Routes>
            {!user ? (
                <Route path="*" element={<Navigate to="/" />} />
            ) : (
                <>
                    <Route path="/:roomId" element={<MeetingRoom />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </>
            )}
        </Routes>
    );
};

export default PrivateRoutes;
