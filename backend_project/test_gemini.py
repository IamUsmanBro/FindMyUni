#!/usr/bin/env python3
"""
Test script for Gemini API integration
"""
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

def test_gemini_api():
    """Test the Gemini API with a simple query"""
    try:
        # Get API key from environment or use the provided one
        api_key = os.getenv("GEMINI_API_KEY", "AIzaSyDXsVNoJTT6wOO1OZOpcbmbrjpseCj5GgA")
        
        # Configure the Gemini API
        genai.configure(api_key=api_key)
        
        # Create a client object
        model = genai.GenerativeModel(model_name="gemini-1.5-flash")
        
        # Send a test query
        response = model.generate_content("Explain how AI works in a few words")
        
        # Print the response
        print("Gemini API Test Results:")
        print("-" * 50)
        print(f"Response: {response.text}")
        print("-" * 50)
        print("Test completed successfully!")
        
        return True
    except Exception as e:
        print(f"Error testing Gemini API: {str(e)}")
        return False

if __name__ == "__main__":
    print("Testing Gemini API integration...")
    test_gemini_api() 