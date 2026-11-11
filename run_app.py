import sys
import os
import subprocess
import webbrowser
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"
FRONTEND_DIR = BASE_DIR / "frontend"

def main():
    print("=" * 65)
    print("   🚀 Interactive Q-Learning Visualizer | AI Lab Launcher")
    print("=" * 65)
    
    # Check if python dependencies installed
    try:
        import fastapi
        import uvicorn
        import websockets
    except ImportError:
        print("[!] Installing missing python requirements...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)

    # Check if frontend is built
    dist_index = FRONTEND_DIR / "dist" / "index.html"
    if not dist_index.exists():
        print("[*] Building frontend assets (Vite)...")
        subprocess.run(["npm", "run", "build"], cwd=str(FRONTEND_DIR), shell=True, check=True)

    print("\n[+] Starting FastAPI backend server at http://localhost:8000 ...")
    print("[+] Both Frontend and Backend are served unified at: http://localhost:8000\n")
    print("[*] Press Ctrl+C anytime to stop.\n")

    # Add backend directory to python path
    if str(BACKEND_DIR) not in sys.path:
        sys.path.insert(0, str(BACKEND_DIR))

    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, app_dir=str(BACKEND_DIR), reload=True)

if __name__ == "__main__":
    main()

