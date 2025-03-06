import { useEffect } from "react";
import initJitsi from "../lib/jitsi";
import { useAuth } from "../context/AuthContext";

function MeetingRoom() {
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            initJitsi(user);
        }
    }, [user]);

    if (!user) {
        return <p>Loading...</p>;
    }

    return (
        <div className="meeting-room">
        </div>
    );
}

export default MeetingRoom;
