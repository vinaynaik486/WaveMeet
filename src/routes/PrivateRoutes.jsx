import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import MeetingRoom from '../pages/MeetingRoom';

function PrivateRoutes() {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/" />;
    }

    return (
        <Routes>
            <Route path="/meeting/:roomId" element={<MeetingRoom />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default PrivateRoutes;
