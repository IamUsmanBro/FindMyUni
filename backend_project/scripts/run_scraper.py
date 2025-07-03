#!/usr/bin/env python
"""
Wrapper script to run the scraper service with proper path setup
"""
import os
import sys
import subprocess

def run_scraper():
    """Run the scraper service with proper path setup"""
    # Get the absolute path to the backend_project directory
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Add the backend directory to Python path
    sys.path.insert(0, backend_dir)
    
    # Set PYTHONPATH environment variable to include backend_project
    # This ensures modules like 'app' can be imported
    os.environ['PYTHONPATH'] = os.pathsep.join([
        backend_dir,
        os.environ.get('PYTHONPATH', '')
    ]).rstrip(os.pathsep)
    
    # Path to the scraper service
    scraper_path = os.path.join(backend_dir, 'app', 'services', 'scraper_service.py')
    
    print(f"Running scraper with PYTHONPATH={os.environ['PYTHONPATH']}")
    print(f"Scraper script path: {scraper_path}")
    
    # Run the scraper as a subprocess to ensure it has the correct environment
    try:
        process = subprocess.Popen(
            [sys.executable, scraper_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=os.environ,  # Pass the updated environment
            cwd=backend_dir  # Set working directory to backend_project
        )
        
        # Stream output in real-time
        print("Scraper started. Output:")
        print("=" * 50)
        
        # Print stdout in real time
        for line in iter(process.stdout.readline, ''):
            if not line:
                break
            print(line.rstrip())
        
        # Wait for process to complete and capture return code
        process.wait()
        
        # Print any stderr output if there was an error
        if process.returncode != 0:
            print("\nError output:")
            print("=" * 50)
            stderr = process.stderr.read()
            print(stderr)
            
        return process.returncode
    except Exception as e:
        print(f"Error running scraper: {e}")
        return 1

if __name__ == "__main__":
    exit_code = run_scraper()
    sys.exit(exit_code) 