# Holiday Tracker

A modern web-based holiday tracking application built with React, TypeScript, and a modern UI stack.

## Features

- 📅 Interactive calendar view with team visibility
- 📊 Detailed leave balance tracking
- 👤 User profile and settings management
- 📱 Fully responsive design
- 📱 Mobile-friendly interface with sidebar toggle
- 📊 Leave type statistics and progress tracking
- 📅 Upcoming leave requests overview

## Tech Stack

- **Frontend**: React 18, TypeScript
- **UI Components**: 
  - Tailwind CSS with Shadcn/ui
  - Custom components with modern design system
- **Calendar**: FullCalendar
- **State Management**: React Context API
- **Routing**: React Router with Wouter
- **Icons**: Font Awesome
- **Date Handling**: date-fns

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment:
   - Create a `.env` file in the project root
   - Add required environment variables (e.g., Google OAuth client ID)
4. Start the development server:
   ```bash
   npm start
   ```
4. Access the application at [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm start` - Start the development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run eject` - Eject from create-react-app

## Project Structure

```bash
src/
├── components/           # Reusable components
│   ├── dashboard/       # Dashboard components
│   ├── requests/        # Leave request components
│   └── ui/             # Shared UI components
├── context/             # React context providers
├── utils/               # Utility functions
│   └── leaveUtils.ts    # Leave type utilities
├── styles/              # Global styles
│   └── App.css          # Global theme and variables
└── types/               # TypeScript type definitions
```

## License

ISC

## Author

Ajmal Rasouli

## Contributing

Contributions are welcome! Please feel free to submit a pull request.