"""
SellMyGoods — Enterprise Procurement & Supplier Collaboration
Entry point launcher. Runs FastAPI backend and serves the React frontend.
"""
import uvicorn
import os
import sys

# Ensure current directory is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.seed import seed_database

if __name__ == "__main__":
    print("=" * 70)
    print("  SellMyGoods — Enterprise Procurement & Supplier Collaboration")
    print("  Dual-Portal Platform: Admin Portal + Buyer Portal")
    print("=" * 70)
    
    # 1. Initialize & Seed Database
    seed_database()
    
    # 2. Start Uvicorn Server
    print("\nStarting SellMyGoods server on http://localhost:8000")
    print("Open http://localhost:8000 in your browser to access the application.\n")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)

