import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  IconButton,
  Typography,
  Paper,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  Send,
  SmartToy,
  Person,
} from "@mui/icons-material";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";
import { useSearchParams } from "react-router-dom";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  loading?: boolean;
}

interface CVChatInterfaceProps {
  fileId: string;
  fileName: string;
}

export const CVChatInterface: React.FC<CVChatInterfaceProps> = ({
  fileId,
  fileName,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `Hi! I'm your AI assistant. Ask me anything about ${fileName} and I'll analyze it for you. Try asking questions like "What are the main skills mentioned?" or "How can this CV be improved?".`,
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasProcessedQueryRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatFileAnalysis = httpsCallable(functions, "chatFileAnalysis");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: "",
      sender: "ai",
      timestamp: new Date(),
      loading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);

    try {
      const result = await chatFileAnalysis({
        question: messageText,
        fileId: fileId,
      });

      const response = result.data as { response: string };

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                text: response.response,
                loading: false,
              }
            : msg
        )
      );
    } catch (error) {
      console.error("Error calling chat function:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                text: "Sorry, I encountered an error while analyzing your request. Please try again.",
                loading: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, chatFileAnalysis, fileId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Process query parameter on component mount - runs only once
  useEffect(() => {
    const queryQuestion = searchParams.get('q');
    if (queryQuestion && !hasProcessedQueryRef.current) {
      hasProcessedQueryRef.current = true;
      // Clear the query parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('q');
      setSearchParams(newSearchParams, { replace: true });
      // Process the question after a short delay to ensure component is ready
      setTimeout(() => {
        sendMessage(queryQuestion);
      }, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What are the key skills mentioned?",
    "How can this CV be improved?",
    "What job roles would fit this profile?",
    "Are there any missing sections?",
  ];

  const handleSuggestedQuestion = (question: string) => {
    setInputText(question);
  };

  return (
    <Card sx={{ height: "600px", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 0 }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="body2" color="text.secondary">
            Ask questions about your CV analysis
          </Typography>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flexGrow: 1,
            p: 2,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxHeight: "400px",
          }}
        >
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: "flex",
                justifyContent: message.sender === "user" ? "flex-end" : "flex-start",
                alignItems: "flex-start",
                gap: 1,
              }}
            >
              {message.sender === "ai" && (
                <SmartToy sx={{ color: "primary.main", mt: 0.5, fontSize: 20 }} />
              )}
              
              <Paper
                sx={{
                  p: 2,
                  maxWidth: "80%",
                  bgcolor: message.sender === "user" ? "primary.main" : "background.paper",
                  color: message.sender === "user" ? "primary.contrastText" : "text.primary",
                  border: message.sender === "ai" ? 1 : 0,
                  borderColor: "divider",
                }}
              >
                {message.loading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2">Analyzing...</Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {message.text}
                  </Typography>
                )}
              </Paper>

              {message.sender === "user" && (
                <Person sx={{ color: "text.secondary", mt: 0.5, fontSize: 20 }} />
              )}
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <Box sx={{ p: 2, pt: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Try asking:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {suggestedQuestions.map((question, index) => (
                <Chip
                  key={index}
                  label={question}
                  variant="outlined"
                  size="small"
                  onClick={() => handleSuggestedQuestion(question)}
                  sx={{ cursor: "pointer" }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Input */}
        <Box sx={{ p: 2, pt: 1, borderTop: 1, borderColor: "divider" }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Ask me anything about this CV..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              variant="outlined"
              size="small"
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              color="primary"
              sx={{ mb: 0.5 }}
            >
              <Send />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};