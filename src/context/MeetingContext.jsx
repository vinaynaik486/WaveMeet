import React, { createContext, useContext, useReducer } from 'react';

const MeetingContext = createContext(null);

// ── State Shape ────────────────────────────────────────────
const initialState = {
  roomId: null,
  joined: false,
  peers: [],           // [{ socketId, userId, userName, stream, audioEnabled, videoEnabled }]
  localStream: null,
  screenStream: null,
  chatMessages: [],    // [{ senderId, senderName, message, timestamp }]
  isMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  isChatOpen: false,
  isParticipantsOpen: false,
  iceServers: [],
};

// ── Actions ────────────────────────────────────────────────
function meetingReducer(state, action) {
  switch (action.type) {
    case 'SET_ROOM':
      return { ...state, roomId: action.payload.roomId, iceServers: action.payload.iceServers, joined: true };

    case 'SET_LOCAL_STREAM':
      return { ...state, localStream: action.payload };

    case 'SET_SCREEN_STREAM':
      return { ...state, screenStream: action.payload, isScreenSharing: !!action.payload };

    case 'ADD_PEER': {
      // Avoid duplicates
      const exists = state.peers.some((p) => p.socketId === action.payload.socketId);
      if (exists) return state;
      return { ...state, peers: [...state.peers, { ...action.payload, audioEnabled: true, videoEnabled: true }] };
    }

    case 'REMOVE_PEER':
      return { ...state, peers: state.peers.filter((p) => p.socketId !== action.payload) };

    case 'UPDATE_PEER_STREAM': {
      return {
        ...state,
        peers: state.peers.map((p) =>
          p.socketId === action.payload.socketId ? { ...p, stream: action.payload.stream } : p
        ),
      };
    }

    case 'TOGGLE_PEER_MEDIA': {
      const { socketId, kind, enabled } = action.payload;
      return {
        ...state,
        peers: state.peers.map((p) =>
          p.socketId === socketId
            ? { ...p, [kind === 'audio' ? 'audioEnabled' : 'videoEnabled']: enabled }
            : p
        ),
      };
    }

    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted };

    case 'TOGGLE_CAMERA':
      return { ...state, isCameraOff: !state.isCameraOff };

    case 'TOGGLE_CHAT':
      return { ...state, isChatOpen: !state.isChatOpen, isParticipantsOpen: false };

    case 'TOGGLE_PARTICIPANTS':
      return { ...state, isParticipantsOpen: !state.isParticipantsOpen, isChatOpen: false };

    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };

    case 'SET_CHAT_HISTORY':
      return { ...state, chatMessages: action.payload };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

export function MeetingProvider({ children }) {
  const [state, dispatch] = useReducer(meetingReducer, initialState);

  return (
    <MeetingContext.Provider value={{ state, dispatch }}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const ctx = useContext(MeetingContext);
  if (!ctx) throw new Error('useMeeting must be used within MeetingProvider');
  return ctx;
}
