# app/utils/logger.py
import os
import logging
from logging.handlers import RotatingFileHandler
import sys

def setup_logging():
    """Configure logging for the application."""
    # Create logs directory if it doesn't exist
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Configure root logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(console_format)
    
    # File handler
    file_handler = RotatingFileHandler(
        f"{log_dir}/app.log", 
        maxBytes=10485760,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.INFO)
    file_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(file_format)
    
    # Add handlers to logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    # Create a separate logger for scraper
    scraper_logger = logging.getLogger("scraper")
    scraper_file_handler = RotatingFileHandler(
        f"{log_dir}/scraper.log", 
        maxBytes=10485760,  # 10MB
        backupCount=5
    )
    scraper_file_handler.setFormatter(file_format)
    scraper_logger.addHandler(scraper_file_handler)
    
    # Log startup message
    logger.info("Logging configured successfully")
    
    return logger 