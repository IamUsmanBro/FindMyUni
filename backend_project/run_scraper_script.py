#!/usr/bin/env python
"""
Direct script to run the university scraper
This can be run from the command line directly: python run_scraper_script.py
"""
import os
import sys
import traceback
import logging

def setup_logging():
    # Configure logging
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Console handler
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console.setFormatter(formatter)
    logger.addHandler(console)
    
    # File handler
    try:
        log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scraper.log')
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        print(f"Logging to: {log_file}")
    except Exception as e:
        print(f"Warning: Could not set up file logging: {e}")
    
    return logger

def main():
    logger = setup_logging()
    
    # Add the current directory to the Python path
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    try:
        logger.info("Starting university scraper script")
        print("Starting university scraper script")
        
        # Try to import the scraper module
        try:
            from app.services.scraper_service import scrape_all_universities, initialize_firebase
            
            # Initialize Firebase
            if not initialize_firebase():
                logger.error("Failed to initialize Firebase. Exiting.")
                return 1
                
            # Run the scraper
            logger.info("Starting scraping process...")
            universities = scrape_all_universities()
            logger.info(f"Scraping completed successfully. Processed {len(universities)} universities.")
            return 0
            
        except ImportError as ie:
            logger.error(f"Error importing scraper module: {ie}")
            print(f"Error importing scraper module: {ie}")
            
            # Try direct execution
            logger.info("Attempting direct script execution...")
            script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                                     "app", "services", "scraper_service.py")
            
            if os.path.exists(script_path):
                import subprocess
                result = subprocess.run([sys.executable, script_path], 
                                       capture_output=True, text=True)
                
                if result.returncode == 0:
                    logger.info("Direct script execution succeeded")
                    print(result.stdout)
                    return 0
                else:
                    logger.error(f"Direct script execution failed: {result.stderr}")
                    print(result.stderr)
                    return 1
            else:
                logger.error(f"Script not found at: {script_path}")
                return 1
                
    except Exception as e:
        logger.error(f"Error running scraper: {e}")
        logger.error(traceback.format_exc())
        print(f"Error running scraper: {e}")
        print(traceback.format_exc())
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code) 