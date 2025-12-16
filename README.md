# 🎬 SyncWatch

**Real-time synchronized video watching platform with ML-powered genre prediction and personalized recommendations.**

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org/)

---

## 🌟 Features

### Core Functionality
- **🎥 Real-Time Video Sync** - Host controls playback; all viewers sync instantly
- **👥 Role-Based Access** - Host can upload/control video; viewers watch in sync
- **💬 Live Chat** - WhatsApp-style messaging with real-time communication
- **📤 Server-Side Video Hosting** - Secure upload and streaming from server
- **🔄 Late Joiner Support** - New viewers automatically sync to current playback state

### AI/ML Features
- **🤖 Genre Prediction** - ML model predicts movie genres from titles (78% accuracy)
- **🎯 Personalized Recommendations** - Content-based filtering suggests movies based on watch history
- **📊 Confidence Scoring** - ML predictions include confidence levels

### User Experience
- **🎨 Modern Dark Theme** - Professional streaming platform UI
- **📱 Fully Responsive** - Optimized for desktop, tablet, and mobile
- **⚡ Optimized Layout** - 80/20 video-chat ratio for video-first experience
- **📈 Watch History** - Tracks all viewed content with duration and metadata
- **✏️ Manual Metadata** - Hosts can manually set movie name and genre (100% confidence)

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - Server framework
- **Socket.IO** - Real-time bidirectional communication
- **SQLite3** - Lightweight database for watch history
- **Multer** - File upload handling
- **Axios** - HTTP client for ML API calls

### ML/AI
- **Python 3.8+** - ML runtime
- **Flask** - ML API server
- **Scikit-learn** - Machine learning (Logistic Regression)
- **Pandas** - Data processing
- **TF-IDF Vectorization** - Text feature extraction

### Frontend
- **Vanilla JavaScript** - No frameworks, pure JS
- **HTML5 Video API** - Video playback control
- **CSS Grid & Flexbox** - Modern responsive layout
- **WebSocket** - Real-time communication via Socket.IO

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

### 1. Clone Repository
```bash
git clone https://github.com/04Silambu/SyncWatch.git
cd SyncWatch
```

### 2. Install Backend Dependencies
```bash
npm install
```

### 3. Install ML Dependencies
```bash
cd ml
pip install -r requirements.txt
```

### 4. Train ML Model (First Time Only)
```bash
cd ml
python preprocess.py
python train.py
```

---

## 🚀 Usage

### Start the Application

**Terminal 1 - Backend Server:**
```bash
node backend/server.js
```
Server runs on `http://localhost:3000`

**Terminal 2 - ML API (Optional but Recommended):**
```bash
cd ml
python app.py
```
ML API runs on `http://localhost:5000`

### Using SyncWatch

1. **Create a Room** (Host)
   - Click "Create Room"
   - Enter movie name and select genre
   - Upload video file
   - Share Room ID with viewers

2. **Join a Room** (Viewer)
   - Enter Room ID
   - Click "Join Room"
   - Video and chat sync automatically

3. **Controls**
   - **Host**: Full video controls (play, pause, seek)
   - **Viewer**: Video-only (controls disabled)
   - **Both**: Real-time chat, watch history, recommendations

---

## 📁 Project Structure

```
SyncWatch/
├── backend/
│   ├── server.js              # Main Express + Socket.IO server
│   ├── history.db             # SQLite database (auto-created)
│   ├── migrate.js             # Database migration script
│   └── recommendations.json   # Static movie dataset (50 movies)
├── ml/
│   ├── app.py                 # Flask ML API server
│   ├── train.py               # Model training script
│   ├── preprocess.py          # Data preprocessing
│   ├── model/
│   │   ├── genre_model.pkl    # Trained ML model
│   │   └── tfidf_vectorizer.pkl
│   └── data/
│       └── raw/imdb_movies.csv
├── public/
│   ├── index.html             # Main UI
│   ├── script.js              # Frontend logic
│   ├── style.css              # Modern dark theme
│   ├── design-tokens.css      # CSS variables
│   └── ui-helpers.js          # UI utility functions
├── uploads/                   # Uploaded videos (auto-created)
└── package.json
```

---

## 🔌 API Endpoints

### Backend (Node.js)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload` | POST | Upload video (host only) |
| `/video/:filename` | GET | Stream video file |
| `/history` | GET | Get watch history |
| `/history/:id` | DELETE | Delete history entry |
| `/recommendations` | GET | Get personalized movie recommendations |
| `/api/predict-genre` | POST | Predict genre from movie name |

### ML API (Python/Flask)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Check API status |
| `/model/info` | GET | Get model metadata |
| `/predict` | POST | Predict single movie genre |
| `/predict/batch` | POST | Predict multiple genres |

---

## 🎮 Socket.IO Events

### Client → Server
- `create-room` - Host creates new room
- `join-room` - Viewer joins existing room
- `play` - Host plays video
- `pause` - Host pauses video
- `seek` - Host seeks to timestamp
- `chat-message` - Send chat message

### Server → Client
- `room-created` - Room creation success
- `room-joined` - Joined room successfully
- `sync-play` - Sync play event
- `sync-pause` - Sync pause event
- `sync-seek` - Sync seek event
- `chat-message` - Broadcast message

---

## 🧠 ML Model Details

- **Algorithm**: Logistic Regression with TF-IDF
- **Accuracy**: 78% (5-fold cross-validation)
- **Classes**: 5 genres (Action, Drama, Comedy, Animation, Adventure)
- **Features**: 8000 TF-IDF features from movie titles
- **Training Data**: ~2000 IMDB movies

### Genre Mapping
Original 9 genres consolidated to 5 core categories for better accuracy.

---

## 📊 Database Schema

### `history` Table
```sql
CREATE TABLE history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_name TEXT,
    genre TEXT,
    genre_confidence REAL,
    duration INTEGER,
    date TEXT
);
```

---

## 🎨 UI Highlights

- **80/20 Layout** - Video (80%) + Chat (20%)
- **Dark Theme** - Purple accent colors, modern design
- **Compact Sidebar** - 200px controls panel
- **WhatsApp-Style Chat** - Clean bubbles, no clutter
- **Responsive Grid** - Stacks on mobile/tablet

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 👤 Author

**04Silambu**
- GitHub: [@04Silambu](https://github.com/04Silambu)
- Repository: [SyncWatch](https://github.com/04Silambu/SyncWatch)

---

## 🙏 Acknowledgments

- IMDB dataset for ML training
- Socket.IO for real-time communication
- Scikit-learn for ML framework

---

**Built with ❤️ for seamless watch parties and intelligent movie recommendations.**
