import { api } from './api.service';

// Add Gemini API key and configuration - hardcoded for direct access
const GEMINI_API_KEY = "AIzaSyDXsVNoJTT6wOO1OZOpcbmbrjpseCj5GgA"; // Hardcoded API key
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Log that we're using the hardcoded key
console.log("Using hardcoded Gemini API key");

// Initialize local knowledge base for RAG
const LOCAL_KNOWLEDGE_BASE = [
  {
    title: "NUST Information",
    content: `NUST (National University of Sciences and Technology) is a premier institution located in Islamabad.
Programs: Engineering (Electrical, Mechanical, Civil, Computer), Computer Science, Business Studies, Natural Sciences
Admission process: NET (NUST Entrance Test) is required
Fall admissions usually open in June-July
Spring admissions usually open in December-January
Website: https://nust.edu.pk/
Campuses: Main campus in Islamabad, with additional campuses in Rawalpindi and Karachi
Scholarships available: Merit-based, Need-based, Sports, and others
Housing: On-campus hostels available for both male and female students`
  },
  {
    title: "LUMS Information",
    content: `LUMS (Lahore University of Management Sciences) is a leading private university in Lahore.
Programs: Business Administration, Computer Science, Engineering, Economics, Social Sciences
Admission process: LUMS SSE test for Science programs, LCAT for Business and Social Sciences
Fall admissions usually open in November-December
Financial aid: Need-blind admissions with comprehensive financial aid packages
Website: https://lums.edu.pk/
Housing: On-campus housing available with multiple options
Notable features: Liberal arts education model, strong entrepreneurship focus
Research centers: Centre for Water Informatics & Technology, Technology for People Initiative`
  },
  {
    title: "IBA Information",
    content: `IBA (Institute of Business Administration) is one of the oldest business schools in Pakistan, located in Karachi.
Programs: BBA, MBA, EMBA, BS Computer Science, BS Economics, BS Social Sciences
Admission process: Aptitude test and interviews
Fall admissions usually open in March-April
Spring admissions usually open in October-November
Website: https://www.iba.edu.pk/
Campuses: Main Campus and City Campus, both in Karachi
Financial assistance: Merit scholarships and need-based financial aid available
Recognized for: Strong industry connections, high graduate employability`
  },
  {
    title: "Pakistan University Admission Cycles",
    content: `Most Pakistani universities follow two main admission cycles:
Fall/Autumn Semester:
- Applications usually open: June-July
- Classes start: September-October
- This is the main intake with most programs available
Spring Semester:
- Applications usually open: November-December
- Classes start: January-February
- Limited programs may be available`
  },
  {
    title: "ScrapeMyUni Features",
    content: `ScrapeMyUni helps Pakistani students with university applications through these key features:
University Comparison: Side-by-side comparison of universities, filter by location, programs, and fees
Deadline Tracking: Calendar view of upcoming deadlines, email/notification reminders
Program Search: Find programs by discipline, duration, and university
Application Management: Track application status, document checklist and storage
Scholarship Information: Filter scholarships by eligibility, view application requirements`
  }
];

// Create a simple search index for the knowledge base
const createSearchIndex = () => {
  const index = {};
  
  // Process each document
  LOCAL_KNOWLEDGE_BASE.forEach((doc, docIndex) => {
    // Combine title and content
    const text = `${doc.title} ${doc.content}`.toLowerCase();
    
    // Simple tokenization - split by non-alphanumeric characters
    const tokens = text.split(/\W+/).filter(token => token.length > 2);
    
    // Add to inverted index
    tokens.forEach(token => {
      if (!index[token]) {
        index[token] = new Set();
      }
      index[token].add(docIndex);
    });
  });
  
  return index;
};

// Initialize the search index
const SEARCH_INDEX = createSearchIndex();

// Search function to find relevant documents
const searchKnowledgeBase = (query) => {
  // Tokenize query
  const queryTokens = query.toLowerCase().split(/\W+/).filter(token => token.length > 2);
  
  // Count document matches
  const docMatches = new Map();
  
  queryTokens.forEach(token => {
    if (SEARCH_INDEX[token]) {
      SEARCH_INDEX[token].forEach(docIndex => {
        docMatches.set(docIndex, (docMatches.get(docIndex) || 0) + 1);
      });
    }
  });
  
  // Sort by match count and get top 3
  const topMatches = Array.from(docMatches.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([docIndex]) => LOCAL_KNOWLEDGE_BASE[docIndex]);
  
  return topMatches;
};

class ChatbotService {
  /**
   * Send a message to the chatbot API
   * @param {string} message - The user's message to the chatbot
   * @param {string} conversationId - Optional conversation ID for tracking context
   * @param {boolean} useWebSearch - Whether to use web search for enhanced answers
   * @returns {Promise<Object>} - Response containing the chatbot's reply
   */
  async sendMessage(text, conversationId = null, useWebSearch = false) {
    try {
      // Log locally for analytics
      this._logUserQuery(text);
      
      // Special handling for known patterns to avoid unnecessary API calls
      const lowerText = text.toLowerCase().trim();
      
      // Direct handling for basic identity questions with zero API calls
      if (lowerText.includes("who are you") || 
          lowerText.includes("who r u") || 
          lowerText.includes("what are you") || 
          lowerText.includes("what r u") || 
          lowerText.includes("are you") || 
          lowerText === "who" || 
          lowerText === "what" || 
          lowerText.includes("your name") || 
          lowerText.includes("call you") ||
          (lowerText.includes("unibuddy") && lowerText.includes("?")) ||
          (lowerText.includes("name") && lowerText.includes("?"))
         ) {
        const quickResponse = {
          message_id: Math.random().toString(36).substring(2, 15),
          conversation_id: conversationId,
          answer: "I'm UniBuddy◕‿◕, an AI assistant that provides information about universities in Pakistan. I'm designed to help with questions about admissions, programs, deadlines, and other university-related inquiries.",
          source: "identity",
          confidence: "high",
          timestamp: new Date().toISOString(),
          web_search_used: false
        };
        
        // Log response
        this._logChatbotResponse(quickResponse.answer);
        return quickResponse;
      }
      
      // Direct handling for basic greetings
      if (['hello', 'hi', 'hey', 'greetings'].includes(lowerText)) {
        const quickResponse = {
          message_id: Math.random().toString(36).substring(2, 15),
          conversation_id: conversationId,
          answer: "Hi there! I'm UniBuddy◕‿◕, your university assistant. How can I help you today?",
          source: "identity",
          confidence: "high",
          timestamp: new Date().toISOString(),
          web_search_used: false
        };
        
        // Log response
        this._logChatbotResponse(quickResponse.answer);
        return quickResponse;
      }
      
      // Special test command to check if Gemini is working
      if (lowerText === "test gemini" || lowerText === "gemini test") {
        if (!GEMINI_API_KEY) {
          return {
            message_id: Math.random().toString(36).substring(2, 15),
            conversation_id: conversationId,
            answer: "Gemini API key is not configured. Please add your API key to the .env file as VITE_GEMINI_API_KEY.",
            source: "system_message",
            confidence: "high",
            timestamp: new Date().toISOString(),
            web_search_used: false
          };
        }
        
        try {
          const testResult = await this._callGeminiDirectly("Tell me briefly about Gemini AI", conversationId, true);
          return {
            message_id: Math.random().toString(36).substring(2, 15),
            conversation_id: conversationId,
            answer: "✅ Gemini API test successful! Here's a sample response: \n\n" + testResult.answer,
            source: "system_message",
            confidence: "high",
            timestamp: new Date().toISOString(),
            web_search_used: false
          };
        } catch (err) {
          return {
            message_id: Math.random().toString(36).substring(2, 15),
            conversation_id: conversationId,
            answer: "❌ Gemini API test failed: " + err.message + "\n\nPlease check your API key and network connection.",
            source: "system_message",
            confidence: "high",
            timestamp: new Date().toISOString(),
            web_search_used: false
          };
        }
      }
      
      // DUAL APPROACH: Web search ON = Direct Gemini API, Web search OFF = RAG system
      try {
        if (useWebSearch) {
          // When web search is ON, use direct Gemini API call for comprehensive info
          console.log("Web search ON: Using direct Gemini API call");
          const geminiResponse = await this._callGeminiDirectly(text, conversationId, true);
          
          // Log response
          this._logChatbotResponse(geminiResponse.answer);
          
          return geminiResponse;
        } else {
          // When web search is OFF, use our RAG system with local knowledge base
          console.log("Web search OFF: Using local RAG system");
          try {
            const ragResponse = await this._generateRAGResponse(text, conversationId);
            
            // Log response
            this._logChatbotResponse(ragResponse.answer);
            
            return ragResponse;
          } catch (ragError) {
            console.warn("RAG system error, falling back to direct Gemini:", ragError.message);
            
            // If RAG fails, fall back to direct Gemini but with educational focus
            const geminiResponse = await this._callGeminiDirectly(
              `${text} (Focus on Pakistani educational system if relevant)`, 
              conversationId,
              false
            );
            
            // Log response
            this._logChatbotResponse(geminiResponse.answer);
            
            return geminiResponse;
          }
        }
      } catch (error) {
        console.error("Error in both RAG and direct Gemini approaches:", error);
        
        // All main approaches failed, fall back to local generation
        console.log('Falling back to local response generation');
        const fallbackResponse = await this._generateLocalResponse(text, conversationId);
        
        // Log response
        this._logChatbotResponse(fallbackResponse.answer);
        
        return fallbackResponse;
      }
    } catch (error) {
      console.error('Error in main sendMessage flow:', error);
      
      // Generate a simple fallback response
      const errorMessage = {
        message_id: Math.random().toString(36).substring(2, 15),
        conversation_id: conversationId,
        answer: "I apologize, but I'm experiencing some technical difficulties. You can try:\n\n1. Rephrasing your question\n2. Trying again in a moment\n3. Toggling the Web Search option",
        source: "error_fallback",
        confidence: "low",
        timestamp: new Date().toISOString(),
        web_search_used: false
      };
      
      return errorMessage;
    }
  }

  /**
   * Generate a response using RAG (Retrieval Augmented Generation)
   * @private
   * @param {string} text - User's query
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} - Response from RAG system
   */
  async _generateRAGResponse(text, conversationId) {
    try {
      // Search for relevant documents
      const relevantDocs = searchKnowledgeBase(text);
      
      // If no relevant documents found, throw error to fall back to direct query
      if (relevantDocs.length === 0) {
        throw new Error("No relevant information found in knowledge base");
      }
      
      console.log("Relevant documents found:", relevantDocs.map(d => d.title));
      
      // Check if we have a direct hit in the knowledge base
      // If the question is extremely simple and directly answered in KB, generate answer locally
      if (relevantDocs.length > 0) {
        const directAnswer = this._tryDirectAnswer(text, relevantDocs);
        if (directAnswer) {
          console.log("Generated direct answer from knowledge base");
          return {
            message_id: Math.random().toString(36).substring(2, 15),
            conversation_id: conversationId,
            answer: directAnswer,
            source: "rag_system",
            confidence: "high",
            timestamp: new Date().toISOString(),
            web_search_used: false
          };
        }
      }
      
      // Build context from relevant documents
      const context = relevantDocs.map(doc => {
        return `--- ${doc.title} ---\n${doc.content}`;
      }).join("\n\n");
      
      // Create RAG prompt
      const ragPrompt = `You are UniBuddy◕‿◕, a friendly assistant for ScrapeMyUni that helps students with university information in Pakistan.

CONTEXT INFORMATION:
${context}

USER QUERY:
${text}

Instructions:
1. Use ONLY the information provided in the CONTEXT above to answer the query.
2. If the exact answer isn't in the context, acknowledge that and provide the most relevant information you do have.
3. Be concise and factual in your response.
4. Format your answer clearly using markdown for better readability.
5. Don't mention that you're using a RAG system or reference this prompt.
6. Add a small note at the end of your response indicating which university or topic from the knowledge base you used (e.g., "*Based on NUST information*").`;

      // Call Gemini with the RAG prompt
      const requestBody = {
        contents: [
          {
            parts: [{ text: ragPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2, // Lower temperature for more factual RAG responses
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      };
      
      // Make the API call
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify(requestBody),
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`Gemini API error (${response.status}): ${await response.text()}`);
      }
      
      const data = await response.json();
      console.log("RAG response received:", data);
      
      // Extract answer text
      if (data && 
          data.candidates && 
          data.candidates[0] && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts[0]) {
        const answer = data.candidates[0].content.parts[0].text;
        
        return {
          message_id: Math.random().toString(36).substring(2, 15),
          conversation_id: conversationId,
          answer: answer,
          source: "rag_system",
          confidence: "high",
          timestamp: new Date().toISOString(),
          web_search_used: false
        };
      } else {
        throw new Error("Unexpected response format from Gemini API");
      }
    } catch (error) {
      console.error("Error in RAG response generation:", error);
      throw error;
    }
  }
  
  /**
   * Try to generate a direct answer from knowledge base without using Gemini
   * @private
   * @param {string} query - User query
   * @param {Array} relevantDocs - Relevant documents from knowledge base
   * @returns {string|null} - Direct answer or null if can't be answered directly
   */
  _tryDirectAnswer(query, relevantDocs) {
    const lowerQuery = query.toLowerCase();
    
    // Simple pattern matching for common questions
    if (relevantDocs.length === 0) return null;
    
    // Check for specific question patterns
    const firstDoc = relevantDocs[0];
    
    // Questions about university information (e.g., "Tell me about NUST")
    if ((lowerQuery.includes("tell me about") || lowerQuery.includes("information about") || 
         lowerQuery.includes("what is") || lowerQuery.includes("who is")) && 
        firstDoc.title.toLowerCase().includes("information")) {
      
      const uniName = firstDoc.title.split(" ")[0];
      if (lowerQuery.includes(uniName.toLowerCase())) {
        return `## ${firstDoc.title.replace(" Information", "")}\n\n${firstDoc.content}\n\n*Information from ScrapeMyUni's knowledge base*`;
      }
    }
    
    // Questions about admission cycles
    if (lowerQuery.includes("admission cycle") || 
        lowerQuery.includes("semester") || 
        lowerQuery.includes("academic terms") || 
        lowerQuery.includes("when do admissions open")) {
      
      const cycleDoc = relevantDocs.find(d => d.title.toLowerCase().includes("admission cycle"));
      if (cycleDoc) {
        return `## University Admission Cycles in Pakistan\n\n${cycleDoc.content}\n\n*Information from ScrapeMyUni's knowledge base*`;
      }
    }
    
    // Questions about ScrapeMyUni features
    if (lowerQuery.includes("scrapmyuni") || 
        lowerQuery.includes("feature") || 
        lowerQuery.includes("what can you do") || 
        lowerQuery.includes("how do you help")) {
      
      const featureDoc = relevantDocs.find(d => d.title.toLowerCase().includes("feature"));
      if (featureDoc) {
        return `## ScrapeMyUni Features\n\n${featureDoc.content}\n\n*Information from ScrapeMyUni's knowledge base*`;
      }
    }
    
    // Questions about programs at specific universities
    if (lowerQuery.includes("program") || lowerQuery.includes("course") || lowerQuery.includes("degree")) {
      for (const doc of relevantDocs) {
        if (doc.title.includes("Information") && doc.content.includes("Programs:")) {
          const uniName = doc.title.split(" ")[0];
          if (lowerQuery.includes(uniName.toLowerCase())) {
            // Extract just the programs part from the content
            const programsLine = doc.content.split('\n').find(line => line.trim().startsWith('Programs:'));
            if (programsLine) {
              return `## Programs at ${uniName}\n\n${programsLine}\n\n*Information from ScrapeMyUni's knowledge base*`;
            }
          }
        }
      }
    }
    
    // Not a direct match, will use RAG with Gemini
    return null;
  }

  /**
   * Generate a simple fallback response
   * @private
   * @param {string} conversationId - Conversation ID
   * @returns {Object} - Fallback response
   */
  _generateSimpleFallback(conversationId) {
    return {
      message_id: Math.random().toString(36).substring(2, 15),
      conversation_id: conversationId,
      answer: "I apologize, but I'm having trouble processing your request. You can try: \n\n1. Rephrasing your question\n2. Asking about a specific university\n3. Turning on web search for more comprehensive results",
      source: "error_fallback",
      confidence: "low",
      timestamp: new Date().toISOString(),
      web_search_used: false
    };
  }

  /**
   * Get the chat history for the current user
   * @returns {Promise<Array>} - Array of chat messages
   */
  async getChatHistory() {
    try {
      const response = await api.get('/chatbot/history');
      
      if (!response.data || !response.data.history) {
        throw new Error('Invalid response from server');
      }
      
      return response.data.history;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Please login to view chat history');
      }
      
      throw new Error(error.response?.data?.detail || 'Failed to fetch chat history. Please try again later.');
    }
  }

  /**
   * Clear the chat history for the current user
   * @returns {Promise<Object>} - Response indicating success
   */
  async clearChatHistory() {
    try {
      const response = await api.delete('/chatbot/history');
      return response.data;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Please login to clear chat history');
      }
      
      throw new Error(error.response?.data?.detail || 'Failed to clear chat history. Please try again later.');
    }
  }
  
  /**
   * Get chatbot suggestions based on user's context
   * @param {string} context - The context (e.g., university page, application page)
   * @returns {Promise<Array>} - Array of suggested questions
   */
  async getSuggestions(context) {
    try {
      const response = await api.get('/chatbot/suggestions', { params: { context } });
      
      if (!response.data || !response.data.suggestions) {
        return this._getDefaultSuggestions(context);
      }
      
      return response.data.suggestions;
    } catch (error) {
      console.error('Error getting chatbot suggestions:', error);
      return this._getDefaultSuggestions(context);
    }
  }
  
  /**
   * Get feedback on a specific conversation message
   * @param {string} messageId - The ID of the message to give feedback on
   * @param {boolean} helpful - Whether the message was helpful
   * @param {string} feedback - Optional feedback text
   * @returns {Promise<Object>} - Response indicating success
   */
  async provideFeedback(messageId, helpful, feedback = '') {
    try {
      const response = await api.post('/chatbot/feedback', {
        message_id: messageId,
        is_helpful: helpful,
        feedback_text: feedback
      });
      
      return response.data;
    } catch (error) {
      console.error('Error providing chatbot feedback:', error);
      throw new Error('Failed to submit feedback. Please try again later.');
    }
  }
  
  /**
   * Download chat history as a text file
   */
  async downloadChatHistory() {
    try {
      const history = await this.getChatHistory();
      
      if (!history || history.length === 0) {
        throw new Error('No chat history to download');
      }
      
      // Format chat history as text
      let text = '# ScrapeMyUni Chat History\n\n';
      history.forEach(message => {
        const sender = message.userId ? 'You' : 'Chatbot';
        const timestamp = new Date(message.timestamp).toLocaleString();
        text += `## ${sender} (${timestamp})\n\n${message.userId ? message.message : message.response}\n\n`;
      });
      
      // Create and download file
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-history-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading chat history:', error);
      throw new Error('Failed to download chat history: ' + error.message);
    }
  }
  
  // Private methods
  
  /**
   * Log user query locally for analytics
   * @private
   * @param {string} message - The user's message
   */
  _logUserQuery(message) {
    if (!message) return;
    
    try {
      // Get existing logs
      const logs = JSON.parse(localStorage.getItem('chatbot_query_logs') || '[]');
      
      // Add new log
      logs.push({
        timestamp: new Date().toISOString(),
        message: message
      });
      
      // Keep only last 50 logs
      if (logs.length > 50) {
        logs.shift();
      }
      
      // Save logs
      localStorage.setItem('chatbot_query_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Error logging user query:', error);
    }
  }
  
  /**
   * Log chatbot response locally for analytics
   * @private
   * @param {string} response - The chatbot's response
   */
  _logChatbotResponse(response) {
    if (!response) return;
    
    try {
      // Get existing logs
      const logs = JSON.parse(localStorage.getItem('chatbot_response_logs') || '[]');
      
      // Add new log
      logs.push({
        timestamp: new Date().toISOString(),
        response: response
      });
      
      // Keep only last 50 logs
      if (logs.length > 50) {
        logs.shift();
      }
      
      // Save logs
      localStorage.setItem('chatbot_response_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Error logging chatbot response:', error);
    }
  }
  
  /**
   * Get default suggestions based on context
   * @private
   * @param {string} context - The context for suggestions
   * @returns {Array} - Array of suggested questions
   */
  _getDefaultSuggestions(context) {
    const defaultSuggestions = {
      'home': [
        'What universities in Pakistan offer Computer Science?',
        'When are admission deadlines for top universities?',
        'What scholarships are available for engineering students?',
        'How does the application process work?'
      ],
      'university': [
        'What are the admission requirements?',
        'When is the application deadline?',
        'What scholarships are offered?',
        'Is hostel accommodation available?'
      ],
      'application': [
        'What documents do I need for my application?',
        'How can I check my application status?',
        'Can I apply for multiple programs?',
        'What happens after I submit my application?'
      ],
      'profile': [
        'How can I update my profile information?',
        'How is my data used?',
        'Can I link my profile to universities?',
        'How to set notification preferences?'
      ],
      'default': [
        'Tell me about university admissions in Pakistan',
        'What services does ScrapeMyUni offer?',
        'How can I compare different universities?',
        'How accurate is the information on this website?'
      ]
    };
    
    return defaultSuggestions[context] || defaultSuggestions.default;
  }

  /**
   * Generate a local response when API fails
   * @private
   * @param {string} message - The user's message
   * @param {string} conversationId - Conversation ID
   * @returns {Object} - An object similar to what the API would return
   */
  _generateLocalResponse(message, conversationId) {
    console.log('Generating local fallback response for:', message);
    
    return new Promise(async (resolve, reject) => {
      try {
        // Try using direct Gemini API first if we have a key
        if (GEMINI_API_KEY) {
          try {
            console.log('Attempting direct Gemini API call from fallback');
            const geminiResponse = await this._callGeminiDirectly(message, conversationId, false);
            if (geminiResponse) {
              console.log('Direct Gemini API call successful from fallback');
              return resolve(geminiResponse);
            }
          } catch (geminiError) {
            console.warn('Direct Gemini API call failed from fallback:', geminiError.message);
          }
        }
        
        // Then try a direct fetch to the backend 
        try {
          console.log('Attempting direct API call as fallback');
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/chatbot/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({
              text: message,
              conversation_id: conversationId,
              use_web_search: false
            }),
            signal: AbortSignal.timeout(15000) // 15 second timeout
          });
          
          if (response.ok) {
            const apiResponse = await response.json();
            console.log('Direct API call successful as fallback');
            return resolve(apiResponse);
          }
        } catch (directError) {
          console.warn('Direct API fallback failed:', directError.message);
        }
      
        // Generate a message ID
        const messageId = Math.random().toString(36).substring(2, 15);
        
        // Store the conversation context for more relevant responses
        this._storeConversationContext(conversationId, message);
        
        // Get previous messages to maintain context
        const context = this._getConversationContext(conversationId) || [];
        
        // Process the message to get a relevant response
        const answer = this._processMessageForResponse(message, context);
        
        // Return an object similar to the API response
        resolve({
          message_id: messageId,
          conversation_id: conversationId,
          answer: answer,
          source: 'local_fallback',
          timestamp: new Date().toISOString(),
          confidence: 0.7 // Medium confidence for local generation
        });
      } catch (error) {
        console.error('Error in fallback response generation:', error);
        // Ultimate fallback
        resolve({
          message_id: Math.random().toString(36).substring(2, 15),
          conversation_id: conversationId,
          answer: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
          source: 'error_fallback',
          timestamp: new Date().toISOString(),
          confidence: 0.3
        });
      }
    });
  }

  /**
   * Store conversation context for better responses
   * @private
   * @param {string} conversationId - Conversation ID
   * @param {string} message - User message to store
   */
  _storeConversationContext(conversationId, message) {
    if (!conversationId) return;
    
    try {
      // Get existing conversation
      const contextKey = `conversation_context_${conversationId}`;
      const context = JSON.parse(localStorage.getItem(contextKey) || '[]');
      
      // Add new message
      context.push({
        timestamp: new Date().toISOString(),
        message: message
      });
      
      // Keep only last 10 messages
      if (context.length > 10) {
        context.shift();
      }
      
      // Save context
      localStorage.setItem(contextKey, JSON.stringify(context));
    } catch (error) {
      console.error('Error storing conversation context:', error);
    }
  }

  /**
   * Get conversation context for a given ID
   * @private
   * @param {string} conversationId - Conversation ID
   * @returns {Array} - Array of previous messages
   */
  _getConversationContext(conversationId) {
    if (!conversationId) return [];
    
    try {
      const contextKey = `conversation_context_${conversationId}`;
      return JSON.parse(localStorage.getItem(contextKey) || '[]');
    } catch (error) {
      console.error('Error getting conversation context:', error);
      return [];
    }
  }

  /**
   * Process a message to generate a relevant response
   * @private
   * @param {string} message - The user's message
   * @param {Array} context - Previous conversation context
   * @returns {string} - Generated response
   */
  _processMessageForResponse(message, context) {
    // Convert message to lowercase for easier matching
    const lowerMessage = message.toLowerCase();
    
    // University database fallback (limited but helpful)
    const universities = {
      'nust': {
        name: 'National University of Sciences and Technology (NUST)',
        location: 'Islamabad',
        programs: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'],
        admissionStatus: 'currently open for Fall 2023',
        deadline: 'July 15, a2023',
        fees: 'between PKR 180,000 to PKR 250,000 per semester depending on the program'
      },
      'lums': {
        name: 'Lahore University of Management Sciences (LUMS)',
        location: 'Lahore',
        programs: ['Computer Science', 'Business Administration', 'Economics', 'Social Sciences'],
        admissionStatus: 'currently open for Fall 2023',
        deadline: 'April 30, 2023',
        fees: 'approximately PKR 350,000 per semester'
      },
      'fast': {
        name: 'FAST National University',
        location: 'Multiple campuses in Lahore, Islamabad, Karachi',
        programs: ['Computer Science', 'Software Engineering', 'Data Science', 'Artificial Intelligence'],
        admissionStatus: 'opening soon for Fall 2023',
        deadline: 'June 30, 2023',
        fees: 'between PKR 120,000 to PKR 180,000 per semester'
      },
      'iba': {
        name: 'Institute of Business Administration (IBA)',
        location: 'Karachi',
        programs: ['Business Administration', 'Computer Science', 'Economics', 'Accounting & Finance'],
        admissionStatus: 'currently open for Fall 2023',
        deadline: 'May 15, 2023',
        fees: 'approximately PKR 250,000 per semester'
      },
      'giki': {
        name: 'Ghulam Ishaq Khan Institute (GIKI)',
        location: 'Topi, Swabi',
        programs: ['Electrical Engineering', 'Computer Engineering', 'Mechanical Engineering'],
        admissionStatus: 'currently open for Fall 2023',
        deadline: 'June 10, 2023',
        fees: 'approximately PKR 300,000 per semester'
      },
      'comsats': {
        name: 'COMSATS University',
        location: 'Multiple campuses across Pakistan',
        programs: ['Computer Science', 'Engineering', 'Business Administration'],
        admissionStatus: 'currently open for Fall 2023',
        deadline: 'July 30, 2023',
        fees: 'between PKR 100,000 to PKR 150,000 per semester'
      }
    };

    // Check for university-specific queries
    for (const [uniKey, uniData] of Object.entries(universities)) {
      if (lowerMessage.includes(uniKey)) {
        if (lowerMessage.includes('admission') || lowerMessage.includes('apply')) {
          return `Admissions at ${uniData.name} are ${uniData.admissionStatus}. The application deadline is ${uniData.deadline}. You can apply through their official website.`;
        }
        
        if (lowerMessage.includes('deadline')) {
          return `The application deadline for ${uniData.name} is ${uniData.deadline}.`;
        }
        
        if (lowerMessage.includes('program') || lowerMessage.includes('course') || lowerMessage.includes('degree')) {
          return `${uniData.name} offers various programs including ${uniData.programs.join(', ')}. Please check their official website for the complete list and specific requirements.`;
        }
        
        if (lowerMessage.includes('fee') || lowerMessage.includes('cost') || lowerMessage.includes('tuition')) {
          return `The tuition fee at ${uniData.name} is ${uniData.fees}. Additional expenses may include hostel fees, books, and other charges.`;
        }
        
        if (lowerMessage.includes('location') || lowerMessage.includes('where')) {
          return `${uniData.name} is located in ${uniData.location}.`;
        }
        
        // General information about this university
        return `${uniData.name} is located in ${uniData.location} and offers programs including ${uniData.programs.join(', ')}. Admissions are ${uniData.admissionStatus} with a deadline of ${uniData.deadline}. The tuition fee is approximately ${uniData.fees}.`;
      }
    }
    
    // General university-related questions
    if (lowerMessage.includes('best university') || lowerMessage.includes('top university')) {
      return "The top universities in Pakistan include NUST, LUMS, GIKI, FAST, IBA, and UET Lahore. The 'best' university depends on your specific field of interest, budget, and location preferences.";
    }
    
    if (lowerMessage.includes('scholarship')) {
      return "Many universities in Pakistan offer scholarships based on merit, need, or both. Top institutions like LUMS have financial aid programs covering up to 100% of tuition. Government scholarships like HEC and provincial endowment funds are also available. It's best to check each university's financial aid office for specific opportunities.";
    }
    
    if (lowerMessage.includes('admission') || lowerMessage.includes('apply')) {
      return "Most universities in Pakistan have online application processes. Generally, you'll need to complete an application form, submit academic transcripts, and pay an application fee. Many universities require entrance tests (like NET, GAT, or university-specific tests). Application cycles typically open in January-February for Fall admissions and June-July for Spring admissions.";
    }
    
    if (lowerMessage.includes('deadline')) {
      return "University application deadlines in Pakistan vary by institution. Generally, Fall admission deadlines range from March to July, while Spring admission deadlines are around October to December. It's always best to check the specific university's admissions page for exact dates.";
    }
    
    if (lowerMessage.includes('requirement')) {
      return "University admission requirements typically include a minimum of 60-70% marks in intermediate or A-levels, entrance test scores (like NET, GAT, or university-specific tests), and sometimes interviews. Some programs may have additional requirements like portfolios for design courses or specific subject prerequisites.";
    }
    
    if (lowerMessage.includes('fee') || lowerMessage.includes('cost') || lowerMessage.includes('tuition')) {
      return "University fees in Pakistan vary widely. Public universities like Punjab University may charge as low as PKR 30,000-40,000 per semester, while private universities like LUMS can charge PKR 350,000 or more per semester. Engineering and medical programs generally have higher fees than arts or humanities.";
    }
    
    if (lowerMessage.includes('hostel') || lowerMessage.includes('accommodation')) {
      return "Most major universities in Pakistan offer on-campus hostel accommodation. Hostels typically cost between PKR 15,000-40,000 per semester depending on the university and type of room (shared or private). Hostels usually provide basic amenities like beds, desks, mess facilities, and internet. Application for hostel accommodation should be made along with your university application.";
    }
    
    if (lowerMessage.includes('program') || lowerMessage.includes('course') || lowerMessage.includes('degree')) {
      return "Pakistani universities offer a wide range of undergraduate and graduate programs. Popular undergraduate programs include Business Administration, Computer Science, Engineering, Medicine, and Social Sciences. Most bachelor's programs are 4 years, while medicine (MBBS) is 5 years. Master's programs typically range from 1.5 to 2 years.";
    }
    
    // Default fallback response
    return "I understand you're asking about universities in Pakistan. While I don't have complete information at the moment due to connection issues, I can help with general questions about admissions, programs, scholarships, and fees. Could you please specify which university or aspect of higher education you're interested in?";
  }

  /**
   * Poll for an updated response in a conversation
   * @private
   * @param {string} conversationId - Conversation ID
   * @param {string} messageId - Message ID to look for updates
   * @param {number} attempts - Number of polling attempts
   * @returns {Promise<Object>} - Updated response or null
   */
  async _pollForUpdatedResponse(conversationId, messageId, attempts = 5) {
    for (let i = 0; i < attempts; i++) {
      try {
        // Get conversation history
        const response = await api.get(`/chatbot/conversations/${conversationId}`);
        
        if (response.data && Array.isArray(response.data.messages)) {
          // Find the message with the given ID
          const message = response.data.messages.find(msg => 
            msg.message_id === messageId && msg.role === "assistant"
          );
          
          if (message && message.content !== "I'm processing your request. This may take a moment...") {
            // Message has been updated
            return {
              message_id: messageId,
              conversation_id: conversationId,
              answer: message.content,
              source: "polled_response",
              confidence: "high",
              timestamp: message.timestamp,
              web_search_used: false
            };
          }
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error polling for response (attempt ${i+1}/${attempts}):`, error);
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Return null if we couldn't get an updated response
    return null;
  }

  /**
   * Call the Gemini API directly without going through backend
   * @private
   * @param {string} text - User's message
   * @param {string} conversationId - Conversation ID
   * @param {boolean} useWebSearch - Whether web search is enabled
   * @returns {Promise<Object>} - Formatted response
   */
  async _callGeminiDirectly(text, conversationId, useWebSearch = false) {
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured");
    }
    
    // Create the request body once outside the retry loop
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `You are a specialized assistant for ScrapeMyUni, a platform that helps Pakistani students find and apply to universities. 

SYSTEM CONTEXT:
- You specialize in Pakistani universities, admissions, programs, and education
- ScrapeMyUni helps students compare universities, track application deadlines, and find scholarship opportunities
- Focus on accurate, concise information about Pakistani education system
- When you don't know an answer, acknowledge it rather than making up information

KEY FEATURES OF THE PLATFORM:
- University comparison
- Admission deadline tracking
- Program search
- Application management
- Scholarship information

PAKISTANI UNIVERSITIES TO KNOW:
- NUST (National University of Sciences and Technology) - Islamabad
- LUMS (Lahore University of Management Sciences) - Lahore
- IBA (Institute of Business Administration) - Karachi
- FAST (National University of Computer & Emerging Sciences) - Multiple campuses
- COMSATS - Multiple campuses
- UET (University of Engineering and Technology) - Lahore/Peshawar
- GIKI (Ghulam Ishaq Khan Institute) - Swabi
- QAU (Quaid-i-Azam University) - Islamabad
- Punjab University - Lahore

COMMON PROGRAMS:
- Engineering (Electrical, Mechanical, Civil, Software)
- Computer Science
- Business Administration
- Medicine (MBBS) and related health sciences
- Social Sciences

TYPICAL ACADEMIC TERMS:
- Fall Admissions: Usually July-September for classes starting in September/October
- Spring Admissions: Usually November-January for classes starting in January/February
- Most universities follow semester systems

Please answer the following question as helpfully as possible: ${text}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.5, // Lower temperature for more factual responses
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };
    
    // Setup retry logic with exponential backoff
    let attempts = 0;
    const maxAttempts = 3;
    const baseDelay = 1000; // Start with 1 second delay
    let lastError = null;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`Sending request to Gemini API (attempt ${attempts + 1}/${maxAttempts})...`);
        
        // Make the API call with correct CORS settings
        const response = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin
          },
          body: JSON.stringify(requestBody),
          mode: 'cors' // Explicitly set CORS mode
        });
        
        if (!response.ok) {
          console.error("Gemini API error status:", response.status, response.statusText);
          let errorText = "";
          try {
            const errorData = await response.json();
            console.error("Error details:", errorData);
            errorText = JSON.stringify(errorData);
          } catch (e) {
            errorText = await response.text();
          }
          
          const errorMessage = `Gemini API error (${response.status}): ${errorText || response.statusText}`;
          
          // Check if this is a retriable error (like 503 service unavailable)
          if ((response.status === 503 || response.status === 429) && attempts < maxAttempts - 1) {
            lastError = new Error(errorMessage);
            attempts++;
            
            // Calculate exponential backoff delay with jitter
            const jitter = Math.random() * 0.3 + 0.85; // Random value between 0.85 and 1.15
            const delay = baseDelay * Math.pow(2, attempts - 1) * jitter;
            
            console.log(`Retrying in ${Math.round(delay)}ms...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log("Gemini API response received:", data);
        
        // Extract the response text
        let answer = "";
        if (data && 
            data.candidates && 
            data.candidates[0] && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts[0]) {
          answer = data.candidates[0].content.parts[0].text;
        } else {
          console.error("Unexpected Gemini API response format:", data);
          throw new Error("Unexpected Gemini API response format");
        }
        
        // Format the response to match our expected format
        return {
          message_id: Math.random().toString(36).substring(2, 15),
          conversation_id: conversationId,
          answer: answer,
          source: useWebSearch ? "web_search" : "direct_call", // Hide the Gemini label
          confidence: "high",
          timestamp: new Date().toISOString(),
          web_search_used: useWebSearch
        };
      } catch (error) {
        lastError = error;
        
        // Only retry on specific errors that might be temporary
        if ((error.message.includes("503") || 
             error.message.includes("overloaded") || 
             error.message.includes("429") ||
             error.message.includes("UNAVAILABLE")) && 
            attempts < maxAttempts - 1) {
          
          attempts++;
          // Calculate exponential backoff delay with jitter
          const jitter = Math.random() * 0.3 + 0.85; // Random value between 0.85 and 1.15
          const delay = baseDelay * Math.pow(2, attempts - 1) * jitter;
          
          console.log(`API error: ${error.message}. Retrying in ${Math.round(delay)}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        
        console.error("Error calling Gemini API directly:", error);
        throw error;
      }
    }
    
    // If we've exhausted all attempts
    if (lastError) {
      throw lastError;
    }
    
    // Should never reach here
    throw new Error("Unexpected error in retry logic");
  }
}

// Export a singleton instance
export const chatbotService = new ChatbotService(); 