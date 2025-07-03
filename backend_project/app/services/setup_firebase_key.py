"""
Helper script to copy Firebase credentials file to the correct location
"""
import os
import shutil
import sys

def setup_firebase_key():
    try:
        # Get the path of this script
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Path to the root backend directory
        backend_dir = os.path.dirname(os.path.dirname(current_dir))
        
        # Source credentials file
        source_file = os.path.join(backend_dir, "firebase-service-account.json")
        
        # Target location (same directory as the scraper script)
        target_file = os.path.join(current_dir, "firebase_key.json")
        
        # Check if source file exists
        if not os.path.exists(source_file):
            print(f"Error: Firebase credentials file not found at {source_file}")
            return False
        
        # Copy the file
        shutil.copyfile(source_file, target_file)
        print(f"Firebase credentials successfully copied to {target_file}")
        return True
    
    except Exception as e:
        print(f"Error setting up Firebase credentials: {e}")
        return False

if __name__ == "__main__":
    if setup_firebase_key():
        print("Firebase key setup complete.")
        sys.exit(0)
    else:
        print("Firebase key setup failed.")
        sys.exit(1) 