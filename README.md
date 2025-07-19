# Irys Confession Board

A decentralized anonymous confession platform with permanent blockchain storage on Irys.

## 🚀 Features

- **Anonymous Confessions**: Post confessions anonymously with permanent blockchain storage
- **User Authentication**: Secure user registration and login system
- **Threaded Replies**: Nested conversation system with replies
- **AI Content Moderation**: Claude AI-powered content moderation and crisis detection
- **Advanced Search**: Full-text search with filters and trending algorithms
- **Real-time Updates**: WebSocket-powered live updates and notifications
- **Voting System**: Upvote/downvote confessions and replies
- **Blockchain Integration**: All content permanently stored on Irys blockchain
- **Professional UI**: Modern, responsive design with dark theme

## 🏗️ Architecture

- **Backend**: FastAPI + Python + MongoDB
- **Frontend**: React + Tailwind CSS
- **Blockchain**: Irys Network (permanent storage)
- **AI**: Claude API (content moderation)
- **Real-time**: WebSocket connections
- **Deployment**: Docker + Docker Compose

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for development)
- Python 3.11+ (for development)
- MongoDB (included in Docker setup)
- Irys private key
- Claude API key

## 🛠️ Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd irys-confession-main
```

### 2. Environment Setup

Create environment files:

**Backend** (`backend/.env`):
```bash
# Database Configuration
MONGO_URL=mongodb://admin:password123@mongodb:27017
DB_NAME=irys_confession_board

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256

# Irys Blockchain Configuration
IRYS_PRIVATE_KEY=your-irys-private-key-here
IRYS_NETWORK=devnet
IRYS_RPC_URL=https://rpc.ankr.com/eth_sepolia

# Claude AI Configuration
CLAUDE_API_KEY=your-claude-api-key-here
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false
ENVIRONMENT=production

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
```

**Frontend** (`frontend/.env`):
```bash
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000/ws
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
```

### 3. Start with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MongoDB**: localhost:27017

## 🧪 Development Setup

### Backend Development
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start development server
python start.py
```

### Frontend Development
```bash
cd frontend

# Install dependencies
yarn install

# Start development server
yarn start
```

## 📚 API Documentation

The API documentation is available at `/docs` when the backend is running.

### Key Endpoints:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/confessions` - Create confession
- `GET /api/confessions/public` - Get public confessions
- `POST /api/confessions/{id}/replies` - Create reply
- `POST /api/search` - Search confessions
- `GET /api/trending` - Get trending confessions

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `irys_confession_board` |
| `JWT_SECRET` | JWT signing secret | Required |
| `IRYS_PRIVATE_KEY` | Irys wallet private key | Required |
| `CLAUDE_API_KEY` | Claude AI API key | Required |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `DEBUG` | Debug mode | `false` |

### Rate Limiting
- Registration: 5 requests/minute
- Login: 10 requests/minute
- Confession creation: 30 requests/minute

## 🚀 Production Deployment

### 1. Environment Configuration
Update environment variables for production:
- Set `DEBUG=false`
- Use strong `JWT_SECRET`
- Configure `ALLOWED_ORIGINS` with your domain
- Set up proper MongoDB credentials

### 2. Docker Deployment
```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d

# Monitor logs
docker-compose logs -f
```

### 3. Reverse Proxy (Nginx)
Configure Nginx as a reverse proxy for SSL termination and load balancing.

### 4. Monitoring
- Health checks are configured for all services
- Logs are available in `./backend/logs/`
- Use monitoring tools like Prometheus + Grafana

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on sensitive endpoints
- CORS configuration
- Input validation and sanitization
- AI-powered content moderation
- Crisis detection and support resources

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
yarn test
```

## 📊 Analytics

The platform includes built-in analytics:
- Platform statistics
- Trending confessions
- User engagement metrics
- Content moderation insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation
- Review the logs for debugging

## 🔄 Updates

To update the application:
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose up -d --build
```
