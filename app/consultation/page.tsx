"use client"

import { useState, useEffect, useRef } from "react"
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Generate or retrieve user_id for this session
  useEffect(() => {
    let uid = localStorage.getItem("user_id")
    if (!uid) {
      uid = uuidv4()
      localStorage.setItem("user_id", uid)
    }
    setUserId(uid)
  }, [])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Hide instructions when user starts chatting
  useEffect(() => {
    if (messages.length > 0) {
      setShowInstructions(false)
    }
  }, [messages])

  // Typing effect function
  const simulateTyping = (messageId: string, fullContent: string) => {
    const words = fullContent.split(' ')
    let currentWordIndex = 0
    
    const typeNextWord = () => {
      if (currentWordIndex < words.length) {
        const wordsToShow = words.slice(0, currentWordIndex + 1).join(' ')
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, displayedContent: wordsToShow }
            : msg
        ))
        
        currentWordIndex++
        
        // Vary the typing speed slightly for more natural feel
        const delay = Math.random() * 100 + 50 // 50-150ms between words
        setTimeout(typeNextWord, delay)
      } else {
        // Typing complete
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isTyping: false, displayedContent: fullContent }
            : msg
        ))
      }
    }
    
    typeNextWord()
  }

  const handleSampleQuestion = (question: string) => {
    setQuery(question)
  }

  async function handleConsult() {
    if (!query.trim()) return
    
    // Add user message to chat
    const userMessage: Message = {
      id: uuidv4(),
      type: 'user',
      content: query,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(CONSULTATION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, user_id: userId }),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const json: ConsultationResponse = await res.json()
      
      const responseContent = json.response || "No response received."
      
      // Add AI response to chat with typing state
      const aiMessage: Message = {
        id: uuidv4(),
        type: 'ai',
        content: responseContent,
        timestamp: new Date(),
        isTyping: true,
        displayedContent: ""
      }
      setMessages(prev => [...prev, aiMessage])
      
      // Start typing effect after a brief delay
      setTimeout(() => {
        simulateTyping(aiMessage.id, responseContent)
      }, 500)
      
    } catch (e: any) {
      const errorContent = `Error: ${e?.message || "Something went wrong"}`
      setError(e?.message || "Something went wrong")
      
      // Add error message to chat
      const errorMessage: Message = {
        id: uuidv4(),
        type: 'ai',
        content: errorContent,
        timestamp: new Date(),
        isTyping: true,
        displayedContent: ""
      }
      setMessages(prev => [...prev, errorMessage])
      
      // Start typing effect for error message
      setTimeout(() => {
        simulateTyping(errorMessage.id, errorContent)
      }, 200)
    } finally {
      setLoading(false)
      setQuery("") // Clear input after sending
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleConsult()
    }
  }

  const renderMarkdown = (content: string) => {
    const html = marked(content, { breaks: true, gfm: true })
    return { __html: html }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8 h-screen flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-pretty text-3xl font-bold flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-full shadow-lg">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Legal AI Assistant
          </span>
        </h1>
        <Link href="/" aria-label="Back to main">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>

      <div className="flex-1 flex gap-6">
        {/* Instructions Panel */}
        {showInstructions && (
          <div className="w-80 space-y-4">
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
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <Card className="border-2 border-primary/20 shadow-xl flex-1 flex flex-col">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-full shadow-lg">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-primary">AI Legal Consultation</h2>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Available 24/7 • Confidential • Instant Responses
                    </CardDescription>
                  </div>
                </CardTitle>
                {messages.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMessages([])
                      }}
                    >
                      New Chat
                    </Button>
                    <Badge variant="secondary" className="px-3 py-1">
                      {messages.filter(m => m.type === 'user').length} questions asked
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            
            {/* Chat Messages Area */}
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[60vh]">
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
                  messages.map((message) => (
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
                                className="prose prose-sm max-w-none text-foreground leading-relaxed [&>*]:text-foreground [&>h1]:text-foreground [&>h2]:text-foreground [&>h3]:text-foreground [&>h4]:text-foreground [&>h5]:text-foreground [&>h6]:text-foreground [&>p]:text-foreground [&>ul]:text-foreground [&>ol]:text-foreground [&>li]:text-foreground [&>strong]:text-foreground [&>em]:text-foreground [&>code]:bg-background [&>code]:text-foreground [&>pre]:bg-background [&>pre]:text-foreground"
                                dangerouslySetInnerHTML={renderMarkdown(message.displayedContent || "")}
                              />
                              {/* Typing indicator */}
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
                  ))
                )}
                
                {/* Loading indicator */}
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
              </div>

              <Separator />

              {/* Input Area */}
              <div className="p-6 space-y-4">
                {error && (
                  <Alert className="border-destructive/50 bg-destructive/5">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Describe your legal question or situation in detail..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="min-h-[80px] max-h-40 resize-none border-primary/20 focus:border-primary/40 transition-colors"
                      disabled={loading}
                    />
                  </div>
                  <Button
                    onClick={handleConsult}
                    disabled={!query.trim() || loading}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg px-6 py-3 h-auto self-end transition-all duration-200 hover:shadow-xl"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Press Enter to send • Shift+Enter for new line</span>
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Secure & Confidential
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}