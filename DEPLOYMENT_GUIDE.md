# 🚀 Render Deployment Guide - Irys Confession Board

## 📋 **Prerequisites**
- GitHub account
- Render account (free tier available)
- MongoDB Atlas account (free tier available)
- Claude AI API key (for content moderation)

## 🔧 **Step 1: Prepare Your Repository**

### **Files Already Cleaned:**
- ✅ Removed test files (`test_result.md`, `backend_test.py`)
- ✅ Removed setup scripts (`setup.bat`, `setup.sh`)
- ✅ Removed development files (`yarn.lock`, `.emergent/`)
- ✅ Updated `.gitignore` for production

### **Repository Structure:**
```
irys-confession-main/
├── backend/
│   ├── server.py
│   ├── irys_service.js
│   ├── package.json
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── docker-compose.prod.yml
├── env.production.example
├── README.md
└── .gitignore
```

## 🗄️ **Step 2: Set Up MongoDB Atlas**

1. **Create MongoDB Atlas Account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for free tier
   - Create a new cluster

2. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

## 🤖 **Step 3: Get Claude AI API Key**

1. **Create Anthropic Account:**
   - Go to [Anthropic Console](https://console.anthropic.com/)
   - Sign up and verify your account
   - Create a new API key

## 🔑 **Step 4: Generate Ethereum Private Key**

1. **Create Private Key:**
   ```bash
   # Option 1: Use MetaMask
   # Export private key from MetaMask wallet
   
   # Option 2: Generate new key
   # Use any Ethereum wallet generator
   ```

2. **Get Irys Devnet Balance:**
   - Visit [Irys Devnet](https://devnet.irys.xyz)
   - Add your wallet address
   - Get free devnet tokens

## 📦 **Step 5: Deploy to Render**

### **Backend Deployment:**

1. **Connect GitHub Repository:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Backend Service:**
   ```
   Name: irys-confession-backend
   Environment: Python 3
   Build Command: pip install -r requirements.txt && npm install
   Start Command: python server.py
   ```

3. **Set Environment Variables:**
   ```
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/irys-confessions
   IRYS_PRIVATE_KEY=your_ethereum_private_key
   CLAUDE_API_KEY=your_claude_api_key
   JWT_SECRET=your_jwt_secret_key
   IRYS_NETWORK=devnet
   GATEWAY_URL=https://devnet.irys.xyz
   IRYS_RPC_URL=https://rpc.devnet.irys.xyz/v1
   CORS_ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
   PORT=10000
   ```

### **Frontend Deployment:**

1. **Create Static Site:**
   - Click "New +" → "Static Site"
   - Connect same GitHub repository

2. **Configure Frontend:**
   ```
   Name: irys-confession-frontend
   Build Command: npm install && npm run build
   Publish Directory: build
   ```

3. **Set Environment Variables:**
   ```
   REACT_APP_BACKEND_URL=https://irys-confession-backend.onrender.com
   REACT_APP_GATEWAY_URL=https://devnet.irys.xyz
   REACT_APP_IRYS_RPC_URL=https://rpc.devnet.irys.xyz/v1
   REACT_APP_PRIVATE_KEY=your_ethereum_private_key
   DISABLE_HOT_RELOAD=true
   GENERATE_SOURCEMAP=false
   NODE_OPTIONS=--max-old-space-size=8192
   ```

## 🔄 **Step 6: Update CORS Settings**

1. **Update Backend CORS:**
   - In your backend environment variables, set:
   ```
   CORS_ALLOWED_ORIGINS=https://irys-confession-frontend.onrender.com
   ```

## 🧪 **Step 7: Test Your Deployment**

1. **Test Backend:**
   - Visit: `https://irys-confession-backend.onrender.com/api/health`
   - Should return: `{"status": "healthy"}`

2. **Test Frontend:**
   - Visit your frontend URL
   - Try posting a confession
   - Check if blockchain upload works

## 🔍 **Step 8: Monitor & Debug**

### **Common Issues:**

1. **Build Failures:**
   - Check build logs in Render dashboard
   - Verify all dependencies in `package.json`

2. **Environment Variables:**
   - Ensure all variables are set correctly
   - Check for typos in variable names

3. **CORS Errors:**
   - Verify frontend URL in backend CORS settings
   - Check browser console for CORS errors

4. **Database Connection:**
   - Verify MongoDB connection string
   - Check if IP whitelist includes Render IPs

## 📊 **Step 9: Performance Optimization**

### **Backend:**
- Enable auto-scaling in Render
- Set appropriate instance size
- Monitor memory usage

### **Frontend:**
- Enable CDN in Render
- Optimize images and assets
- Enable compression

## 🔒 **Step 10: Security Checklist**

- ✅ Environment variables secured
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Input validation active
- ✅ AI moderation working
- ✅ Crisis detection active

## 🎉 **Success!**

Your Irys Confession Board is now live on Render with:
- ✅ Permanent blockchain storage
- ✅ Real-time updates
- ✅ AI-powered moderation
- ✅ Mobile-responsive design
- ✅ Professional UI/UX
- ✅ Viral-ready features

**Your app is ready to go viral!** 🚀 