"""
Text processing utilities for the chatbot component
"""
import re
from typing import Optional, Tuple, List, Dict


def extract_university_name(question: str) -> Optional[str]:
    """
    Extract university name from a question.
    
    Args:
        question: The user's question
    
    Returns:
        Extracted university name or None if not found
    """
    # Look directly for known university names first
    known_universities = [
        "FAST", "NUST", "LUMS", "COMSATS", "UET", "GIKI", "IBA", "PIEAS", "BZU", "KU",
        "Aga Khan", "Bahria", "SZABIST", "NUCES", "NED", "Air University"
    ]
    
    for uni in known_universities:
        if re.search(r"\b" + re.escape(uni) + r"\b", question, re.I):
            return uni
    
    # Try to find university name in the question
    uni_patterns = [
        # Pattern for: "at the ABC University"
        r"(?:at|about|for|in|of|from)\s+(?:the\s+)?([\w\s&,]+?)(?:university|college|institute|uni)\b",
        # Pattern for just: "ABC University"
        r"([\w\s&,]+?)(?:university|college|institute|uni)\b"
    ]
    
    for pattern in uni_patterns:
        if match := re.search(pattern, question, re.I):
            return match.group(1).strip()
    
    return None


def identify_question_type(question: str) -> str:
    """
    Identify the type of question being asked.
    
    Args:
        question: The user's question
    
    Returns:
        Question type: admission_status, programs, deadline, location, application, or general
    """
    question = question.lower()
    
    # Admission status questions
    if any(keyword in question for keyword in [
        "admission open", "admissions open", "can apply", "taking admissions", 
        "accepting applications", "still open", "closed", "started"
    ]):
        return "admission_status"
    
    # Programs/courses questions
    if any(keyword in question for keyword in [
        "program", "course", "degree", "major", "offer", "study", 
        "bs", "ms", "phd", "mphil", "bachelors", "masters"
    ]):
        return "programs"
    
    # Deadline questions
    if any(keyword in question for keyword in [
        "deadline", "last date", "when to apply", "till when", "closing date",
        "due date", "when is", "by when"
    ]):
        return "deadline"
    
    # Location questions
    if any(keyword in question for keyword in [
        "where is", "located", "location", "city", "address", "campus"
    ]):
        return "location"
    
    # Application process questions
    if any(keyword in question for keyword in [
        "how to apply", "application process", "apply online", "procedure",
        "admission process", "requirements"
    ]):
        return "application"
    
    # General question
    return "general"


def clean_university_name(name: str) -> str:
    """
    Clean university name by removing "Admissions Open" and other extraneous text.
    
    Args:
        name: Raw university name
    
    Returns:
        Cleaned university name
    """
    # Remove "Admissions Open" and similar phrases
    name = re.sub(r"admissions?\s+open", "", name, flags=re.I).strip()
    # Remove trailing commas, dots
    name = re.sub(r"[,.\s]+$", "", name).strip()
    return name


def clean_program_name(program: str) -> str:
    """
    Clean program name by removing numbering and extra spaces.
    
    Args:
        program: Raw program name
    
    Returns:
        Cleaned program name
    """
    # Remove numbering like "1." at the beginning
    if "." in program and program.split(".", 1)[0].strip().isdigit():
        program = program.split(".", 1)[1].strip()
    return program 