import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Paper,
  Divider,
  Avatar,
  CircularProgress,
  Chip,
  Collapse,
  List,
  ListItem,
  Tooltip,
  Zoom,
  Switch,
  FormControlLabel,
  Dialog,
  DialogContent,
  DialogTitle,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  ThumbUp,
  ThumbDown,
  School as SchoolIcon,
  Search as SearchIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import { chatbotService } from '../services/chatbot.service.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const Chatbot = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [currentStreamedMessage, setCurrentStreamedMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [conversationId, setConversationId] = useState(null);
  const [useWebSearch, setUseWebSearch] = useState(false);
  
  // Create a random conversation ID on component mount
  useEffect(() => {
    setConversationId(Math.random().toString(36).substring(2, 15));
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    if ((open || fullscreen) && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, fullscreen, currentStreamedMessage]);

  // Focus input when chat opens
  useEffect(() => {
    if ((open || fullscreen) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, fullscreen]);

  // Welcome message
  useEffect(() => {
    if ((open || fullscreen) && messages.length === 0) {
      // Generate welcome message
      const welcomeMessage = {
        id: 'welcome',
        sender: 'bot',
        text: "👋 Hi there! I'm **UniBuddy◕‿◕**, your friendly university assistant at ScrapeMyUni! I can help you find information about Pakistani universities, admission deadlines, programs, and more. What would you like to know today?",
        timestamp: new Date().toISOString()
      };
      
      setMessages([welcomeMessage]);
      
      // If web search is OFF, suggest questions that our knowledge base can answer
      if (!useWebSearch) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: 'rag-suggestions',
            sender: 'bot',
            text: "Here are some questions I can answer with my specialized university knowledge:",
            isRagSuggestions: true,
            timestamp: new Date().toISOString()
          }]);
        }, 1000);
      }
    }
  }, [open, fullscreen, messages.length, useWebSearch]);
  
  // Update suggestions when web search toggle changes
  useEffect(() => {
    if ((open || fullscreen) && messages.length > 0) {
      if (!useWebSearch) {
        // Show RAG suggestions if not already there
        if (!messages.some(m => m.isRagSuggestions)) {
          setMessages(prev => [...prev.filter(m => !m.isRagSuggestions), {
            id: 'rag-suggestions',
            sender: 'bot',
            text: "Here are some questions I can answer with my specialized university knowledge:",
            isRagSuggestions: true,
            timestamp: new Date().toISOString()
          }]);
        }
      } else {
        // Remove RAG suggestions if web search is turned ON
        setMessages(prev => prev.filter(m => !m.isRagSuggestions));
      }
    }
  }, [useWebSearch, open, fullscreen]);

  const toggleChat = () => {
    setOpen(!open);
    if (fullscreen) {
      setFullscreen(false);
    }
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
    if (!fullscreen && !open) {
      setOpen(true);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      id: Math.random().toString(36).substring(2, 15),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toISOString() 
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      // Show indicator message if using web search
      if (useWebSearch) {
        const searchingMessage = {
          id: 'searching-indicator',
          sender: 'bot',
          text: '🔍 Searching the web for information...',
          isTemp: true,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, searchingMessage]);
      }
      
      // Setup for streaming response
      setStreaming(true);
      setCurrentStreamedMessage('');
      
      // Create a placeholder for the streaming message
      const streamingPlaceholderId = Math.random().toString(36).substring(2, 15);
      setMessages(prev => [...prev.filter(msg => !msg.isTemp), {
        id: streamingPlaceholderId,
        sender: 'bot',
        text: '',
        streaming: true,
        timestamp: new Date().toISOString()
      }]);
      
      // Use our direct Gemini API in the chatbot service
      try {
        // Try to call the Gemini API directly
        const response = await chatbotService._callGeminiDirectly(userMessage.text, conversationId);
        
        // Update the streaming message with the final text
        setMessages(prev => prev.map(msg => 
          msg.id === streamingPlaceholderId
            ? { 
                ...msg, 
                id: response.message_id || streamingPlaceholderId,
                text: response.answer, 
                streaming: false, 
                source: 'direct_gemini_api',
                confidence: 'high'
              }
            : msg
        ));
        
        setCurrentStreamedMessage('');
        setStreaming(false);
        return;
      } catch (directError) {
        console.error('Direct Gemini API call failed:', directError);
        
        // Show friendly message for specific error types
        if (directError.message.includes("overloaded") || 
            directError.message.includes("503") || 
            directError.message.includes("UNAVAILABLE")) {
          
          // Update the streaming message with a friendly message about model being busy
          setMessages(prev => prev.map(msg => 
            msg.id === streamingPlaceholderId
              ? { 
                  ...msg, 
                  text: "I'm experiencing high traffic right now. I'll try to use alternative methods to answer your question...",
                  source: 'system_message'
                }
              : msg
          ));
        }
      }
      
      // Fall back to the regular chatbot service if direct call fails
      const response = await chatbotService.sendMessage(userMessage.text, conversationId, useWebSearch);
      
      // Remove temporary messages
      setMessages(prev => prev.filter(msg => !msg.isTemp && msg.id !== streamingPlaceholderId));
      
      // Add bot response to chat
      const botMessage = {
        id: response.message_id || Math.random().toString(36).substring(2, 15),
        sender: 'bot',
        text: response.answer,
        source: response.source,
        confidence: response.confidence,
        university_id: response.university_id,
        university_name: response.university_name,
        timestamp: response.timestamp || new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setCurrentStreamedMessage('');
      setStreaming(false);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove temporary messages
      setMessages(prev => prev.filter(msg => !msg.isTemp && !msg.streaming));
      setStreaming(false);
      
      // Add specific error message
      let errorText = 'Sorry, I encountered an error. Please try again.';
      
      if (error.message && error.message.includes("network")) {
        errorText = 'Network error. Please check your internet connection and try again.';
      } else if (useWebSearch) {
        errorText = 'I had trouble searching the web. Please try again or disable web search.';
      }
      
      const errorMessage = {
        id: Math.random().toString(36).substring(2, 15),
        sender: 'bot',
        text: errorText,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      showToast && showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const submitFeedback = async (messageId, isHelpful) => {
    try {
      await chatbotService.provideFeedback(messageId, isHelpful);
      
      // Update message to show feedback has been submitted
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, feedbackSubmitted: true, wasHelpful: isHelpful } 
            : msg
        )
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleClearChat = () => {
    const messages = [{
      id: 'welcome',
      sender: 'bot',
      text: "👋 Hi there! I'm **UniBuddy◕‿◕**, your friendly university assistant at ScrapeMyUni! I can help you find information about Pakistani universities, admission deadlines, programs, and more. What would you like to know today?",
      timestamp: new Date().toISOString()
    }];
    
    // Add RAG suggestions if web search is OFF
    if (!useWebSearch) {
      messages.push({
        id: 'rag-suggestions',
        sender: 'bot',
        text: "Here are some questions I can answer with my specialized university knowledge:",
        isRagSuggestions: true,
        timestamp: new Date().toISOString()
      });
    }
    
    setMessages(messages);
    
    // Generate a new conversation ID
    setConversationId(Math.random().toString(36).substring(2, 15));
  };

  const handleSampleQuestion = (question) => {
    setInput(question);
    // Focus the input field after setting the question
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const toggleWebSearch = () => {
    setUseWebSearch(!useWebSearch);
  };

  // Render the chat window for both floating and fullscreen modes
  const renderChatWindow = (isFullscreen = false) => {
    return (
      <>
        {/* Chat header */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box display="flex" alignItems="center">
            <SchoolIcon sx={{ mr: 1 }} />
            <Typography variant="h6">University Assistant</Typography>
          </Box>
          <Box>
            <Tooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen mode"}>
              <IconButton size="small" color="inherit" onClick={toggleFullscreen}>
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear chat">
              <IconButton size="small" color="inherit" onClick={handleClearChat}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {!isFullscreen && (
              <IconButton size="small" color="inherit" onClick={toggleChat}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </Box>
        
        <Divider />
        
        {/* Web search toggle */}
        <Box
          sx={{
            py: 0.5,
            px: 2,
            bgcolor: useWebSearch ? 'rgba(25, 118, 210, 0.08)' : '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderBottom: useWebSearch ? '1px solid rgba(25, 118, 210, 0.5)' : '1px solid #ddd'
          }}
        >
          <Tooltip 
            title={useWebSearch ? 
              "Web search is ON - I'll search the internet for information that's not in my knowledge base." :
              "Web search is OFF - I'll only use my internal knowledge base."
            }
            placement="top"
          >
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={useWebSearch}
                  onChange={toggleWebSearch}
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center">
                  <SearchIcon fontSize="small" sx={{ mr: 0.5, color: useWebSearch ? 'primary.main' : 'text.secondary' }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: useWebSearch ? 'primary.main' : 'text.secondary',
                      fontWeight: useWebSearch ? 'bold' : 'normal'
                    }}
                  >
                    {useWebSearch ? "Web Search ON" : "Web Search OFF"}
                  </Typography>
                </Box>
              }
              sx={{ mr: 0 }}
            />
          </Tooltip>
        </Box>
        
        <Divider />
        
        {/* Chat messages */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 2,
            backgroundColor: '#f5f8fa'
          }}
        >
          {messages.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              height="100%"
              px={2}
            >
              <SchoolIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" align="center" gutterBottom>
                University Assistant
              </Typography>
              <Typography variant="body2" align="center" color="textSecondary" paragraph>
                Ask me anything about universities in Pakistan!
              </Typography>
            </Box>
          ) : (
            messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2
                }}
              >
                {message.sender === 'bot' && (
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 32,
                      height: 32,
                      mr: 1
                    }}
                  >
                    <SchoolIcon fontSize="small" />
                  </Avatar>
                )}
                
                <Box
                  sx={{
                    maxWidth: isFullscreen ? '60%' : '75%',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: message.sender === 'user' ? 'primary.main' : 'white',
                    color: message.sender === 'user' ? 'white' : 'text.primary',
                    boxShadow: 1,
                    position: 'relative'
                  }}
                >
                  {message.university_name && (
                    <Chip 
                      size="small" 
                      label={message.university_name} 
                      color="primary" 
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                  )}
                  
                  {/* Display source badges - only show for web search and rag system */}
                  {message.source === 'web_search' && (
                    <Chip 
                      size="small" 
                      icon={<SearchIcon fontSize="small" />}
                      label="Web Search" 
                      color="secondary" 
                      variant="outlined"
                      sx={{ mb: 1, ml: message.university_name ? 1 : 0 }}
                    />
                  )}
                  
                  {/* Display source if from RAG system */}
                  {message.source === 'rag_system' && (
                    <Chip 
                      size="small" 
                      icon={<SchoolIcon fontSize="small" />}
                      label="University Expert" 
                      color="success" 
                      variant="outlined"
                      sx={{ mb: 1, ml: message.university_name ? 1 : 0 }}
                    />
                  )}
                  
                  {/* Local fallback sources */}
                  {(message.source === 'local_fallback' || message.source === 'web_search_fallback') && (
                    <Chip 
                      size="small" 
                      icon={<ChatIcon fontSize="small" />}
                      label="Local Assistant" 
                      color="info" 
                      variant="outlined"
                      sx={{ mb: 1, ml: message.university_name ? 1 : 0 }}
                    />
                  )}
                  
                  {/* Render markdown for bot messages, plain text for user */}
                  {message.sender === 'user' ? (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.text}
                    </Typography>
                  ) : (
                    <Box sx={{ 
                      '& p': { mt: 0.5, mb: 0.5 },
                      '& ul, & ol': { mt: 0.5, mb: 0.5, pl: 2.5 },
                      '& li': { mb: 0.25 },
                      '& strong': { fontWeight: 'bold' },
                      '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 1, mb: 0.5 },
                      '& a': { color: 'primary.main', textDecoration: 'underline' },
                      '& code': { backgroundColor: '#f0f0f0', p: 0.25, borderRadius: 0.5, fontFamily: 'monospace' },
                      '& blockquote': { borderLeft: '3px solid #ddd', pl: 1, ml: 1, color: 'text.secondary' }
                    }}>
                      <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                        {message.streaming && streaming ? currentStreamedMessage || 'Thinking...' : message.text}
                      </ReactMarkdown>
                    </Box>
                  )}
                  
                  {message.sender === 'bot' && !message.feedbackSubmitted && !message.streaming && (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        mt: 1, 
                        gap: 1 
                      }}
                    >
                      <Tooltip title="Helpful">
                        <IconButton 
                          size="small" 
                          onClick={() => submitFeedback(message.id, true)}
                        >
                          <ThumbUp fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Not helpful">
                        <IconButton 
                          size="small" 
                          onClick={() => submitFeedback(message.id, false)}
                        >
                          <ThumbDown fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                  
                  {message.feedbackSubmitted && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 1 }}>
                      {message.wasHelpful ? 'Thanks for your feedback!' : 'Thanks for letting us know'}
                    </Typography>
                  )}
                </Box>
                
                {message.sender === 'user' && (
                  <Avatar
                    sx={{
                      bgcolor: 'grey.300',
                      width: 32,
                      height: 32,
                      ml: 1
                    }}
                  >
                    {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                )}
              </Box>
            ))
          )}
          
          {/* Loading indicator */}
          {loading && !streaming && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                mb: 2
              }}
            >
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 32,
                  height: 32,
                  mr: 1
                }}
              >
                <SchoolIcon fontSize="small" />
              </Avatar>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'white',
                  boxShadow: 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </Box>
              </Box>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>
        
        {/* Sample questions */}
        {messages.length <= 1 && (
          <Box sx={{ p: 1, backgroundColor: '#f0f0f0' }}>
            <Typography variant="caption" color="textSecondary" sx={{ pl: 1 }}>
              Try asking:
            </Typography>
            <List dense disablePadding>
              <ListItem disablePadding sx={{ pt: 0.5 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => handleSampleQuestion("Is admission open at NUST?")}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Is admission open at NUST?
                </Button>
              </ListItem>
              <ListItem disablePadding sx={{ pt: 0.5 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => handleSampleQuestion("What programs does FAST University offer?")}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  What programs does FAST University offer?
                </Button>
              </ListItem>
              <ListItem disablePadding sx={{ pt: 0.5 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => handleSampleQuestion("When is the deadline for admission to QAU?")}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  When is the deadline for admission to QAU?
                </Button>
              </ListItem>
            </List>
          </Box>
        )}
        
        {/* RAG-specific suggestions (when web search OFF) */}
        {messages.some(m => m.isRagSuggestions) && (
          <Box sx={{ p: 1, backgroundColor: '#f0f7f0', borderTop: '1px solid #6ca97a' }}>
            <List dense disablePadding>
              <ListItem disablePadding sx={{ pt: 0.5 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  color="success"
                  onClick={() => handleSampleQuestion("Tell me about NUST university")}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Tell me about NUST university
                </Button>
              </ListItem>
              <ListItem disablePadding sx={{ pt: 0.5 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  color="success"
                  onClick={() => handleSampleQuestion("What programs does LUMS offer?")}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  What programs does LUMS offer?
                </Button>
              </ListItem>
              <ListItem disablePadding sx={{ pt: 0.5 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  color="success"
                  onClick={() => handleSampleQuestion("What are the typical university admission cycles in Pakistan?")}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  What are the typical university admission cycles?
                </Button>
              </ListItem>
              <ListItem disablePadding sx={{ pt: 0.5 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  color="success"
                  onClick={() => handleSampleQuestion("What features does ScrapeMyUni offer?")}
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  What features does ScrapeMyUni offer?
                </Button>
              </ListItem>
            </List>
          </Box>
        )}
        
        <Divider />
        
        {/* Chat input */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.paper'
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder={useWebSearch ? "Ask anything (will search the web)..." : "Ask about universities..."}
            variant="outlined"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleInputKeyPress}
            inputRef={inputRef}
            disabled={loading}
            InputProps={{
              sx: { borderRadius: 5, pr: 0.5 }
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!input.trim() || loading}
            sx={{ ml: 1 }}
          >
            {loading ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
      </>
    );
  };

  return (
    <>
      {/* Floating chat button */}
      <IconButton
        onClick={toggleChat}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          bgcolor: 'primary.main',
          color: 'white',
          width: 60,
          height: 60,
          boxShadow: 3,
          '&:hover': {
            bgcolor: 'primary.dark',
          },
          zIndex: 1000
        }}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </IconButton>

      {/* Chat window (floating version) */}
      <Zoom in={open && !fullscreen}>
        <Paper
          elevation={4}
          sx={{
            position: 'fixed',
            bottom: 90,
            right: 20,
            width: { xs: 'calc(100% - 40px)', sm: 400 },
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1000,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {renderChatWindow(false)}
        </Paper>
      </Zoom>
      
      {/* Fullscreen chat dialog */}
      <Dialog
        fullScreen
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        sx={{ zIndex: 1100 }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
        >
          {renderChatWindow(true)}
        </Box>
      </Dialog>
      
      {/* CSS for typing indicator */}
      <style jsx="true">{`
        .typing-indicator {
          display: flex;
          align-items: center;
        }
        .typing-indicator span {
          height: 8px;
          width: 8px;
          background-color: #bbb;
          border-radius: 50%;
          display: inline-block;
          margin: 0 2px;
          animation: typing 1s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(1) {
          animation-delay: 0s;
        }
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes typing {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </>
  );
};

export default Chatbot;
