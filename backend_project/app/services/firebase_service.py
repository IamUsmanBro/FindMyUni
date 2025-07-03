# app/services/firebase_service.py
from firebase_admin import firestore
import logging
import re
import time
import random
from functools import lru_cache
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class FirebaseService:
    def __init__(self):
        self.db = firestore.client()
        self._cache = {}
        self._cache_timestamp = {}
        self._cache_expiry = 300  # Cache expiry in seconds (5 minutes)

    def _retry_with_backoff(self, operation, max_retries=3):
        """Execute operation with exponential backoff retry logic"""
        retries = 0
        while True:
            try:
                return operation()
            except Exception as e:
                retries += 1
                if "429" in str(e) or "Quota exceeded" in str(e):
                    if retries > max_retries:
                        logger.error(f"Max retries reached after quota exceeded: {str(e)}")
                        raise
                    wait_time = (2 ** retries) + random.random()
                    logger.warning(f"Quota exceeded. Retrying after {wait_time:.2f} seconds. Retry {retries}/{max_retries}")
                    time.sleep(wait_time)
                else:
                    raise

    def create_document(self, collection: str, data: dict, doc_id: str = None) -> str:
        """Create a document in the specified collection. Returns document ID."""
        def op():
            if doc_id:
                self.db.collection(collection).document(doc_id).set(data)
                return doc_id
            else:
                doc_ref = self.db.collection(collection).document()
                doc_ref.set(data)
                return doc_ref.id
                
        return self._retry_with_backoff(op)

    def get_document(self, collection: str, doc_id: str) -> dict:
        """Retrieve a document by ID."""
        # Check cache first
        cache_key = f"{collection}:{doc_id}"
        if cache_key in self._cache and (datetime.now() - self._cache_timestamp.get(cache_key, datetime.min)).total_seconds() < self._cache_expiry:
            logger.info(f"Cache hit for document {collection}/{doc_id}")
            return self._cache[cache_key]
            
        # Not in cache, fetch from Firestore
        def op():
            doc_ref = self.db.collection(collection).document(doc_id)
            doc = doc_ref.get()
            result = doc.to_dict() if doc.exists else None
            
            # Update cache
            if result:
                self._cache[cache_key] = result
                self._cache_timestamp[cache_key] = datetime.now()
                
            return result
            
        return self._retry_with_backoff(op)

    def update_document(self, collection: str, doc_id: str, data: dict):
        """Update fields of a document."""
        # Invalidate cache
        cache_key = f"{collection}:{doc_id}"
        if cache_key in self._cache:
            del self._cache[cache_key]
            
        def op():
            doc_ref = self.db.collection(collection).document(doc_id)
            doc_ref.update(data)
            
        self._retry_with_backoff(op)

    def delete_document(self, collection: str, doc_id: str):
        """Delete a document."""
        # Invalidate cache
        cache_key = f"{collection}:{doc_id}"
        if cache_key in self._cache:
            del self._cache[cache_key]
            
        def op():
            doc_ref = self.db.collection(collection).document(doc_id)
            doc_ref.delete()
            
        self._retry_with_backoff(op)

    def query_collection(self, collection: str, field: str = None, op: str = None, value=None) -> list:
        """Query all documents or by a field filter."""
        # Build cache key
        cache_key = f"{collection}:query:{field}:{op}:{value}"
        if cache_key in self._cache and (datetime.now() - self._cache_timestamp.get(cache_key, datetime.min)).total_seconds() < self._cache_expiry:
            logger.info(f"Cache hit for query {cache_key}")
            return self._cache[cache_key]
            
        def op():
            col_ref = self.db.collection(collection)
            if field and op and value is not None:
                query = col_ref.where(field, op, value)
                result = [doc.to_dict() for doc in query.stream()]
            else:
                result = [doc.to_dict() for doc in col_ref.stream()]
                
            # Update cache
            self._cache[cache_key] = result
            self._cache_timestamp[cache_key] = datetime.now()
            return result
            
        return self._retry_with_backoff(op)

    def find_document(self, collection: str, field: str, op: str, value) -> list:
        """Find documents with a field matching a value, returning dicts with 'id' included."""
        # Build cache key
        cache_key = f"{collection}:find:{field}:{op}:{value}"
        if cache_key in self._cache and (datetime.now() - self._cache_timestamp.get(cache_key, datetime.min)).total_seconds() < self._cache_expiry:
            logger.info(f"Cache hit for find {cache_key}")
            return self._cache[cache_key]
            
        def operation():
            col_ref = self.db.collection(collection)
            docs = col_ref.where(field, op, value).stream()
            result = []
            for doc in docs:
                d = doc.to_dict()
                d["id"] = doc.id
                result.append(d)
                
            # Update cache
            self._cache[cache_key] = result
            self._cache_timestamp[cache_key] = datetime.now()
            return result
            
        return self._retry_with_backoff(operation)

    def get_server_timestamp(self):
        """Return a server timestamp field value for use in documents."""
        return firestore.SERVER_TIMESTAMP

    def query_collection_with_ids(self, collection: str, field: str = None, op: str = None, value=None) -> list:
        """Query documents and include document IDs in the results."""
        # Build cache key
        cache_key = f"{collection}:query_with_ids:{field}:{op}:{value}"
        if cache_key in self._cache and (datetime.now() - self._cache_timestamp.get(cache_key, datetime.min)).total_seconds() < self._cache_expiry:
            logger.info(f"Cache hit for query_with_ids {cache_key}")
            return self._cache[cache_key]
            
        def operation():
            col_ref = self.db.collection(collection)
            if field and op and value is not None:
                query = col_ref.where(field, op, value)
                docs = query.stream()
            else:
                docs = col_ref.stream()
                
            result = []
            for doc in docs:
                d = doc.to_dict()
                d["id"] = doc.id
                result.append(d)
                
            # Update cache
            self._cache[cache_key] = result
            self._cache_timestamp[cache_key] = datetime.now()
            return result
            
        return self._retry_with_backoff(operation)

    def batch_operation(self, operations: list):
        """Perform a batch operation with multiple writes."""
        # Invalidate any potentially affected cache entries
        for op in operations:
            collection = op.get("collection")
            # Clear all cache entries for this collection
            for key in list(self._cache.keys()):
                if key.startswith(f"{collection}:"):
                    del self._cache[key]
                    
        def operation():
            batch = self.db.batch()
            
            for op in operations:
                op_type = op.get("type")
                collection = op.get("collection")
                doc_id = op.get("doc_id")
                data = op.get("data", {})
                
                if not collection or not op_type:
                    continue
                    
                if op_type == "create":
                    doc_ref = self.db.collection(collection).document(doc_id) if doc_id else self.db.collection(collection).document()
                    batch.set(doc_ref, data)
                elif op_type == "update" and doc_id:
                    doc_ref = self.db.collection(collection).document(doc_id)
                    batch.update(doc_ref, data)
                elif op_type == "delete" and doc_id:
                    doc_ref = self.db.collection(collection).document(doc_id)
                    batch.delete(doc_ref)
                    
            # Commit the batch
            return batch.commit()
            
        return self._retry_with_backoff(operation)
    
    def get_all_documents(self, collection: str) -> list:
        """
        Get all documents from a collection with their IDs
        
        Args:
            collection: Collection name
            
        Returns:
            List of documents with their IDs
        """
        # Check cache first
        cache_key = f"{collection}:all"
        if cache_key in self._cache and (datetime.now() - self._cache_timestamp.get(cache_key, datetime.min)).total_seconds() < self._cache_expiry:
            logger.info(f"Cache hit for all documents in {collection}")
            return self._cache[cache_key]
            
        try:
            def operation():
                col_ref = self.db.collection(collection)
                docs = col_ref.stream()
                
                result = []
                for doc in docs:
                    data = doc.to_dict()
                    data["id"] = doc.id
                    result.append(data)
                
                # Update cache
                self._cache[cache_key] = result
                self._cache_timestamp[cache_key] = datetime.now()
                return result
                
            return self._retry_with_backoff(operation)
        except Exception as e:
            logger.error(f"Error getting all documents from {collection}: {str(e)}")
            # Return cached data if available, even if expired
            if cache_key in self._cache:
                logger.warning(f"Returning expired cached data for {collection} after error")
                return self._cache[cache_key]
            return []
    
    def find_documents_containing(self, collection: str, field: str, value: str) -> list:
        """
        Find documents where field contains the value (case insensitive)
        This is done client-side since Firestore doesn't support regex queries
        
        Args:
            collection: Collection name
            field: Field to search in
            value: Value to search for
            
        Returns:
            List of matching documents
        """
        try:
            # Get all documents from the collection (will use cache if available)
            docs = self.get_all_documents(collection)
            
            # Filter on the client side
            results = []
            pattern = re.compile(re.escape(value), re.IGNORECASE)
            
            for doc in docs:
                if field in doc and isinstance(doc[field], str):
                    if pattern.search(doc[field]):
                        results.append(doc)
            
            return results
        except Exception as e:
            logger.error(f"Error finding documents containing '{value}' in {collection}.{field}: {str(e)}")
            return []
    
    def store_chatbot_feedback(self, message_id: str, user_id: str, is_helpful: bool, feedback_text: str = None):
        """
        Store feedback for a chatbot message
        
        Args:
            message_id: Unique ID of the message
            user_id: User ID (or "anonymous")
            is_helpful: Whether the response was helpful
            feedback_text: Optional feedback text
        """
        try:
            data = {
                "message_id": message_id,
                "user_id": user_id,
                "is_helpful": is_helpful,
                "feedback_text": feedback_text,
                "timestamp": self.get_server_timestamp()
            }
            
            self.create_document("chatbot_feedback", data)
            logger.info(f"Stored chatbot feedback for message {message_id}")
            
        except Exception as e:
            logger.error(f"Error storing chatbot feedback: {str(e)}")
    
    def store_chatbot_query(self, query: str, user_id: str, conversation_id: str = None):
        """
        Store a chatbot query for analytics
        
        Args:
            query: The user's question
            user_id: User ID (or "anonymous")
            conversation_id: Optional conversation ID
        
        Returns:
            Document ID of the stored query
        """
        try:
            data = {
                "query": query,
                "user_id": user_id,
                "conversation_id": conversation_id,
                "timestamp": self.get_server_timestamp()
            }
            
            return self.create_document("chatbot_queries", data)
            
        except Exception as e:
            logger.error(f"Error storing chatbot query: {str(e)}")
            return None

    def clear_cache(self, collection: str = None):
        """
        Clear the cache for a specific collection or all collections
        
        Args:
            collection: Collection name (or None to clear all)
        """
        if collection:
            prefix = f"{collection}:"
            for key in list(self._cache.keys()):
                if key.startswith(prefix):
                    del self._cache[key]
                    if key in self._cache_timestamp:
                        del self._cache_timestamp[key]
        else:
            self._cache.clear()
            self._cache_timestamp.clear()
            logger.info("Cleared all cache")
