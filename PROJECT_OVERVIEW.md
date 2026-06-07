# Editians Hub — Project Overview & Documentation

Editians Hub is a premium, secure, and real-time collaboration portal designed to connect **Clients (CEOs)**, **Editors**, and **Administrators** in a unified and sleek web application. It features real-time anonymous chatting, project tracking (Content Kanban), and gamified performance boards (Leaderboard).

---

## 🌟 Key Features

### 1. Secure Authentication & Role Management
*   **Google Authentication:** Clients and Editors sign up and log in securely via Google OAuth.
*   **Admin Station Login:** Secure custom credentials page at `/admin-login` for platform administrators.
*   **ProtectedRoute System:** Strict client-side route guard ensuring only users with correct roles (e.g. `client`, `editor`, `admin`) can access dashboards, chat, projects, and leaderboard.

### 2. Channels & Secure PIN Access
*   **Channel Isolation:** Administrative station creates isolated channels (e.g., dedicated to specific clients or YouTube channels).
*   **Secure 4-Digit PINs:** When a channel is created, a unique, secure 4-digit PIN is generated. Users (Clients/Editors) enter this PIN to gain access to that channel's chat and project board.

### 3. Real-Time Anonymous Chat
*   **Live Syncing:** Real-time messages powered by Firebase Cloud Firestore.
*   **Anonymity Layer:** To prevent bias and keep communication professional, user names are masked. In the chat room, they only appear as **Client** or **Editor** (identities are hidden).

### 4. Content Kanban / Projects Board
*   **Manage Deliverables:** Tracks scripts, video briefs, resources, and files.
*   **Interactive Status:** Update project phases in real-time across three columns:
    1.  *Warming Up*
    2.  *In Progress*
    3.  *Completed*
*   **Editor Assignments:** Admins can allocate projects to specific editors.
*   **Resource Sharing:** Direct link integration (supporting Google Drive, Dropbox, etc.) and deadline calendar selectors.

### 5. Gamification (Editor Leaderboard)
*   **Leveling System:** Editors accumulate levels/points indicating performance.
*   **Real-Time Rankings:** An interactive leaderboard ranks team members based on their performance level.
*   **Admin Adjustment:** Admins can increase or decrease Editor levels dynamically from the admin panel.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React (Vite) | High-performance client framework with Fast Refresh |
| **Styling** | TailwindCSS & Custom CSS | Premium modern UI with Glassmorphism and Dark Mode support |
| **Database** | Firebase Firestore | Real-time document storage for chat, channels, and projects |
| **Authentication** | Firebase Auth | OAuth 2.0 (Google Login) and Email/Password for Admin |
| **Icons** | Lucide React | Clean, scalable visual indicators |
| **Routing** | React Router DOM v6 | Navigation, layout control, and route guards |

---

## 📂 Project Structure

Below is a map of the important codebase directories and files inside `editians-chat/src/`:

```
src/
├── assets/                 # Custom graphic assets
├── components/
│   ├── Header.jsx          # Unified global navigation and user profile bar
│   ├── NotificationManager.# Real-time alerts and user messaging context
│   ├── ProfileModal.jsx    # User profile customization card
│   └── ProtectedRoute.jsx  # Security barrier for authenticated routes
├── context/
│   └── AuthContext.jsx     # Handles authentication states and Firebase interactions
├── pages/
│   ├── AdminDashboard.jsx  # Administrative controls (users, PINs, levels)
│   ├── AdminLogin.jsx      # Portal authentication for Administrators
│   ├── Chat.jsx            # Real-time anonymous channel conversation view
│   ├── ClientDashboard.jsx # Dashboard specialized for client features
│   ├── DashboardRouter.jsx # Multi-route controller based on active role
│   ├── EditorDashboard.jsx # Dashboard specialized for video/content editors
│   ├── LandingPage.jsx     # Vibrant landing screen
│   ├── Leaderboard.jsx     # Interactive ranking & levels portal
│   ├── Login.jsx           # Portal login for Google Auth and PIN authorization
│   └── Projects.jsx        # Kanban project tracker (scripts, links, status)
├── App.css                 # Global styling adjustments
├── App.jsx                 # Route configurations and ambient background styling
├── firebase.js             # Initialized Firebase client instances
├── index.css               # Core styling variables and Glassmorphism definitions
└── main.jsx                # React mount entrypoint
```

---

## 🗄️ Database Architecture

Editians Hub uses three main document collection groups in Firebase Cloud Firestore:

### 1. `users` Collection
Stores metadata about registered clients, editors, and admins.
```typescript
{
  id: string; // Firebase Authentication UID
  email: string;
  displayName: string;
  photoURL: string;
  role: 'client' | 'editor' | 'admin';
  createdAt: Timestamp;
  level?: number; // Only for editors (defaults to 0)
}
```

### 2. `channels` Collection
Stores created rooms and their access PINs.
```typescript
{
  id: string; // Autogenerated by Firestore
  name: string; // e.g. "MrBeast Gaming"
  pin: string; // e.g. "4921"
  createdAt: Timestamp;
}
```

#### Sub-collection: `channels/{channelId}/messages`
Manages real-time messages within a channel.
```typescript
{
  id: string;
  text: string;
  senderId: string;
  senderRole: 'client' | 'editor' | 'admin';
  timestamp: Timestamp;
}
```

#### Sub-collection: `channels/{channelId}/projects`
Manages content boards and Kanban workflows for a channel.
```typescript
{
  id: string;
  title: string;
  script?: string;
  link?: string;
  deadline?: string;
  status: 'Warming Up' | 'In Progress' | 'Completed';
  createdBy: string;
  createdAt: Timestamp;
  assignedTo?: string; // Editor User UID
  assignedToName?: string;
}
```

---

## 🚀 Local Execution & Development

To run this application locally:

1.  Open your terminal inside the project directory:
    ```bash
    cd "c:/Users/User/.gemini/antigravity/scratch/Editians Hub/editians-chat"
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Launch the development server:
    ```bash
    npm run dev
    ```
4.  Open the local URL provided (usually `http://localhost:5173`) in your browser.

---

## 🌐 Production Deployment (cPanel Setup)

The React application is pre-packaged as static files inside the `dist` directory.

### Uploading Files
1.  Log in to your **cPanel** and open **File Manager**.
2.  Go to the directory mapped to your subdomain (e.g., `public_html/editians` or similar).
3.  Upload the entire contents of the `dist/` directory directly into that folder.

### React Router Configuration (`.htaccess`)
To prevent `404 Not Found` errors when navigating to routes like `/chat` or `/dashboard` directly, create or edit the `.htaccess` file in the subdomain root directory and add the following rules:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```
