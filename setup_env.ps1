# PowerShell script to set up environment file
$envContent = @"
# Database Configuration
MONGO_URL=mongodb://localhost:27017
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
ENVIRONMENT=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000

# File Upload Limits
MAX_CONTENT_LENGTH=1048576

# Logging
LOG_LEVEL=INFO
"@

# Write to .env file
$envContent | Out-File -FilePath "backend\.env" -Encoding UTF8

Write-Host "✅ Environment file created at backend\.env"
Write-Host "⚠️  Please update the following values with your actual keys:"
Write-Host "   - IRYS_PRIVATE_KEY"
Write-Host "   - CLAUDE_API_KEY"
Write-Host "   - JWT_SECRET (for production)" 