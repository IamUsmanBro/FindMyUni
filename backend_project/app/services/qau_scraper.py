import requests
import re
from bs4 import BeautifulSoup
import logging
from firebase_admin import firestore
from datetime import datetime

logger = logging.getLogger(__name__)

def extract_dates_ignore_tables(soup):
    """Extract dates from the page content, excluding tables."""
    # Remove all table tags and their content
    for table in soup.find_all('table'):
        table.decompose()
    
    # Get remaining text and find dates
    page_text = soup.get_text()
    date_pattern = r'\b\d{2}-\d{2}-\d{4}\b'
    return re.findall(date_pattern, page_text)

def scrape_qau_university():
    """
    Scrape Quaid-i-Azam University admission data and format it according to 
    the project's university data schema.
    """
    try:
        logger.info("Starting QAU scraper")
        main_url = "https://ugadmissions.qau.edu.pk/oas/app/index.aspx"
        
        # Step 1: Get MPhil/PhD links from main page
        response = requests.get(main_url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Default deadline date in ISO format
        default_iso_deadline = "2025-01-31"
        # Check if the deadline has passed to set admissionOpen flag
        current_date = datetime.now()
        default_deadline_date = datetime.strptime(default_iso_deadline, "%Y-%m-%d")
        default_admission_open = default_deadline_date > current_date
        
        # Initialize data structure
        university_data = {
            "name": "Quaid-i-Azam University (QAU)",
            "basic_info": {
                "Location": "Islamabad, Pakistan",
                "Sector": "Public",
                "Deadline to Apply": default_iso_deadline,
                "Affiliation": "Higher Education Commission (HEC)"
            },
            "description": "Quaid-i-Azam University (once named Islamabad University) was established in July 1967 under the Act of National Assembly. It is a federal public sector university known for its international repute, faculty and research programs.",
            "programs": {},
            "apply_link": "https://qau.edu.pk/admission-notice-for-mphil-ms-programme-spring-semester-2025/",
            "url": "https://qau.edu.pk/",
            "scraped_at": firestore.SERVER_TIMESTAMP,
            "admissionOpen": default_admission_open
        }
        
        # Collect program links
        program_links = []
        for tag in soup.find_all('a'):
            href = tag.get('href', '').lower()
            text = tag.text.lower()
            if any(keyword in href or keyword in text for keyword in ['mphil', 'phd']):
                full_url = requests.compat.urljoin("https://qau.edu.pk", href)
                program_links.append({
                    'url': full_url,
                    'title': tag.text.strip()
                })
        
        # Process programs by category
        mphil_programs = []
        phd_programs = []
        
        # Process each program link
        for program in program_links:
            try:
                prog_response = requests.get(program['url'])
                prog_response.raise_for_status()
                prog_soup = BeautifulSoup(prog_response.text, 'html.parser')
                
                # Check if this is MPhil or PhD based on title/URL
                is_mphil = 'mphil' in program['title'].lower() or 'ms' in program['title'].lower()
                is_phd = 'phd' in program['title'].lower()
                
                # Extract program info from tables
                tables = prog_soup.find_all('table')
                for table in tables:
                    rows = table.find_all('tr')
                    for row in rows:
                        cols = row.find_all('td')
                        if len(cols) >= 2:  # We need at least discipline and area columns
                            discipline = cols[0].get_text(strip=True)
                            if discipline and discipline != "S.#" and not discipline.isdigit():
                                # Format: "1. Discipline Name" -> "Discipline Name"
                                if '.' in discipline and discipline.split('.', 1)[0].strip().isdigit():
                                    discipline = discipline.split('.', 1)[1].strip()
                                
                                # Add to appropriate program list
                                if is_mphil:
                                    mphil_programs.append(discipline)
                                elif is_phd:
                                    phd_programs.append(discipline)
                
                # Get deadline date from page content
                dates = extract_dates_ignore_tables(prog_soup)
                if dates:
                    raw_deadline = sorted(set(dates))[0]  # Get the earliest date
                    # Convert DD-MM-YYYY to YYYY-MM-DD for JavaScript compatibility
                    parts = raw_deadline.split("-")
                    iso_deadline = f"{parts[2]}-{parts[1]}-{parts[0]}"
                    university_data["basic_info"]["Deadline to Apply"] = iso_deadline
                    
                    # Update admission status based on deadline
                    deadline_date = datetime.strptime(iso_deadline, "%Y-%m-%d")
                    current_date = datetime.now()
                    university_data["admissionOpen"] = deadline_date > current_date
                    logger.info(f"Updated deadline: {iso_deadline}, Admission open: {university_data['admissionOpen']}")
                    
                # Update apply link based on program type
                if is_mphil and 'mphil' in program['url'].lower():
                    university_data["apply_link"] = program['url']
                elif is_phd and 'phd' in program['url'].lower():
                    university_data["phd_apply_link"] = program['url']
                
            except Exception as e:
                logger.error(f"Error processing program page {program['url']}: {e}")
        
        # If no programs were found from tables, add default programs based on the website content
        if not mphil_programs:
            mphil_programs = [
                "Biochemistry", "Bioinformatics", "Biotechnology", "Environmental Sciences",
                "Microbiology", "Plant Sciences", "Zoology", "Chemistry", "Computer Science",
                "Earth Sciences", "Electronics", "Mathematics", "Physics", "Statistics",
                "Anthropology", "Defense & Strategic Studies", "Economics", "History",
                "International Relations", "Pakistan Studies", "Management Sciences"
            ]
        
        if not phd_programs:
            phd_programs = [
                "Biochemistry", "Biotechnology", "Environmental Sciences", "Microbiology",
                "Plant Sciences", "Zoology", "Chemistry", "Computer Science", "Earth Sciences",
                "Electronics", "Mathematics", "Physics", "Statistics", "Economics",
                "History", "International Relations"
            ]
        
        # Format programs according to the required schema
        if mphil_programs:
            university_data["programs"]["MPhilPrograms"] = sorted(list(set(mphil_programs)))
        
        if phd_programs:
            university_data["programs"]["PhDPrograms"] = sorted(list(set(phd_programs)))
        
        # Add BSPrograms placeholder to match the expected schema
        university_data["programs"]["BSPrograms"] = [
            "BS Computer Science", 
            "BS Mathematics",
            "BS Physics",
            "BS Chemistry",
            "BS Statistics",
            "BS Economics",
            "BS Accounting & Finance"
        ]
        
        logger.info(f"QAU scraping completed. Found {len(mphil_programs)} MPhil programs and {len(phd_programs)} PhD programs")
        return university_data
        
    except Exception as e:
        logger.error(f"Error during QAU scraping: {e}")
        return None

def store_qau_in_firestore(db, data):
    """Store QAU data in Firestore."""
    if not data or not data.get("name"):
        logger.error("No valid QAU data to store in Firestore.")
        return None
    
    try:
        # Check if QAU already exists in Firestore
        qau_docs = db.collection("universities").where("name", "==", data["name"]).stream()
        qau_docs = list(qau_docs)
        
        if qau_docs:
            # Update existing document
            doc_id = qau_docs[0].id
            db.collection("universities").document(doc_id).update(data)
            logger.info(f"Updated QAU data in Firestore (ID: {doc_id})")
            return doc_id
        else:
            # Create new document
            doc_ref = db.collection("universities").document()
            doc_ref.set(data)
            logger.info(f"Stored new QAU data in Firestore (ID: {doc_ref.id})")
            return doc_ref.id
            
    except Exception as e:
        logger.error(f"Error storing QAU data in Firestore: {e}")
        return None

# Execute if run directly
if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    )
    
    # Run the scraper
    qau_data = scrape_qau_university()
    
    if qau_data:
        print("\n=== QAU Information ===")
        print(f"Name: {qau_data['name']}")
        
        print("\nBasic Information:")
        for key, value in qau_data["basic_info"].items():
            print(f"  {key}: {value}")
        
        print("\nDescription:")
        print(f"  {qau_data['description']}")
        
        print("\nOffered Programs:")
        for category, programs in qau_data["programs"].items():
            print(f"  {category}:")
            for i, program in enumerate(programs, 1):
                print(f"    {i}. {program}")
        
        print("\nAdmission:")
        print(f"  Apply Link: {qau_data['apply_link']}")
        if qau_data.get('phd_apply_link'):
            print(f"  PhD Apply Link: {qau_data['phd_apply_link']}")
    else:
        print("Failed to scrape QAU data.")