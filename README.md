# AI-Enabled Banking Kiosk Prototype

A simple end-to-end prototype for a banking self-service kiosk, featuring a clean React frontend and a minimal Express backend with a simulated AI conversational flow.

## Requirements
- Node.js (v18+ recommended)
- npm

## Running the Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies (if not already):
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
The backend will run on `http://localhost:3001` with mock data and an in-memory session manager. It implements simple NLP intent routing based on keywords.

## Running the Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
Open the local server URL provided by Vite (e.g., `http://localhost:5173`) in your browser.

## Using the Kiosk
- Click **Start Session**.
- From the services menu, select items like **Check Balance**, **Mini Statement**, or type directly in the **Talk to Agent / Assistant** chat interface.
- Follow the prompt for an OTP if required. (Checking the Node backend logs will show you the exact OTP generated for the session, e.g. "Generated OTP for session X: 123456").
- View your simple, mock results on screen without any database setup overhead. Enjoy the red, white, and black styled simple kiosk design.
