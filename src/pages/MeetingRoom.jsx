import React from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import WebRTCMeeting from "../components/meeting/WebRTCMeeting";

function MeetingRoom() {
    const { roomId } = useParams();
    const { user } = useAuth();

    if (!user) {
        return <p>Loading...</p>;
    }

    return (
        <div className="meeting-room">
            <WebRTCMeeting roomId={roomId} />
        </div>
    );
}

export default MeetingRoom;
