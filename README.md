# AR Aging Predictions - Frontend

A modern, responsive React application for AR aging predictions with machine learning integration.

## Features

- **Modern UI/UX**: Clean, professional interface with Tailwind CSS
- **Client Management**: Upload and manage multiple clients
- **Predictions**: Generate accurate AR aging predictions
- **Real-time Editing**: Edit predictions with auto-balancing
- **Export**: Download results as CSV or Excel
- **Approval Workflow**: Approve and save predictions to database
- **Auto-retraining**: Optional model retraining on approval

## Tech Stack

- **React 19**: Modern React with hooks
- **Tailwind CSS**: Utility-first CSS framework
- **Create React App**: Simple, no-config React setup
- **JavaScript**: Pure JS, no TypeScript complexity

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend server running on port 8000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:8000
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.js     # Main dashboard
│   ├── Header.js        # App header
│   ├── Sidebar.js       # Navigation sidebar
│   ├── ClientSelector.js # Client selection
│   ├── PredictionForm.js # Prediction settings
│   ├── PredictionsTable.js # Results table
│   ├── ApproveModal.js  # Approval modal
│   ├── DownloadButton.js # Export functionality
│   └── UploadModal.js   # Data upload
├── hooks/
│   └── useApi.js        # API integration hook
├── App.js              # Main app component
├── index.js            # App entry point
└── index.css           # Global styles with Tailwind
```

## Key Features

### 1. Dashboard
- Overview of all clients and predictions
- Real-time statistics and status indicators
- Quick access to all features

### 2. Client Management
- Upload Excel files for new clients
- Automatic data processing and model training
- Client selection with model information

### 3. Predictions
- Generate predictions with custom parameters
- Real-time editing with auto-balancing
- 100% accurate target matching
- Current column for proper data structure

### 4. Export & Approval
- Download as CSV or Excel
- Approve predictions to save to database
- Optional model retraining

## API Integration

The app connects to a FastAPI backend with the following endpoints:

- `GET /api/clients` - List all clients
- `POST /api/predict` - Generate predictions
- `POST /api/approve` - Approve predictions
- `POST /api/upload` - Upload client data

## Styling

Uses Tailwind CSS with custom component classes:

- `.btn-primary` - Primary action buttons
- `.btn-secondary` - Secondary buttons
- `.btn-success` - Success/approve buttons
- `.card` - Card containers
- `.input-field` - Form inputs
- `.table-*` - Table styling

## Development

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+