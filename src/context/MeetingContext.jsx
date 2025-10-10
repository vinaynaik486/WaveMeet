import React, { createContext, useContext, useReducer } from 'react';

/**
 * Global Meeting State Management.
 * 
 * Centralized state machine for the active meeting lifecycle.
 * Manages UI panel toggles, hardware states (mic/cam/screen), remote peer states,
 * and auxiliary features (chat, tasks, waiting room).
 */
const MeetingContext = createContext(null);

const initialState = {
  // Connection Lifecycle
  joined: false,
  lastJoinedRoomId: null,
  activeRoomId: null,
  
  // Local Hardware Streams
  localStream: null,
  screenStream: null,
  isMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  
  // Remote Peers
  peers: [],
  
  // Recording State
  isRecording: false,
  
  // Layout & Panels (Mutually exclusive sidebars)
  isChatOpen: false,
  isParticipantsOpen: false,
  isTasksOpen: false,
  
  // Auxiliary Feature State
  chatMessages: [],
  typingUsers: [],
  tasks: [],
  reactions: {},
  
  // Access Control (Waiting Room)
  isWaiting: false,
  waitingRejected: null,
  pendingJoinRequests: [],
};

/**
 * Deterministic state transitions for the meeting lifecycle.
 */
function meetingReducer(state, action) {
  switch (action.type) {
    // ---------------------------------------------------------------------------
    // Connection & Hardware
    // ---------------------------------------------------------------------------
    case 'SET_JOINED':
      return { ...state, joined: true };
    case 'SET_LAST_ROOM':
      return { ...state, lastJoinedRoomId: action.payload };
    case 'SET_LOCAL_STREAM':
      return { ...state, localStream: action.payload };
    case 'SET_SCREEN_STREAM':
      return { ...state, screenStream: action.payload, isScreenSharing: !!action.payload };
    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted };
    case 'TOGGLE_CAMERA':
      return { ...state, isCameraOff: !state.isCameraOff };
    case 'SET_CAMERA_OFF':
      return { ...state, isCameraOff: action.payload };
    case 'SET_MUTED':
      return { ...state, isMuted: action.payload };

    // ---------------------------------------------------------------------------
    // Remote Peer Sync
    // ---------------------------------------------------------------------------
    case 'ADD_PEER':
      if (state.peers.find(p => p.socketId === action.payload.socketId)) return state;
      return { ...state, peers: [...state.peers, action.payload] };
    case 'REMOVE_PEER':
      return { ...state, peers: state.peers.filter(p => p.socketId !== action.payload) };
    case 'UPDATE_PEER_STREAM':
      return { ...state, peers: state.peers.map(p => p.socketId === action.payload.socketId ? { ...p, stream: action.payload.stream } : p) };
    case 'UPDATE_PEER_MEDIA':
      return { ...state, peers: state.peers.map(p => p.socketId === action.payload.socketId ? { ...p, audioEnabled: action.payload.audioEnabled, videoEnabled: action.payload.videoEnabled } : p) };

    // ---------------------------------------------------------------------------
    // Layout (Mutually Exclusive Panels)
    // ---------------------------------------------------------------------------
    case 'TOGGLE_CHAT':
      return { ...state, isChatOpen: !state.isChatOpen, isParticipantsOpen: false, isTasksOpen: false };
    case 'TOGGLE_PARTICIPANTS':
      return { ...state, isParticipantsOpen: !state.isParticipantsOpen, isChatOpen: false, isTasksOpen: false };
    case 'TOGGLE_TASKS':
      return { ...state, isTasksOpen: !state.isTasksOpen, isChatOpen: false, isParticipantsOpen: false };

    // ---------------------------------------------------------------------------
    // Auxiliary Features
    // ---------------------------------------------------------------------------
    case 'ADD_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'SET_CHAT_HISTORY':
      return { ...state, chatMessages: action.payload };
    case 'SET_TYPING':
      if (state.typingUsers.includes(action.payload)) return state;
      return { ...state, typingUsers: [...state.typingUsers, action.payload] };
    case 'CLEAR_TYPING':
      return { ...state, typingUsers: state.typingUsers.filter(u => u !== action.payload) };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'SET_REACTION':
      return { ...state, reactions: { ...state.reactions, [action.payload.socketId]: action.payload.emoji } };
    case 'CLEAR_REACTION':
      const newReactions = { ...state.reactions };
      delete newReactions[action.payload];
      return { ...state, reactions: newReactions };

    // ---------------------------------------------------------------------------
    // Access Control (Waiting Room)
    // ---------------------------------------------------------------------------
    case 'SET_JOIN_REQUESTS':
      return { ...state, pendingJoinRequests: action.payload };
    case 'ADD_JOIN_REQUEST':
      return { ...state, pendingJoinRequests: [...state.pendingJoinRequests, action.payload] };
    case 'REMOVE_JOIN_REQUEST':
      return { ...state, pendingJoinRequests: state.pendingJoinRequests.filter(r => r.socketId !== action.payload) };
    case 'SET_WAITING':
      return { ...state, isWaiting: action.payload };
    case 'SET_WAITING_REJECTED':
      return { ...state, isWaiting: false, waitingRejected: action.payload };
    
    // ---------------------------------------------------------------------------
    // Misc
    // ---------------------------------------------------------------------------
    case 'SET_RECORDING':
      return { ...state, isRecording: action.payload };
    case 'SET_ACTIVE_ROOM':
      return { ...state, activeRoomId: action.payload };
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

/**
 * Consumes the active meeting state machine.
 * Must be used within a <MeetingProvider> boundary.
 */
export function useMeeting() {
  const ctx = useContext(MeetingContext);
  if (!ctx) throw new Error('useMeeting must be used within a MeetingProvider boundary');
  return ctx;
}
