# AceUp

AceUp is a comprehensive platform designed to empower startups, investors, and business growth. It provides tools for startup registration, investment management, and business scaling.

## 🚀 Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS 4
- **State/Data**: Supabase JS, Axios
- **Routing**: React Router
- **Animations**: React Spring
- **UI Components**: Custom glassmorphism design

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Security**: Helmet, CORS
- **Logging**: Morgan

## 📁 Project Structure

```bash
AceUp/
├── frontend/           # React + Vite frontend application
│   ├── src/           # Source code
│   └── public/        # Static assets
├── backend/            # Node.js + Express backend API
│   ├── routes/        # API route definitions
│   └── middleware/    # Custom middleware
└── README.md           # Project documentation
```

## 🛠️ Getting Started

### Prerequisites
- Node.js (version >= 18.0.0)
- npm or yarn

### Local Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AceUp
   ```

2. **Backend Setup**
   - Navigate to the backend directory:
     ```bash
     cd backend
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Configure environment variables:
     Create a `.env` file in the `backend` directory (refer to `.env.example`).
     ```env
     PORT=5000
     SUPABASE_URL=your_supabase_url
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     FRONTEND_URL=http://localhost:5173
     ```
   - Start the development server:
     ```bash
     npm run dev
     ```

3. **Frontend Setup**
   - Navigate to the frontend directory:
     ```bash
     cd ../frontend
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Configure environment variables:
     Create a `.env` file in the `frontend` directory (refer to `.env.example`).
     ```env
     VITE_API_URL=http://localhost:5000
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```
   - Start the development server:
     ```bash
     npm run dev
     ```

4. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

## 📜 License
This project is licensed under the ISC License.