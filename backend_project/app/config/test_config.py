"""
Test configuration for development without Firebase credentials.
This file is used when FIREBASE_EMULATOR=true in the .env file.
"""

import os
from unittest.mock import MagicMock

# Mock Firebase Auth
class MockFirebaseAuth:
    def verify_id_token(self, token):
        """Mock verification of tokens for testing."""
        # For testing, we'll accept any token that starts with "admin_" as an admin
        # and any other token as a regular user
        if token.startswith("admin_"):
            return {
                "uid": "mock-admin-uid",
                "email": "admin@example.com",
                "role": "admin",
                "exp": 9999999999  # Far future expiration
            }
        else:
            return {
                "uid": "mock-user-uid",
                "email": "user@example.com",
                "role": "user",
                "exp": 9999999999  # Far future expiration
            }
    
    def create_user(self, **kwargs):
        """Mock user creation."""
        return MagicMock(
            uid="mock-user-uid",
            email=kwargs.get("email"),
            display_name=kwargs.get("display_name")
        )
    
    def create_custom_token(self, uid):
        """Mock creation of custom tokens."""
        return f"mock_token_{uid}".encode('utf-8')
    
    def get_user(self, uid):
        """Mock getting user by uid."""
        return MagicMock(
            uid=uid,
            email="user@example.com",
            display_name="Test User"
        )

# Mock Firestore
class MockFirestore:
    def __init__(self):
        self.collections = {
            "universities": {},
            "users": {},
            "applications": {},
            "scrape_tasks": {}
        }
        
    def collection(self, collection_name):
        """Get a collection reference."""
        if collection_name not in self.collections:
            self.collections[collection_name] = {}
        return MockCollectionReference(self.collections[collection_name])

class MockCollectionReference:
    def __init__(self, collection_data):
        self.collection_data = collection_data
        
    def document(self, doc_id=None):
        """Get a document reference."""
        if doc_id is None:
            # Generate a random doc_id
            doc_id = f"mock-doc-{len(self.collection_data) + 1}"
        return MockDocumentReference(self.collection_data, doc_id)
    
    def where(self, field, op, value):
        """Query documents."""
        return MockQuery(self.collection_data, field, op, value)
    
    def stream(self):
        """Stream all documents."""
        return [MockDocumentSnapshot(doc_id, data) for doc_id, data in self.collection_data.items()]

class MockDocumentReference:
    def __init__(self, collection_data, doc_id):
        self.collection_data = collection_data
        self.id = doc_id
        
    def get(self):
        """Get the document."""
        return MockDocumentSnapshot(self.id, self.collection_data.get(self.id))
    
    def set(self, data):
        """Set document data."""
        self.collection_data[self.id] = data
        
    def update(self, data):
        """Update document data."""
        if self.id in self.collection_data:
            self.collection_data[self.id].update(data)
    
    def delete(self):
        """Delete the document."""
        if self.id in self.collection_data:
            del self.collection_data[self.id]

class MockDocumentSnapshot:
    def __init__(self, doc_id, data):
        self.id = doc_id
        self._data = data
        self.exists = data is not None
        
    def to_dict(self):
        """Convert to dict."""
        return self._data

class MockQuery:
    def __init__(self, collection_data, field, op, value):
        self.collection_data = collection_data
        self.field = field
        self.op = op
        self.value = value
        
    def stream(self):
        """Stream filtered documents."""
        results = []
        for doc_id, data in self.collection_data.items():
            if self.matches(data):
                results.append(MockDocumentSnapshot(doc_id, data))
        return results
    
    def matches(self, data):
        """Check if data matches the query."""
        if self.field not in data:
            return False
        
        field_value = data[self.field]
        
        if self.op == "==":
            return field_value == self.value
        elif self.op == ">":
            return field_value > self.value
        elif self.op == ">=":
            return field_value >= self.value
        elif self.op == "<":
            return field_value < self.value
        elif self.op == "<=":
            return field_value <= self.value
        else:
            return False

# Server timestamp
SERVER_TIMESTAMP = "mock-timestamp"

# Mock the Firebase app initialization
def mock_firebase_init():
    """Mock Firebase initialization for testing."""
    print("Using Firebase emulator/mock for testing")
    
    # Return a mock module
    return {
        "auth": MockFirebaseAuth(),
        "firestore": type('obj', (object,), {
            'client': lambda: MockFirestore(),
            'SERVER_TIMESTAMP': SERVER_TIMESTAMP
        })
    } 