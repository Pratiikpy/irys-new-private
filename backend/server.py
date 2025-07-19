from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, BackgroundTasks, WebSocket, WebSocketDisconnect, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import asyncio
import json
import subprocess
import jwt
from passlib.context import CryptContext
import hashlib
import anthropic
import re
from enum import Enum
from collections import defaultdict
import time
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
JWT_ALGORITHM = "HS256"

# Claude API configuration
CLAUDE_API_KEY = os.environ.get('CLAUDE_API_KEY')
CLAUDE_MODEL = os.environ.get('CLAUDE_MODEL', 'claude-3-5-sonnet-20241022')

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create the main app without a prefix
app = FastAPI(
    title="Irys Confession Board API",
    description="A decentralized anonymous confession platform with permanent blockchain storage",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure CORS properly
origins = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,https://irys-confession-frontend.onrender.com').split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Add trusted host middleware for security
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["*"]  # Configure this properly for production
)

# WebSocket manager for real-time features
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if user_id:
            self.user_connections[user_id] = websocket

    def disconnect(self, websocket: WebSocket, user_id: str = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id and user_id in self.user_connections:
            del self.user_connections[user_id]

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.user_connections:
            await self.user_connections[user_id].send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# Enums
class UserRole(str, Enum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"

class ModerationAction(str, Enum):
    APPROVED = "approved"
    FLAGGED = "flagged"
    REMOVED = "removed"

class CrisisLevel(str, Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# Enhanced Data Models
class UserCreate(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    password: str
    wallet_address: Optional[str] = None

    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3 or len(v) > 20:
            raise ValueError('Username must be between 3 and 20 characters')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v

class UserLogin(BaseModel):
    username: str
    password: str

class UserProfile(BaseModel):
    username: str
    email: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    stats: Dict[str, Any]
    preferences: Dict[str, Any]
    verification: Dict[str, bool]
    reputation: Dict[str, Any]

class UserPreferences(BaseModel):
    theme: str = "dark"
    notifications: bool = True
    privacy_level: str = "public"
    email_notifications: bool = True
    crisis_support: bool = True

class ConfessionCreate(BaseModel):
    content: str
    is_public: bool = True
    author: str = "anonymous"
    mood: Optional[str] = None
    tags: List[str] = []

    @validator('content')
    def validate_content(cls, v):
        if len(v.strip()) == 0:
            raise ValueError('Content cannot be empty')
        if len(v) > 280:
            raise ValueError('Content must be 280 characters or less')
        return v.strip()

class Confession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tx_id: str
    content: str
    is_public: bool
    author: str
    author_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    upvotes: int = 0
    downvotes: int = 0
    reply_count: int = 0
    view_count: int = 0
    gateway_url: str
    verified: bool = True
    tags: List[str] = []
    mood: Optional[str] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    moderation: Optional[Dict[str, Any]] = None
    crisis_level: CrisisLevel = CrisisLevel.NONE
    
class ReplyCreate(BaseModel):
    content: str
    parent_reply_id: Optional[str] = None

    @validator('content')
    def validate_content(cls, v):
        if len(v.strip()) == 0:
            raise ValueError('Reply content cannot be empty')
        if len(v) > 280:
            raise ValueError('Reply must be 280 characters or less')
        return v.strip()

class Reply(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    confession_id: str
    parent_reply_id: Optional[str] = None
    content: str
    author: str
    author_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    upvotes: int = 0
    downvotes: int = 0
    tx_id: Optional[str] = None
    verified: bool = False
    ai_analysis: Optional[Dict[str, Any]] = None
    moderation: Optional[Dict[str, Any]] = None
    crisis_level: CrisisLevel = CrisisLevel.NONE

class VoteRequest(BaseModel):
    vote_type: str  # 'upvote' or 'downvote'
    user_address: str = "anonymous"

class SearchRequest(BaseModel):
    query: Optional[str] = None
    mood: Optional[str] = None
    tags: List[str] = []
    author: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: str = "timestamp"  # timestamp, upvotes, replies
    order: str = "desc"  # asc, desc

# Utility functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"username": username})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

async def get_current_user_optional(authorization: Optional[str] = Header(None)):
    if not authorization:
        return None
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        user = await db.users.find_one({"username": username})
        return user
    except:
        return None

# AI Analysis Functions
async def analyze_content_with_claude(content: str, analysis_type: str = "moderation"):
    """Analyze content using Claude API"""
    try:
        client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)
        
        if analysis_type == "moderation":
            system_message = """You are a content moderation AI. Analyze the given confession for:
1. Toxicity (hate speech, bullying, harassment)
2. Spam/promotional content
3. Personal information disclosure
4. Crisis indicators (self-harm, suicide ideation)
5. Content appropriateness

Respond with JSON format:
{
  "toxic": boolean,
  "spam": boolean,
  "personal_info": boolean,
  "crisis_level": "none|low|medium|high|critical",
  "crisis_keywords": ["keyword1", "keyword2"],
  "recommended_action": "approve|flag|remove",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation",
  "support_resources": boolean
}"""
        
        elif analysis_type == "enhancement":
            system_message = """You are a content enhancement AI. Analyze the confession and provide:
1. Mood detection
2. Auto-generated tags
3. Similar content matching keywords
4. Viral potential score

Respond with JSON format:
{
  "mood": "happy|sad|anxious|angry|excited|frustrated|hopeful|neutral",
  "tags": ["tag1", "tag2", "tag3"],
  "keywords": ["keyword1", "keyword2"],
  "viral_score": 0.0-1.0,
  "engagement_prediction": "low|medium|high",
  "category": "personal|relationship|work|health|social|other"
}"""
        
        message = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1000,
            system=system_message,
            messages=[
                {
                    "role": "user",
                    "content": f"Analyze this confession: {content}"
                }
            ]
        )
        
        response_text = message.content[0].text
        
        # Parse JSON response
        try:
            return json.loads(response_text.strip())
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "error": "Failed to parse AI response",
                "raw_response": response_text
            }
        
    except Exception as e:
        logging.error(f"Claude analysis failed: {str(e)}")
        return {
            "error": str(e),
            "analysis_type": analysis_type
        }

# Irys Service Helper
async def call_irys_service(request_data):
    """Call Node.js Irys service helper"""
    try:
        current_dir = os.path.dirname(__file__)
        irys_service_path = os.path.join(current_dir, 'irys_service.js')
        
        process = await asyncio.create_subprocess_exec(
            'node', irys_service_path,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=current_dir
        )
        
        stdout, stderr = await process.communicate(
            input=json.dumps(request_data).encode()
        )
        
        if process.returncode != 0:
            print(f"Node.js process error: {stderr.decode()}")
            return {"success": False, "error": "Irys service failed"}
        
        # Parse JSON response
        output_lines = stdout.decode().strip().split('\n')
        json_line = output_lines[-1].strip()
        
        if not json_line:
            return {"success": False, "error": "No response from Irys service"}
        
        return json.loads(json_line)
        
    except Exception as e:
        print(f"Error calling Irys service: {str(e)}")
        return {"success": False, "error": str(e)}

# WebSocket endpoint with improved error handling
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    try:
        await manager.connect(websocket, user_id)
        logger.info(f"WebSocket connected for user: {user_id}")
        
        # Send initial connection message
        await manager.send_personal_message(
            json.dumps({
                "type": "connection",
                "status": "connected",
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }),
            user_id
        )
        
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                if message.get("type") == "ping":
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "pong",
                            "timestamp": datetime.utcnow().isoformat()
                        }),
                        user_id
                    )
                else:
                    # Echo message back for now
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "echo",
                            "data": message,
                            "timestamp": datetime.utcnow().isoformat()
                        }),
                        user_id
                    )
                    
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    json.dumps({
                        "type": "error",
                        "message": "Invalid JSON format",
                        "timestamp": datetime.utcnow().isoformat()
                    }),
                    user_id
                )
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        logger.info(f"WebSocket disconnected for user: {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {str(e)}")
        manager.disconnect(websocket, user_id)

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Irys Confession Board API", "status": "running", "version": "2.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# User Authentication Routes
@api_router.post("/auth/register")
@limiter.limit("5/minute")
async def register_user(user: UserCreate, request: Request):
    """Register a new user"""
    try:
        # Check if username already exists
        existing_user = await db.users.find_one({"username": user.username})
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        # Check if email already exists
        if user.email:
            existing_email = await db.users.find_one({"email": user.email})
            if existing_email:
                raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user document
        user_doc = {
            "id": str(uuid.uuid4()),
            "username": user.username,
            "email": user.email,
            "password_hash": get_password_hash(user.password),
            "wallet_address": user.wallet_address,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow(),
            "role": UserRole.USER,
            "stats": {
                "confession_count": 0,
                "total_upvotes": 0,
                "total_downvotes": 0,
                "follower_count": 0,
                "following_count": 0
            },
            "preferences": {
                "theme": "dark",
                "notifications": True,
                "privacy_level": "public",
                "email_notifications": True,
                "crisis_support": True
            },
            "verification": {
                "email_verified": False,
                "wallet_verified": bool(user.wallet_address),
                "identity_verified": False
            },
            "reputation": {
                "score": 0,
                "level": "newcomer",
                "badges": []
            }
        }
        
        # Insert user into database
        await db.users.insert_one(user_doc)
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user.username},
            expires_delta=timedelta(days=30)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_doc["id"],
                "username": user_doc["username"],
                "email": user_doc["email"],
                "created_at": user_doc["created_at"],
                "stats": user_doc["stats"],
                "preferences": user_doc["preferences"]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/login")
@limiter.limit("10/minute")
async def login_user(user: UserLogin, request: Request):
    """Login user"""
    try:
        # Find user by username
        db_user = await db.users.find_one({"username": user.username})
        if not db_user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not verify_password(user.password, db_user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Update last active
        await db.users.update_one(
            {"username": user.username},
            {"$set": {"last_active": datetime.utcnow()}}
        )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user.username},
            expires_delta=timedelta(days=30)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": db_user["id"],
                "username": db_user["username"],
                "email": db_user.get("email"),
                "stats": db_user["stats"],
                "preferences": db_user["preferences"]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user.get("email"),
        "bio": current_user.get("bio"),
        "avatar_url": current_user.get("avatar_url"),
        "created_at": current_user["created_at"],
        "stats": current_user["stats"],
        "preferences": current_user["preferences"],
        "verification": current_user["verification"],
        "reputation": current_user["reputation"]
    }

@api_router.put("/auth/preferences")
async def update_user_preferences(
    preferences: UserPreferences,
    current_user: dict = Depends(get_current_user)
):
    """Update user preferences"""
    try:
        await db.users.update_one(
            {"username": current_user["username"]},
            {"$set": {"preferences": preferences.dict()}}
        )
        return {"message": "Preferences updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Confession Routes
@api_router.post("/confessions")
@limiter.limit("30/minute")
async def create_confession(
    confession: ConfessionCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user_optional),
    request: Request = None
):
    """Create a new confession with AI analysis"""
    try:
        # Determine author
        author = current_user["username"] if current_user else "anonymous"
        author_id = current_user["id"] if current_user else None
        
        # AI Content Analysis
        moderation_analysis = await analyze_content_with_claude(confession.content, "moderation")
        enhancement_analysis = await analyze_content_with_claude(confession.content, "enhancement")
        
        # Handle crisis detection
        crisis_level = moderation_analysis.get("crisis_level", "none")
        if crisis_level in ["high", "critical"]:
            # Send crisis support resources
            if current_user and current_user.get("preferences", {}).get("crisis_support", True):
                await manager.send_personal_message(
                    json.dumps({
                        "type": "crisis_support",
                        "resources": {
                            "hotline": "988 - Suicide & Crisis Lifeline",
                            "chat": "https://suicidepreventionlifeline.org/chat/",
                            "text": "Text HOME to 741741"
                        }
                    }),
                    current_user["id"]
                )
        
        # Check if content should be auto-moderated
        if moderation_analysis.get("recommended_action") == "remove":
            raise HTTPException(
                status_code=400,
                detail="Content violates community guidelines"
            )
        
        # Prepare confession data
        confession_data = {
            "content": confession.content,
            "is_public": confession.is_public,
            "timestamp": datetime.utcnow().isoformat(),
            "author": author,
            "mood": enhancement_analysis.get("mood", confession.mood),
            "tags": list(set(confession.tags + enhancement_analysis.get("tags", []))),
            "ai_analysis": {
                "moderation": moderation_analysis,
                "enhancement": enhancement_analysis
            }
        }
        
        # Upload to Irys
        irys_tags = [
            {"name": "Content-Type", "value": "confession"},
            {"name": "Public", "value": str(confession.is_public).lower()},
            {"name": "App", "value": "Irys-Confession-Board"},
            {"name": "Author", "value": author},
            {"name": "Mood", "value": confession_data["mood"] or "neutral"},
            {"name": "Timestamp", "value": str(int(datetime.utcnow().timestamp()))}
        ]
        
        irys_result = await call_irys_service({
            "action": "upload",
            "data": confession_data,
            "tags": irys_tags
        })
        
        if not irys_result.get("success"):
            raise HTTPException(status_code=500, detail=f"Failed to upload to Irys: {irys_result.get('error')}")
        
        # Store confession in database
        confession_doc = {
            "id": str(uuid.uuid4()),
            "tx_id": irys_result["tx_id"],
            "content": confession.content,
            "is_public": confession.is_public,
            "author": author,
            "author_id": author_id,
            "timestamp": datetime.utcnow(),
            "verified": True,
            "gateway_url": irys_result["gateway_url"],
            "upvotes": 0,
            "downvotes": 0,
            "reply_count": 0,
            "view_count": 0,
            "tags": confession_data["tags"],
            "mood": confession_data["mood"],
            "ai_analysis": confession_data["ai_analysis"],
            "crisis_level": crisis_level,
            "moderation": {
                "flagged": moderation_analysis.get("recommended_action") == "flag",
                "reviewed": False,
                "approved": moderation_analysis.get("recommended_action") == "approve" or moderation_analysis.get("error") is not None
            }
        }
        
        await db.confessions.insert_one(confession_doc)
        
        # Update user stats
        if current_user:
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$inc": {"stats.confession_count": 1}}
            )
        
        # Broadcast new confession to connected users
        if confession.is_public:
            await manager.broadcast(json.dumps({
                "type": "new_confession",
                "confession": {
                    "id": confession_doc["id"],
                    "tx_id": confession_doc["tx_id"],
                    "content": confession_doc["content"],
                    "author": confession_doc["author"],
                    "timestamp": confession_doc["timestamp"].isoformat(),
                    "upvotes": confession_doc["upvotes"],
                    "mood": confession_doc["mood"],
                    "tags": confession_doc["tags"],
                    "verified": confession_doc["verified"],
                    "gateway_url": confession_doc["gateway_url"]
                }
            }))
        
        return {
            "status": "success",
            "id": confession_doc["id"],
            "tx_id": irys_result["tx_id"],
            "gateway_url": irys_result["gateway_url"],
            "blockchain_url": f"https://devnet.irys.xyz/{irys_result['tx_id']}",
            "share_url": f"/#/c/{irys_result['tx_id']}" + ("" if confession.is_public else f"#{author}"),
            "verified": True,
            "ai_analysis": confession_data["ai_analysis"],
            "crisis_support": crisis_level in ["high", "critical"],
            "message": "Confession posted successfully! View on blockchain: https://devnet.irys.xyz/" + irys_result["tx_id"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Reply Routes
@api_router.post("/confessions/{confession_id}/replies")
async def create_reply(
    confession_id: str,
    reply: ReplyCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user_optional)
):
    """Create a reply to a confession"""
    try:
        # Check if confession exists
        confession = await db.confessions.find_one({"$or": [{"id": confession_id}, {"tx_id": confession_id}]})
        if not confession:
            raise HTTPException(status_code=404, detail="Confession not found")
        
        # Determine author
        author = current_user["username"] if current_user else "anonymous"
        author_id = current_user["id"] if current_user else None
        
        # AI Content Analysis
        moderation_analysis = await analyze_content_with_claude(reply.content, "moderation")
        
        # Handle crisis detection
        crisis_level = moderation_analysis.get("crisis_level", "none")
        if crisis_level in ["high", "critical"]:
            if current_user and current_user.get("preferences", {}).get("crisis_support", True):
                await manager.send_personal_message(
                    json.dumps({
                        "type": "crisis_support",
                        "resources": {
                            "hotline": "988 - Suicide & Crisis Lifeline",
                            "chat": "https://suicidepreventionlifeline.org/chat/",
                            "text": "Text HOME to 741741"
                        }
                    }),
                    current_user["id"]
                )
        
        # Check if content should be auto-moderated
        if moderation_analysis.get("recommended_action") == "remove":
            raise HTTPException(
                status_code=400,
                detail="Reply violates community guidelines"
            )
        
        # Create reply document
        reply_doc = {
            "id": str(uuid.uuid4()),
            "confession_id": confession["id"],
            "parent_reply_id": reply.parent_reply_id,
            "content": reply.content,
            "author": author,
            "author_id": author_id,
            "timestamp": datetime.utcnow(),
            "upvotes": 0,
            "downvotes": 0,
            "verified": False,
            "ai_analysis": {"moderation": moderation_analysis},
            "crisis_level": crisis_level,
            "moderation": {
                "flagged": moderation_analysis.get("recommended_action") == "flag",
                "reviewed": False,
                "approved": moderation_analysis.get("recommended_action") == "approve" or moderation_analysis.get("error") is not None
            }
        }
        
        # Upload to Irys (optional for replies)
        if current_user:  # Only upload to Irys if user is logged in
            reply_data = {
                "content": reply.content,
                "confession_id": confession["id"],
                "parent_reply_id": reply.parent_reply_id,
                "author": author,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            irys_tags = [
                {"name": "Content-Type", "value": "reply"},
                {"name": "App", "value": "Irys-Confession-Board"},
                {"name": "Author", "value": author},
                {"name": "ParentID", "value": confession["id"]},
                {"name": "Timestamp", "value": str(int(datetime.utcnow().timestamp()))}
            ]
            
            irys_result = await call_irys_service({
                "action": "upload",
                "data": reply_data,
                "tags": irys_tags
            })
            
            if irys_result.get("success"):
                reply_doc["tx_id"] = irys_result["tx_id"]
                reply_doc["verified"] = True
        
        await db.replies.insert_one(reply_doc)
        
        # Update reply count on confession
        await db.confessions.update_one(
            {"id": confession["id"]},
            {"$inc": {"reply_count": 1}}
        )
        
        # Broadcast new reply to connected users
        await manager.broadcast(json.dumps({
            "type": "new_reply",
            "reply": {
                "id": reply_doc["id"],
                "confession_id": reply_doc["confession_id"],
                "content": reply_doc["content"],
                "author": reply_doc["author"],
                "timestamp": reply_doc["timestamp"].isoformat(),
                "upvotes": reply_doc["upvotes"]
            }
        }))
        
        return {
            "status": "success",
            "id": reply_doc["id"],
            "tx_id": reply_doc.get("tx_id"),
            "message": "Reply posted successfully!"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/confessions/{confession_id}/replies")
async def get_replies(confession_id: str, limit: int = 50, offset: int = 0):
    """Get replies for a confession"""
    try:
        # Find confession
        confession = await db.confessions.find_one({"$or": [{"id": confession_id}, {"tx_id": confession_id}]})
        if not confession:
            raise HTTPException(status_code=404, detail="Confession not found")
        
        # Get replies
        cursor = db.replies.find(
            {"confession_id": confession["id"]},
            {"_id": 0}
        ).sort("timestamp", 1).skip(offset).limit(limit)
        
        replies = await cursor.to_list(length=limit)
        
        # Build threaded structure
        reply_map = {}
        root_replies = []
        
        for reply in replies:
            reply_map[reply["id"]] = reply
            reply["children"] = []
            
            if reply["parent_reply_id"]:
                parent = reply_map.get(reply["parent_reply_id"])
                if parent:
                    parent["children"].append(reply)
            else:
                root_replies.append(reply)
        
        return {
            "replies": root_replies,
            "count": len(replies),
            "offset": offset,
            "limit": limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced Confession Routes
@api_router.get("/confessions/public")
async def get_public_confessions(
    limit: int = 50,
    offset: int = 0,
    sort_by: str = "timestamp",
    order: str = "desc"
):
    """Get public confessions feed"""
    try:
        # Build sort parameter
        sort_order = -1 if order == "desc" else 1
        sort_param = [(sort_by, sort_order)]
        
        # Query database for public confessions
        print(f"Fetching confessions with limit={limit}, offset={offset}, sort_by={sort_by}, order={order}")
        
        # First, let's see what's in the database
        total_confessions = await db.confessions.count_documents({})
        public_confessions = await db.confessions.count_documents({"is_public": True})
        print(f"Total confessions in DB: {total_confessions}")
        print(f"Public confessions in DB: {public_confessions}")
        
        # More lenient filter - include confessions that don't have moderation.approved set to False
        cursor = db.confessions.find(
            {
                "is_public": True,
                "$or": [
                    {"moderation.approved": {"$ne": False}},
                    {"moderation.approved": {"$exists": False}},
                    {"moderation": {"$exists": False}}
                ]
            },
            {"_id": 0}
        ).sort(sort_param).skip(offset).limit(limit)
        
        confessions = await cursor.to_list(length=limit)
        print(f"Returning {len(confessions)} confessions")
        
        # Debug: Show first confession structure
        if confessions:
            print(f"First confession structure: {confessions[0]}")
        
        return {
            "confessions": confessions,
            "count": len(confessions),
            "offset": offset,
            "limit": limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/confessions/{tx_id}")
async def get_confession(tx_id: str):
    """Get specific confession by transaction ID"""
    try:
        # Find confession
        confession = await db.confessions.find_one(
            {"$or": [{"tx_id": tx_id}, {"id": tx_id}]},
            {"_id": 0}
        )
        
        if not confession:
            raise HTTPException(status_code=404, detail="Confession not found")
        
        # Increment view count
        await db.confessions.update_one(
            {"id": confession["id"]},
            {"$inc": {"view_count": 1}}
        )
        
        return confession
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/confessions/{confession_id}/vote")
async def vote_confession(
    confession_id: str,
    vote_request: VoteRequest,
    current_user: dict = Depends(get_current_user_optional)
):
    """Vote on a confession"""
    try:
        if vote_request.vote_type not in ["upvote", "downvote"]:
            raise HTTPException(status_code=400, detail="Invalid vote type")
        
        # Check if confession exists
        confession = await db.confessions.find_one({"$or": [{"id": confession_id}, {"tx_id": confession_id}]})
        if not confession:
            raise HTTPException(status_code=404, detail="Confession not found")
        
        # Determine user identifier
        user_identifier = current_user["id"] if current_user else vote_request.user_address
        
        # Check if user already voted
        existing_vote = await db.votes.find_one({
            "confession_id": confession["id"],
            "user_identifier": user_identifier
        })
        
        if existing_vote:
            # Update existing vote
            if existing_vote["vote_type"] == vote_request.vote_type:
                raise HTTPException(status_code=400, detail="Already voted")
            else:
                # Change vote
                old_vote = existing_vote["vote_type"]
                await db.votes.update_one(
                    {"id": existing_vote["id"]},
                    {"$set": {"vote_type": vote_request.vote_type, "timestamp": datetime.utcnow()}}
                )
                
                # Update confession counts
                if old_vote == "upvote":
                    await db.confessions.update_one(
                        {"id": confession["id"]},
                        {"$inc": {"upvotes": -1, "downvotes": 1}}
                    )
                else:
                    await db.confessions.update_one(
                        {"id": confession["id"]},
                        {"$inc": {"upvotes": 1, "downvotes": -1}}
                    )
        else:
            # Record new vote
            vote_doc = {
                "id": str(uuid.uuid4()),
                "confession_id": confession["id"],
                "user_identifier": user_identifier,
                "vote_type": vote_request.vote_type,
                "timestamp": datetime.utcnow()
            }
            
            await db.votes.insert_one(vote_doc)
            
            # Update confession vote count
            update_field = "upvotes" if vote_request.vote_type == "upvote" else "downvotes"
            await db.confessions.update_one(
                {"id": confession["id"]},
                {"$inc": {update_field: 1}}
            )
        
        # Broadcast vote update
        await manager.broadcast(json.dumps({
            "type": "vote_update",
            "confession_id": confession["id"],
            "vote_type": vote_request.vote_type
        }))
        
        return {"status": "success", "message": f"{vote_request.vote_type} recorded"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/replies/{reply_id}/vote")
async def vote_reply(
    reply_id: str,
    vote_request: VoteRequest,
    current_user: dict = Depends(get_current_user_optional)
):
    """Vote on a reply"""
    try:
        if vote_request.vote_type not in ["upvote", "downvote"]:
            raise HTTPException(status_code=400, detail="Invalid vote type")
        
        # Check if reply exists
        reply = await db.replies.find_one({"id": reply_id})
        if not reply:
            raise HTTPException(status_code=404, detail="Reply not found")
        
        # Determine user identifier
        user_identifier = current_user["id"] if current_user else vote_request.user_address
        
        # Check if user already voted
        existing_vote = await db.reply_votes.find_one({
            "reply_id": reply_id,
            "user_identifier": user_identifier
        })
        
        if existing_vote:
            if existing_vote["vote_type"] == vote_request.vote_type:
                raise HTTPException(status_code=400, detail="Already voted")
            else:
                # Change vote
                old_vote = existing_vote["vote_type"]
                await db.reply_votes.update_one(
                    {"id": existing_vote["id"]},
                    {"$set": {"vote_type": vote_request.vote_type, "timestamp": datetime.utcnow()}}
                )
                
                # Update reply counts
                if old_vote == "upvote":
                    await db.replies.update_one(
                        {"id": reply_id},
                        {"$inc": {"upvotes": -1, "downvotes": 1}}
                    )
                else:
                    await db.replies.update_one(
                        {"id": reply_id},
                        {"$inc": {"upvotes": 1, "downvotes": -1}}
                    )
        else:
            # Record new vote
            vote_doc = {
                "id": str(uuid.uuid4()),
                "reply_id": reply_id,
                "user_identifier": user_identifier,
                "vote_type": vote_request.vote_type,
                "timestamp": datetime.utcnow()
            }
            
            await db.reply_votes.insert_one(vote_doc)
            
            # Update reply vote count
            update_field = "upvotes" if vote_request.vote_type == "upvote" else "downvotes"
            await db.replies.update_one(
                {"id": reply_id},
                {"$inc": {update_field: 1}}
            )
        
        return {"status": "success", "message": f"{vote_request.vote_type} recorded"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Advanced Search Routes
@api_router.post("/search")
async def search_confessions(search_request: SearchRequest):
    """Advanced search for confessions"""
    try:
        # Build search query
        query = {"is_public": True, "moderation.approved": {"$ne": False}}
        
        # Text search
        if search_request.query:
            query["$text"] = {"$search": search_request.query}
        
        # Mood filter
        if search_request.mood:
            query["mood"] = search_request.mood
        
        # Tags filter
        if search_request.tags:
            query["tags"] = {"$in": search_request.tags}
        
        # Author filter
        if search_request.author:
            query["author"] = search_request.author
        
        # Date range filter
        if search_request.date_from or search_request.date_to:
            date_query = {}
            if search_request.date_from:
                date_query["$gte"] = search_request.date_from
            if search_request.date_to:
                date_query["$lte"] = search_request.date_to
            query["timestamp"] = date_query
        
        # Sort parameters
        sort_order = -1 if search_request.order == "desc" else 1
        sort_param = [(search_request.sort_by, sort_order)]
        
        # Execute search
        cursor = db.confessions.find(query, {"_id": 0}).sort(sort_param).limit(50)
        confessions = await cursor.to_list(length=50)
        
        return {
            "confessions": confessions,
            "count": len(confessions),
            "query": search_request.dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/trending")
async def get_trending_confessions(limit: int = 20, timeframe: str = "24h"):
    """Get trending confessions"""
    try:
        # Calculate time threshold
        if timeframe == "1h":
            time_threshold = datetime.utcnow() - timedelta(hours=1)
        elif timeframe == "24h":
            time_threshold = datetime.utcnow() - timedelta(hours=24)
        elif timeframe == "7d":
            time_threshold = datetime.utcnow() - timedelta(days=7)
        elif timeframe == "30d":
            time_threshold = datetime.utcnow() - timedelta(days=30)
        else:
            time_threshold = datetime.utcnow() - timedelta(hours=24)
        
        # Aggregation pipeline for trending algorithm
        pipeline = [
            {
                "$match": {
                    "is_public": True,
                    "timestamp": {"$gte": time_threshold},
                    "moderation.approved": {"$ne": False}
                }
            },
            {
                "$addFields": {
                    "engagement_score": {
                        "$add": [
                            {"$multiply": ["$upvotes", 1]},
                            {"$multiply": ["$reply_count", 2]},
                            {"$multiply": ["$view_count", 0.1]}
                        ]
                    },
                    "time_decay": {
                        "$divide": [
                            {"$subtract": ["$$NOW", "$timestamp"]},
                            1000 * 60 * 60  # Convert to hours
                        ]
                    }
                }
            },
            {
                "$addFields": {
                    "trending_score": {
                        "$divide": [
                            "$engagement_score",
                            {"$add": ["$time_decay", 1]}
                        ]
                    }
                }
            },
            {"$sort": {"trending_score": -1}},
            {"$limit": limit},
            {"$project": {"_id": 0, "engagement_score": 0, "time_decay": 0, "trending_score": 0}}
        ]
        
        cursor = db.confessions.aggregate(pipeline)
        confessions = await cursor.to_list(length=limit)
        
        return {
            "confessions": confessions,
            "count": len(confessions),
            "timeframe": timeframe
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/tags/trending")
async def get_trending_tags(limit: int = 20):
    """Get trending tags"""
    try:
        # Aggregation pipeline for trending tags
        pipeline = [
            {
                "$match": {
                    "is_public": True,
                    "timestamp": {"$gte": datetime.utcnow() - timedelta(days=7)},
                    "moderation.approved": {"$ne": False}
                }
            },
            {"$unwind": "$tags"},
            {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": limit},
            {"$project": {"tag": "$_id", "count": 1, "_id": 0}}
        ]
        
        cursor = db.confessions.aggregate(pipeline)
        tags = await cursor.to_list(length=limit)
        
        return {
            "tags": tags,
            "count": len(tags)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Analytics Routes
@api_router.get("/debug/confessions")
async def debug_confessions():
    """Debug endpoint to see what's in the database"""
    try:
        total = await db.confessions.count_documents({})
        public = await db.confessions.count_documents({"is_public": True})
        approved = await db.confessions.count_documents({"moderation.approved": True})
        flagged = await db.confessions.count_documents({"moderation.approved": False})
        no_moderation = await db.confessions.count_documents({"moderation": {"$exists": False}})
        
        # Get a few sample confessions
        samples = await db.confessions.find({}, {"_id": 0, "id": 1, "content": 1, "is_public": 1, "moderation": 1}).limit(5).to_list(length=5)
        
        return {
            "total_confessions": total,
            "public_confessions": public,
            "approved_confessions": approved,
            "flagged_confessions": flagged,
            "no_moderation_field": no_moderation,
            "sample_confessions": samples
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/stats")
async def get_platform_stats():
    """Get platform statistics"""
    try:
        # Get various stats
        total_confessions = await db.confessions.count_documents({})
        public_confessions = await db.confessions.count_documents({"is_public": True})
        total_users = await db.users.count_documents({})
        total_replies = await db.replies.count_documents({})
        
        # Get stats for last 24 hours
        last_24h = datetime.utcnow() - timedelta(hours=24)
        confessions_24h = await db.confessions.count_documents({"timestamp": {"$gte": last_24h}})
        
        # Count unique users who posted confessions in last 24h
        users_24h_pipeline = [
            {"$match": {"timestamp": {"$gte": last_24h}}},
            {"$group": {"_id": "$author"}},
            {"$count": "unique_users"}
        ]
        users_24h_cursor = db.confessions.aggregate(users_24h_pipeline)
        users_24h_result = await users_24h_cursor.to_list(length=1)
        users_24h = users_24h_result[0]["unique_users"] if users_24h_result else 0
        
        # Get mood distribution
        mood_pipeline = [
            {"$group": {"_id": "$mood", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        mood_cursor = db.confessions.aggregate(mood_pipeline)
        mood_stats = await mood_cursor.to_list(length=10)
        
        return {
            "total_confessions": total_confessions,
            "public_confessions": public_confessions,
            "total_users": total_users,
            "total_replies": total_replies,
            "last_24h": {
                "confessions": confessions_24h,
                "new_users": users_24h
            },
            "mood_distribution": mood_stats
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Irys Routes
@api_router.get("/irys/network-info")
async def get_irys_network_info():
    """Get Irys network configuration"""
    return {
        "network": "devnet",
        "gateway_url": "https://devnet.irys.xyz",
        "rpc_url": "https://rpc.devnet.irys.xyz/v1",
        "explorer_url": "https://devnet.irys.xyz",
        "faucet_url": "https://faucet.devnet.irys.xyz"
    }

@api_router.get("/irys/balance")
async def get_irys_balance():
    """Get account balance on Irys"""
    try:
        result = await call_irys_service({"action": "balance"})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/irys/address")
async def get_irys_address():
    """Get Irys wallet address"""
    try:
        result = await call_irys_service({"action": "address"})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/verify/{tx_id}")
async def verify_transaction(tx_id: str):
    """Verify transaction on Irys"""
    try:
        # Check if transaction exists in our database
        confession = await db.confessions.find_one({"tx_id": tx_id})
        if confession:
            return {
                "verified": True,
                "type": "confession",
                "data": confession
            }
        
        reply = await db.replies.find_one({"tx_id": tx_id})
        if reply:
            return {
                "verified": True,
                "type": "reply",
                "data": reply
            }
        
        return {
            "verified": False,
            "message": "Transaction not found"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Create indexes on startup"""
    try:
        # Create text index for search
        await db.confessions.create_index([("content", "text"), ("tags", "text")])
        
        # Create other useful indexes
        await db.confessions.create_index([("timestamp", -1)])
        await db.confessions.create_index([("upvotes", -1)])
        await db.confessions.create_index([("is_public", 1)])
        await db.confessions.create_index([("author", 1)])
        await db.confessions.create_index([("mood", 1)])
        await db.confessions.create_index([("tx_id", 1)])
        
        # User indexes
        await db.users.create_index([("username", 1)], unique=True)
        await db.users.create_index([("email", 1)], unique=True, sparse=True)
        
        # Reply indexes
        await db.replies.create_index([("confession_id", 1)])
        await db.replies.create_index([("timestamp", 1)])
        
        # Vote indexes
        await db.votes.create_index([("confession_id", 1), ("user_identifier", 1)], unique=True)
        await db.reply_votes.create_index([("reply_id", 1), ("user_identifier", 1)], unique=True)
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Failed to create indexes: {str(e)}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)