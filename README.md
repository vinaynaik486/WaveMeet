# WaveMeet

A modern video conferencing platform built with React, WebRTC, and Socket.IO.

## Features

- Real-time peer-to-peer video and audio calls using WebRTC
- In-meeting chat with message persistence (MongoDB)
- Screen sharing support
- Participant management with mic/camera status indicators
- Google OAuth and email/password authentication via Firebase
- Responsive design with Tailwind CSS
- Meeting room codes for easy sharing

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- Socket.IO Client
- WebRTC (browser native APIs)
- Firebase Authentication

### Backend
- Node.js + Express
- Socket.IO (signaling server)
- MongoDB + Mongoose

### Deployment
- Frontend: Vercel / Render
- Backend: Render
- Database: MongoDB Atlas

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
git clone https://github.com/vinaynaik486/WaveMeet.git
cd WaveMeet
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
VITE_API_URL=http://localhost:3001
PORT=3001
MONGO_URI=mongodb://localhost:27017/wavemeet
```

### Running Locally

```bash
npm run dev:all
```

This starts both the Vite dev server (port 5173) and the backend signaling server (port 3001).

## Architecture

```
User joins room -> React UI -> Socket.IO -> Signaling Server
                                              |
                              Exchange SDP Offers/Answers + ICE
                                              |
                              WebRTC P2P Connection Established
                              Video/Audio streams flow directly
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## License

MIT
