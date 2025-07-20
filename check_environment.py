#!/usr/bin/env python3
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

print("🔍 Environment Check for Irys Confession Board\n")

# Required environment variables
required_vars = [
    'MONGO_URL',
    'DB_NAME',
    'JWT_SECRET',
    'IRYS_PRIVATE_KEY',
    'CLAUDE_API_KEY'
]

# Optional but recommended
optional_vars = [
    'IRYS_NETWORK',
    'IRYS_RPC_URL',
    'CLAUDE_MODEL',
    'HOST',
    'PORT'
]

print("📋 Required Environment Variables:")
missing_required = []
for var in required_vars:
    value = os.getenv(var)
    if value:
        # Mask sensitive values
        if 'KEY' in var or 'SECRET' in var:
            masked_value = value[:8] + '...' + value[-4:] if len(value) > 12 else '***'
            print(f"  ✅ {var}: {masked_value}")
        else:
            print(f"  ✅ {var}: {value}")
    else:
        print(f"  ❌ {var}: NOT SET")
        missing_required.append(var)

print("\n📋 Optional Environment Variables:")
for var in optional_vars:
    value = os.getenv(var)
    if value:
        print(f"  ✅ {var}: {value}")
    else:
        print(f"  ⚠️  {var}: NOT SET (using default)")

print("\n🔧 Database Connection Test:")
try:
    import motor.motor_asyncio
    import asyncio
    
    async def test_db():
        try:
            mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
            db_name = os.getenv('DB_NAME', 'irys_confession_board')
            
            client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
            db = client[db_name]
            
            # Test connection
            await db.command('ping')
            print("  ✅ Database connection successful")
            
            # Check collections
            collections = await db.list_collection_names()
            print(f"  📊 Collections found: {collections}")
            
            # Check confession count
            confession_count = await db.confessions.count_documents({})
            print(f"  📝 Total confessions in database: {confession_count}")
            
            client.close()
            
        except Exception as e:
            print(f"  ❌ Database connection failed: {e}")
    
    asyncio.run(test_db())
    
except ImportError:
    print("  ⚠️  motor library not available, skipping database test")

print("\n🎯 Summary:")
if missing_required:
    print(f"  ❌ Missing {len(missing_required)} required environment variables:")
    for var in missing_required:
        print(f"     - {var}")
    print("\n  💡 Please set these variables in backend/.env file")
else:
    print("  ✅ All required environment variables are set")
    print("  💡 If confessions still aren't saving, check the backend logs for errors") 