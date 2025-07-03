import requests
from bs4 import BeautifulSoup
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time
import firebase_admin
from firebase_admin import credentials, firestore
import uuid
import os
import logging
import sys
import traceback

# Handle imports differently based on how the script is run
try:
    from app.utils.text_processing import clean_university_name
except ModuleNotFoundError:
    # When running as a standalone script, adjust import path
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    try:
        from app.utils.text_processing import clean_university_name
    except ModuleNotFoundError:
        # If still fails, define a simple fallback function
        def clean_university_name(name):
            if not name:
                return ""
            # Basic cleaning - strip whitespace and handle common abbreviations
            name = name.strip()
            return name

# Setup logging
logger = logging.getLogger("scraper")
if not logger.handlers:
    # Configure handlers if they don't exist
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    
    # Also log to stdout when running as a script
    if __name__ == "__main__":
        # Also print to stdout
        print_handler = logging.StreamHandler(sys.stdout)
        print_handler.setFormatter(formatter)
        logger.addHandler(print_handler)

# Initialize Firebase Admin SDK - different approaches when run as script vs module
firebase_app = None
db = None

def initialize_firebase():
    global firebase_app, db
    
    # Check if Firebase is already initialized
    if firebase_app is not None:
        return True
        
    try:
        # Search in multiple locations for the credentials file
        possible_paths = [
            # Current directory
            "firebase_key.json",
            "firebase-service-account.json",
            # Parent directory
            os.path.join("..", "firebase-service-account.json"),
            # Absolute paths
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
                        "firebase-service-account.json"),
            "C:/Users/Usman/Desktop/Project/NEwith modules/NE/backend_project/firebase-service-account.json"
        ]
        
        # Try each path until we find a valid one
        cred_file = None
        for path in possible_paths:
            if os.path.exists(path):
                cred_file = path
                break
                
        if cred_file:
            # Initialize with the found credentials file
            print(f"Initializing Firebase with credentials from: {cred_file}")
            cred = credentials.Certificate(cred_file)
            firebase_app = firebase_admin.initialize_app(cred)
            db = firestore.client()
            logger.info(f"Firebase initialized with credentials from {cred_file}")
            return True
        else:
            logger.error("Could not find Firebase credentials file in any of the expected locations")
            return False
            
    except Exception as e:
        logger.error(f"Error initializing Firebase: {e}")
        print(f"Error initializing Firebase: {e}")
        return False

# Initialize Firebase when imported as a module
if __name__ != "__main__":
    try:
        # When imported as a module, we might be using FirebaseService
        from app.services.firebase_service import FirebaseService
        firebase_service = FirebaseService()
        db = firestore.client()
    except ImportError:
        # If that fails, try to initialize directly
        initialize_firebase()

def scrape_university_page(url):
    try:
        # Send GET request
        response = requests.get(url)
        response.raise_for_status()

        # Parse the HTML
        soup = BeautifulSoup(response.text, "html.parser")

        # Initialize dictionary to store all extracted data
        university_data = {
            "name": "",
            "basic_info": {},
            "description": "",
            "programs": {},
            "apply_link": "",
            "url": url,
            "scraped_at": firestore.SERVER_TIMESTAMP,
            "admissionOpen": True  # Default to true for new/updated universities
        }

        # Extract University Name
        name_element = soup.find("h1", class_="max-sm:text-base sm:text-2xl md:text-3xl lg:text-4xl text-center font-bold text-primary")
        if name_element:
            university_data["name"] = clean_university_name(name_element.get_text(strip=True))
        else:
            print("Warning: University name not found.")
            # Try fallback selector
            alt_name_el = soup.find("h1", class_=re.compile(r"text-primary"))
            if alt_name_el:
                university_data["name"] = clean_university_name(alt_name_el.get_text(strip=True))
                print(f"Found university name with fallback selector: {university_data['name']}")

        # Extract Basic Info from Table
        table = soup.find("table", class_="min-w-full border-collapse border border-primary text-primary font-semibold")
        if table:
            for row in table.find_all("tr"):
                cells = row.find_all("td")
                if len(cells) == 2:
                    key = cells[0].get_text(strip=True)
                    value = cells[1].get_text(strip=True)
                    university_data["basic_info"][key] = value
        else:
            print("Warning: Basic info table not found.")
            # Try fallback selector
            alt_table = soup.find("table", class_=re.compile(r"min-w-full"))
            if alt_table:
                for row in alt_table.find_all("tr"):
                    cells = row.find_all("td")
                    if len(cells) == 2:
                        key = cells[0].get_text(strip=True)
                        value = cells[1].get_text(strip=True)
                        university_data["basic_info"][key] = value

        # Extract Description
        desc_element = soup.find("div", class_="University_Description")
        if desc_element:
            desc_h1 = desc_element.find("h1")
            if desc_h1:
                university_data["description"] = desc_h1.get_text(strip=True)
            else:
                print("Warning: Description header not found.")
        else:
            print("Warning: Description section not found.")

        # Extract Offered Programs
        programs_section = soup.find("div", class_="University_Programs")
        if programs_section:
            program_categories = programs_section.find_all("div", class_="BS_Programs")
            for category in program_categories:
                category_title = category.find("h1", class_=re.compile(r"font-bold.*underline"))
                programs_list = category.find("div", class_="pl-2 flex flex-col gap-1")
                # Only process if both title and programs list exist
                if category_title and programs_list:
                    category_name = category_title.get_text(strip=True)
                    programs = []
                    for prog in programs_list.find_all("h1"):
                        prog_text = prog.get_text(strip=True)
                        # Extract program name, removing numbering
                        if ". " in prog_text:
                            try:
                                prog_name = prog_text.split(". ", 1)[1]
                                programs.append(prog_name)
                            except IndexError:
                                print(f"Warning: Could not parse program: {prog_text}")
                                continue
                        else:
                            programs.append(prog_text)
                    if programs:  # Only add category if it has programs
                        university_data["programs"][category_name] = programs
        else:
            print("Warning: Programs section not found.")

        # Extract Apply Link
        apply_section = soup.find("div", class_="HOW_TO_APPLY?")
        if apply_section:
            apply_link = apply_section.find("a", href=True)
            if apply_link and "href" in apply_link.attrs:
                university_data["apply_link"] = apply_link["href"]
            else:
                print("Warning: Apply link not found.")
        else:
            print("Warning: Apply section not found.")
            # Try fallback for apply link
            apply_btn = soup.find("a", string=re.compile(r"Apply", re.IGNORECASE))
            if apply_btn and apply_btn.get("href"):
                university_data["apply_link"] = apply_btn["href"]
                print(f"Found apply link with fallback selector: {university_data['apply_link']}")

        return university_data

    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None
    except Exception as e:
        print(f"Error parsing {url}: {e}")
        return None

def store_in_firestore(data):
    if not data or not data.get("name"):
        print("No valid data to store in Firestore.")
        return None
    
    try:
        # Extract document ID from URL (e.g., 67f51adc67c7579713621086 from /university/67f51adc67c7579713621086)
        url_parts = data["url"].split("/")
        doc_id = url_parts[-1] if url_parts[-1] else str(uuid.uuid4())

        # Store in Firestore
        doc_ref = db.collection("universities").document(doc_id)
        doc_ref.set(data)
        print(f"Successfully stored data for {data['name']} in Firestore (ID: {doc_id})")
        return doc_id
    except Exception as e:
        print(f"Error storing data in Firestore: {e}")
        return None

def display_data(data):
    if not data:
        print("No data to display.")
        return

    print(f"\n=== University Information: {data['url']} ===")
    print(f"Name: {data['name']}")
    
    print("\nBasic Information:")
    if data["basic_info"]:
        for key, value in data["basic_info"].items():
            print(f"  {key}: {value}")
    else:
        print("  No basic information available.")
    
    print("\nDescription:")
    print(f"  {data['description'] or 'No description available.'}")
    
    print("\nOffered Programs:")
    if data["programs"]:
        for category, programs in data["programs"].items():
            print(f"  {category}:")
            if programs:
                for i, program in enumerate(programs, 1):
                    print(f"    {i}. {program}")
            else:
                print("    No programs listed.")
    else:
        print("  No programs available.")
    
    print("\nAdmission:")
    print(f"  Apply Link: {data['apply_link'] or 'No apply link available.'}")

def scrape_all_universities():
    """Main function to scrape all universities and store in Firestore"""
    scraped_universities = []
    driver = None
    
    try:
        # Set up Chrome options
        options = Options()
        options.add_argument("--headless=new")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        
        # Start Chrome driver
        print("Starting Chrome WebDriver...")
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        driver.get("https://pakeducareers.com")
        print("Navigated to https://pakeducareers.com")
        time.sleep(5)  # Wait for JS to load

        # Collect university links
        print("Collecting university links...")
        elements = driver.find_elements(By.XPATH, '//a[starts-with(@href, "/university/")]')
        
        base_url = "https://pakeducareers.com"
        links = set()

        for el in elements:
            href = el.get_attribute("href")
            if href:
                full_url = href if href.startswith("http") else base_url + href
                links.add(full_url)

        driver.quit()
        driver = None

        print(f"Total unique university links found: {len(links)}\n")
        if not links:
            print("No university links found. Exiting.")
            return []

        # Process each university link
        for i, link in enumerate(links, start=1):
            print(f"--- Processing {i}/{len(links)}: {link} ---")
            data = scrape_university_page(link)
            if data:
                doc_id = store_in_firestore(data)
                if doc_id:
                    data["id"] = doc_id
                    scraped_universities.append(data)
            else:
                print("No data found or error occurred.")
            print("\n")
        
        print(f"Scraping completed. Scraped {len(scraped_universities)} universities.")
        return scraped_universities

    except Exception as e:
        print(f"Error during Selenium scraping: {e}")
        if driver:
            driver.quit()
        return []

# Execute the script if run directly
if __name__ == "__main__":
    print("Starting university scraper...")
    
    # Initialize Firebase when run as script
    if not initialize_firebase():
        print("Failed to initialize Firebase. Exiting.")
        sys.exit(1)
        
    try:
        print("Starting university scraping process...")
        universities = scrape_all_universities()
        print(f"Scraping complete. Processed {len(universities)} universities.")
        sys.exit(0)
    except Exception as e:
        print(f"Error during scraping: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        sys.exit(1)