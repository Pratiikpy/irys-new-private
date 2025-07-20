#!/usr/bin/env python3
import os

print("🔍 Simple Environment Check for Irys Confession Board\n")

# Check if .env file exists
env_file = 'backend/.env'
env_vars = {}

if os.path.exists(env_file):
    print(f"✅ Environment file found: {env_file}")
    
    # Read and parse .env file manually
    try:
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    except Exception as e:
        print(f"❌ Error reading .env file: {e}")
else:
    print(f"❌ Environment file not found: {env_file}")
    print("💡 Please create backend/.env file with required variables")

# Required environment variables
required_vars = [
    'MONGO_URL',
    'DB_NAME', 
    'JWT_SECRET',
    'IRYS_PRIVATE_KEY',
    'CLAUDE_API_KEY'
]

print("\n📋 Required Environment Variables:")
missing_required = []
for var in required_vars:
    value = env_vars.get(var)
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

print("\n🎯 Summary:")
if missing_required:
    print(f"  ❌ Missing {len(missing_required)} required environment variables:")
    for var in missing_required:
        print(f"     - {var}")
    print("\n  💡 Please set these variables in backend/.env file")
    print("  📝 Example .env file:")
    print("     MONGO_URL=mongodb://localhost:27017")
    print("     DB_NAME=irys_confession_board")
    print("     JWT_SECRET=your-secret-key-here")
    print("     IRYS_PRIVATE_KEY=your-irys-private-key-here")
    print("     CLAUDE_API_KEY=your-claude-api-key-here")
else:
    print("  ✅ All required environment variables are set")
    print("  💡 If confessions still aren't saving, check the backend logs for errors")

print("\n🔧 Next Steps:")
print("  1. Make sure MongoDB is running")
print("  2. Start the backend server")
print("  3. Try posting a confession")
print("  4. Check backend logs for any errors") 