#!/usr/bin/env python3
"""
Startup script for Irys Confession Board Backend
"""

import uvicorn
import os
from pathlib import Path

def main():
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Configuration
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    reload = debug
    
    print(f"🚀 Starting Irys Confession Board Backend")
    print(f"📍 Host: {host}")
    print(f"🔌 Port: {port}")
    print(f"🐛 Debug: {debug}")
    print(f"🔄 Reload: {reload}")
    
    # Start the server
    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info" if not debug else "debug",
        access_log=True
    )

if __name__ == "__main__":
    main() 