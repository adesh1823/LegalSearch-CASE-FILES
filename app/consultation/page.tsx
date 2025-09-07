"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Link from "next/link"
import { marked } from "marked"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, AlertCircle, Brain, User, Bot, Send, MessageSquare, Shield, Scale, FileText, Clock, CheckCircle, Info, Lightbulb, HelpCircle, BookOpen } from "lucide-react"

type ConsultationResponse = {
  response: string
  history: string[]
  keyword?: string | string[]
  legal_keyword?: string | string[]
}

type Message = {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  isTyping?: boolean
  displayedContent?: string
}

const CONSULTATION_URL = "https://adeshjain-adesh-legal-test.hf.space/legal-consultation"

// Sample questions to help users get started
const sampleQuestions = [
  "What are my rights as a tenant?",
  "How do I file for divorce?",
  "What should I do after a car accident?",
  "Can I sue for workplace harassment?",
  "How do I write a will?",
  "What are the steps to start a business?"
]

const legalAreas = [
  { icon: Scale, label: "Family Law", color: "bg-blue-500" },
  { icon: Shield, label: "Criminal Law", color: "bg-red-500" },
  { icon: FileText, label: "Contract Law", color: "bg-green-500" },
  { icon: BookOpen, label: "Corporate Law", color: "bg-purple-500" }
]

export default function ConsultationPage() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [userId, setUserId] = useState<string>("")
  const [showInstructions, setShowInstructions] = useState(true)
  const [isTypingActive, setIsTypingActive] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Generate or retrieve user_id for this session
  useEffect(() => {
    try {
      let uid = localStorage.getItem("user_id")
      if (!uid) {
        uid = uuidv4()
        localStorage.setItem("user_id", uid)
      }
      setUserId(uid)
    } catch (err) {
      setUserId(uuidv4())
    }
  }, [])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      }
    }
    
    const timeoutId = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timeoutId)
  }, [messages, isTypingActive])

  // Hide instructions when user starts chatting
  useEffect(() => {
    if (messages.length > 0) {
      setShowInstructions(false)
    }
  }, [messages.length])

  // Cleanup function for typing timeouts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Optimized typing effect
  const simulateTyping = useCallback((messageId: string, fullContent: string) => {
    if (isTypingActive) return

    setIsTypingActive(true)
    const words = fullContent.split(' ')
    let currentWordIndex = 0
    
    const typeNextBatch = () => {
      if (currentWordIndex >= words.length) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isTyping: false, displayedContent: fullContent }
            : msg
        ))
        setIsTypingActive(false)
        return
      }

      const batchSize = Math.min(2, words.length - currentWordIndex)
      const wordsToShow = words.slice(0, currentWordIndex + batchSize).join(' ')
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, displayedContent: wordsToShow }
          : msg
      ))
      
      currentWordIndex += batchSize
      
      typingTimeoutRef.current = setTimeout(typeNextBatch, 100)
    }
    
    typeNextBatch()
  }, [isTypingActive])

  const handleSampleQuestion = useCallback((question: string) => {
    setQuery(question)
    setError(null)
  }, [])

  // REAL API CONSULTATION HANDLER
  const handleConsult = useCallback(async () => {
    if (!query.trim() || loading || isTypingActive) return
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    const userMessage: Message = {
      id: uuidv4(),
      type: 'user',
      content: query.trim(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    const currentQuery = query.trim()
    setQuery("")
    setLoading(true)
    setError(null)
    
    console.log('🚀 Making API request to:', CONSULTATION_URL)
    console.log('📝 Query:', currentQuery)
    console.log('👤 User ID:', userId)
    
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
      })
      
      const requestBody = { 
        query: currentQuery, 
        user_id: userId 
      }
      
      console.log('📤 Sending request body:', requestBody)
      
      const fetchPromise = fetch(CONSULTATION_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Origin": window.location.origin,
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
        mode: 'cors'
      })
      
      console.log('⏱️ Waiting for response...')
      const res = await Promise.race([fetchPromise, timeoutPromise])
      
      console.log('📥 Response received:')
      console.log('- Status:', res.status)
      console.log('- Status Text:', res.statusText)
      console.log('- Headers:', Object.fromEntries(res.headers.entries()))
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('❌ Server error response:', errorText)
        throw new Error(`Server error: ${res.status} ${res.statusText}. Response: ${errorText}`)
      }
      
      const responseText = await res.text()
      console.log('📄 Raw response text:', responseText)
      
      let json: ConsultationResponse
      try {
        json = JSON.parse(responseText)
        console.log('✅ Parsed JSON response:', json)
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError)
        throw new Error(`Invalid JSON response: ${responseText}`)
      }
      
      const responseContent = json.response || json.toString() || "I apologize, but I couldn't generate a response. Please try rephrasing your question."
      
      console.log('💬 Final response content:', responseContent)
      
      const aiMessage: Message = {
        id: uuidv4(),
        type: 'ai',
        content: responseContent,
        timestamp: new Date(),
        isTyping: true,
        displayedContent: ""
      }
      
      setMessages(prev => [...prev, aiMessage])
      
      setTimeout(() => {
        simulateTyping(aiMessage.id, responseContent)
      }, 300)
      
    } catch (e: any) {
      console.error('🔥 API Call Error:', e)
      console.error('Error name:', e.name)
      console.error('Error message:', e.message)
      console.error('Error stack:', e.stack)
      
      if (e.name === 'AbortError') {
        console.log('🛑 Request was aborted')
        return
      }
      
      let errorContent = "An unexpected error occurred. Please try again."
      
      if (e?.message?.includes('timeout')) {
        errorContent = "⏱️ Request timed out after 30 seconds. Please try again with a shorter question."
      } else if (e?.message?.includes('Failed to fetch') || e?.message?.includes('NetworkError')) {
        errorContent = "🌐 Unable to connect to the legal consultation service. Please check your internet connection and try again."
      } else if (e?.message?.includes('CORS')) {
        errorContent = "🔒 Cross-origin request blocked. The API might need CORS configuration."
      } else if (e?.message?.includes('Server error')) {
        errorContent = `🚨 Server Error: ${e.message}`
      } else {
        errorContent = `❌ Error: ${e?.message || "Something went wrong. Please try again."}`
      }
        
      setError(e?.message || "API call failed")
      
      const errorMessage: Message = {
        id: uuidv4(),
        type: 'ai',
        content: errorContent,
        timestamp: new Date(),
        isTyping: true,
        displayedContent: ""
      }
      
      setMessages(prev => [...prev, errorMessage])
      
      setTimeout(() => {
        simulateTyping(errorMessage.id, errorContent)
      }, 200)
    } finally {
      setLoading(false)
      console.log('✨ API call completed')
    }
  }, [query, loading, isTypingActive, userId, simulateTyping])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading && !isTypingActive) {
      e.preventDefault()
      handleConsult()
    }
  }, [handleConsult, loading, isTypingActive])

  const renderMarkdown = useCallback((content: string) => {
    try {
      // Clean up the content by removing unwanted \n characters
      const cleanedContent = content
        .replace(/\\n/g, ' ')  // Replace literal \n with space
        .replace(/\n{3,}/g, '\n\n')  // Replace multiple newlines with double newlines
        .trim()
      
      const html = marked(cleanedContent, { 
        breaks: true, 
        gfm: true
      })
      return { __html: html }
    } catch (err) {
      // Fallback: clean content and convert single newlines to <br>
      const cleanedContent = content
        .replace(/\\n/g, ' ')  // Replace literal \n with space
        .replace(/\n/g, '<br>')
        .trim()
      return { __html: cleanedContent }
    }
  }, [])

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [])

  const handleNewChat = useCallback(() => {
    setMessages([])
    setQuery("")
    setError(null)
    setShowInstructions(true)
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    setIsTypingActive(false)
  }, [])

  const userMessageCount = useMemo(() => 
    messages.filter(m => m.type === 'user').length, 
    [messages]
  )

  const isInputValid = query.trim().length > 0 && query.trim().length <= 2000
  const canSend = isInputValid && !loading && !isTypingActive

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-full shadow-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Legal AI Assistant
              </span>
            </h1>
            <Link href="/" aria-label="Back to main">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        <div className="container mx-auto max-w-6xl px-4 flex gap-6 h-full">
          {/* Instructions Panel */}
          {showInstructions && (
            <div className="w-80 flex-shrink-0 py-4">
              <div className="h-full overflow-y-auto space-y-4">
                {/* Welcome Card */}
                <Card className="border-primary/20 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      How to Get Started
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-1 mt-1">
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Describe your situation</p>
                          <p className="text-xs text-muted-foreground">Be specific about your legal issue or question</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-1 mt-1">
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Ask follow-up questions</p>
                          <p className="text-xs text-muted-foreground">Get clarification on any legal concepts</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-1 mt-1">
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Get actionable advice</p>
                          <p className="text-xs text-muted-foreground">Receive step-by-step guidance</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Legal Areas */}
                <Card className="border-primary/20 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Scale className="h-5 w-5 text-primary" />
                      Legal Areas We Cover
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {legalAreas.map((area, index) => {
                        const Icon = area.icon
                        return (
                          <Badge key={index} variant="secondary" className="justify-center py-2 px-3">
                            <Icon className="h-3 w-3 mr-1" />
                            {area.label}
                          </Badge>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Sample Questions */}
                <Card className="border-primary/20 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      Example Questions
                    </CardTitle>
                    <CardDescription>
                      Click any question to get started
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {sampleQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full text-left justify-start h-auto p-3 text-wrap hover:bg-primary/5"
                        onClick={() => handleSampleQuestion(question)}
                        disabled={loading || isTypingActive}
                      >
                        <span className="text-sm">{question}</span>
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                {/* Disclaimer */}
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
                    <strong>Disclaimer:</strong> This AI provides general legal information only. For specific legal advice, consult a qualified attorney.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 py-4 min-w-0">
            <div className="h-full flex flex-col border-2 border-primary/20 shadow-xl rounded-lg bg-card">
              {/* Chat Header */}
              <div className="flex-shrink-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-b p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-full shadow-lg">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-primary">AI Legal Consultation</h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Available 24/7 • Confidential • Instant Responses
                      </div>
                    </div>
                  </div>
                  {messages.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNewChat}
                        disabled={loading || isTypingActive}
                      >
                        New Chat
                      </Button>
                      <Badge variant="secondary" className="px-3 py-1">
                        {userMessageCount} questions asked
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4"
                style={{
                  minHeight: '400px',
                  maxHeight: 'calc(100vh - 350px)'
                }}
              >
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center max-w-md">
                      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        <Brain className="h-12 w-12 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-foreground">Welcome to Legal AI</h3>
                      <p className="text-muted-foreground mb-4">
                        I'm here to help you understand your legal rights and options. Describe your situation and I'll provide guidance based on legal principles.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI-Powered
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Confidential
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          24/7 Available
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                            message.type === 'user' 
                              ? 'bg-gradient-to-br from-primary to-primary/80 text-white' 
                              : 'bg-gradient-to-br from-secondary to-secondary/80 text-white'
                          }`}>
                            {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                          </div>
                          
                          {/* Message Content */}
                          <div className={`rounded-2xl p-4 relative shadow-sm ${
                            message.type === 'user' 
                              ? 'bg-gradient-to-br from-primary to-primary/90 text-white' 
                              : 'bg-muted/50 border border-border'
                          }`}>
                            {message.type === 'ai' ? (
                              <div className="flex flex-col">
                                <div
                                  className="prose prose-sm max-w-none text-foreground leading-relaxed [&>*]:text-foreground"
                                  dangerouslySetInnerHTML={renderMarkdown(message.displayedContent || "")}
                                />
                                {message.isTyping && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <div className="flex space-x-1">
                                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-2">AI is analyzing...</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            )}
                            <div className={`text-xs mt-2 ${
                              message.type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {loading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/80 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-muted/50 border border-border rounded-2xl p-4">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Analyzing your legal question...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="flex-shrink-0 border-t bg-background/50 p-4 rounded-b-lg">
                {error && (
                  <Alert className="border-destructive/50 bg-destructive/5 mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Describe your legal question or situation in detail... (max 2000 characters)"
                      value={query}
                      onChange={(e) => {
                        if (e.target.value.length <= 2000) {
                          setQuery(e.target.value)
                          setError(null)
                        }
                      }}
                      onKeyPress={handleKeyPress}
                      className="min-h-[80px] max-h-40 resize-none border-primary/20 focus:border-primary/40 transition-colors"
                      disabled={loading || isTypingActive}
                      maxLength={2000}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{query.length}/2000 characters</span>
                      {!isInputValid && query.length > 0 && (
                        <span className="text-destructive">Please enter a valid question</span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleConsult}
                    disabled={!canSend}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg px-6 py-3 h-auto self-end transition-all duration-200 hover:shadow-xl disabled:opacity-50"
                  >
                    {loading || isTypingActive ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                  <span>Press Enter to send • Shift+Enter for new line</span>
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Secure & Confidential
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}