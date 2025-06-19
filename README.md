# Holiday Tracker

A modern web-based holiday tracking application built with React, TypeScript, and FullCalendar.

## Features

- 📅 Interactive calendar view
- 📊 Holiday statistics and tracking
- 👤 User profile management
- 📱 Responsive design
- 📱 Mobile-friendly interface

## Tech Stack

- **Frontend**: React 18, TypeScript
- **UI Components**: Bootstrap 5, Font Awesome
- **Calendar**: FullCalendar
- **State Management**: React Context API
- **Routing**: React Router

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Google OAuth:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" and select "OAuth client ID"
   - Configure the consent screen if prompted
   - For "Application type", select "Web application"
   - Add `http://localhost:3000` to "Authorized JavaScript origins"
   - Add `http://localhost:3000` to "Authorized redirect URIs" (don't include the /* at the end)
   - Click "Create" and copy the Client ID
   - Create a `.env` file in the project root and add:
     ```
     REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here
     ```
4. Start the development server:
   ```bash
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Available Scripts

- `npm start` - Start the development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run eject` - Eject from create-react-app

## Project Structure

```
src/
├── components/           # Reusable components
│   ├── calendar/        # Calendar related components
│   └── requests/        # Request management components
├── context/             # React context providers
├── styles/              # Global styles
└── utils/               # Utility functions
```
