# 🎭 Irys Confession Board

> **Anonymous confessions permanently stored on the blockchain** 🚀

A decentralized, anonymous confession platform built with React, FastAPI, and the Irys blockchain. Share your thoughts anonymously with permanent blockchain storage, AI-powered moderation, and real-time interactions.

![Irys Confession Board](https://img.shields.io/badge/Blockchain-Irys-green) ![React](https://img.shields.io/badge/Frontend-React-blue) ![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green) ![MongoDB](https://img.shields.io/badge/Database-MongoDB-blue)

## ✨ Features

### 🔐 **Zero-Friction Anonymous Posting**
- **No account required** - Post immediately without any registration
- **No personal data** - Completely anonymous by default
- **Blockchain verified** - Permanent storage on Irys network
- **Optional authentication** - Traditional login or MetaMask wallet

### 🎨 **Professional UI/UX**
- **Dark theme** - Modern, professional design
- **Mobile responsive** - Perfect on all devices
- **Smooth animations** - Heart particles, confetti effects
- **Real-time updates** - Live notifications and interactions

### 🤖 **AI-Powered Safety**
- **Content moderation** - Claude AI analyzes all posts
- **Crisis detection** - Automatic mental health support
- **Spam prevention** - Rate limiting and filtering
- **Community guidelines** - Automated violation detection

### ⚡ **Real-Time Features**
- **Live voting** - Instant upvote/downvote with animations
- **Live replies** - Threaded conversations in real-time
- **WebSocket connections** - Instant updates across all users
- **Live notifications** - Real-time alerts and messages

### 🔍 **Discovery & Search**
- **Advanced search** - Filter by content, tags, author, date
- **Trending confessions** - Popular posts algorithm
- **Tag system** - Organize and discover content
- **Mood analysis** - AI-powered emotion detection

### 🛡️ **Blockchain Integration**
- **Permanent storage** - Data stored forever on Irys
- **Transaction verification** - Cryptographic proof of authenticity
- **Gateway access** - Direct blockchain data retrieval
- **Network status** - Real-time blockchain connectivity

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Python 3.8+
- MongoDB Atlas account
- Claude AI API key
- Ethereum private key (for Irys)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/irys-confession-board.git
   cd irys-confession-board
   ```

2. **Set up environment variables**
   ```bash
   # Backend (.env)
   MONGO_URL=your_mongodb_connection_string
   IRYS_PRIVATE_KEY=your_ethereum_private_key
   CLAUDE_API_KEY=your_claude_api_key
   JWT_SECRET=your_jwt_secret
   IRYS_NETWORK=devnet
   GATEWAY_URL=https://devnet.irys.xyz
   IRYS_RPC_URL=https://rpc.devnet.irys.xyz/v1

   # Frontend (.env)
   REACT_APP_BACKEND_URL=http://localhost:8000
   REACT_APP_GATEWAY_URL=https://devnet.irys.xyz
   REACT_APP_IRYS_RPC_URL=https://rpc.devnet.irys.xyz/v1
   ```

3. **Install dependencies**
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

4. **Start the application**
   ```bash
   # Backend (Terminal 1)
   cd backend
   python server.py

   # Frontend (Terminal 2)
   cd frontend
   npm start
   ```

5. **Visit the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  FastAPI Backend│    │  Irys Blockchain│
│                 │    │                 │    │                 │
│ • Anonymous UI  │◄──►│ • AI Moderation │◄──►│ • Permanent     │
│ • Real-time     │    │ • User Auth     │    │   Storage       │
│ • Mobile-first  │    │ • WebSocket     │    │ • Verification  │
│ • Dark Theme    │    │ • Rate Limiting │    │ • Gateway       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   MongoDB Atlas │
                       │                 │
                       │ • User Data     │
                       │ • Metadata      │
                       │ • Analytics     │
                       └─────────────────┘
```

## 📱 User Journey

1. **Visit the site** - Beautiful dark theme welcome
2. **Post anonymously** - No registration required
3. **AI moderation** - Content analyzed for safety
4. **Blockchain upload** - Permanently stored on Irys
5. **Real-time sharing** - Live updates to all users
6. **Community interaction** - Vote, reply, share

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get user profile

### Confessions
- `POST /api/confessions` - Create confession
- `GET /api/confessions/public` - Get public confessions
- `POST /api/confessions/{id}/vote` - Vote on confession
- `POST /api/confessions/{id}/replies` - Reply to confession

### Search & Discovery
- `POST /api/search` - Search confessions
- `GET /api/trending` - Get trending confessions
- `GET /api/tags/trending` - Get trending tags

### Blockchain
- `GET /api/irys/network-info` - Get network status
- `GET /api/irys/balance` - Get Irys balance
- `GET /api/verify/{tx_id}` - Verify transaction

## 🛡️ Security Features

- **Rate limiting** - Prevent spam and abuse
- **Input validation** - Sanitize all user inputs
- **CORS protection** - Secure cross-origin requests
- **JWT authentication** - Secure user sessions
- **AI moderation** - Automatic content filtering
- **Crisis detection** - Mental health support

## 🚀 Deployment

### Render Deployment
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

### Docker Deployment
```bash
# Production
docker-compose -f docker-compose.prod.yml up -d

# Development
docker-compose up -d
```

## 📊 Performance

- **Frontend**: Optimized React with lazy loading
- **Backend**: FastAPI with async operations
- **Database**: MongoDB with proper indexing
- **Blockchain**: Irys for permanent storage
- **CDN**: Static assets optimized for delivery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Irys Network** - Permanent blockchain storage
- **Claude AI** - Content moderation and analysis
- **MongoDB Atlas** - Database hosting
- **Render** - Application hosting
- **React & FastAPI** - Modern web development

## 📞 Support

- **Documentation**: [FEATURES_CHECKLIST.md](./FEATURES_CHECKLIST.md)
- **Deployment**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/irys-confession-board/issues)

---

**Built with ❤️ for anonymous expression on the blockchain** 🎭 