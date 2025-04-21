import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import WebRTCMeeting from '@/components/meeting/WebRTCMeeting';

function PrivateRoutes() {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/" />;
    }

    return (
        <Routes>
            <Route path="/meeting/:roomId" element={<WebRTCMeeting />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default PrivateRoutes;
