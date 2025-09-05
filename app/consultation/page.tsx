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
import { Sparkles, Loader2, AlertCircle, Brain, User, Bot, Send, MessageSquare } from "lucide-react"

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

export default function ConsultationPage() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [userId, setUserId] = useState<string>("")
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
    <main className="container mx-auto max-w-4xl px-4 py-8 h-screen flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-pretty text-2xl font-semibold flex items-center gap-3">
          <MessageSquare className="h-7 w-7 text-primary" />
          Legal Consultation Chat
        </h1>
        <Link href="/" aria-label="Back to main">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      <div className="flex-1 flex flex-col">
        <Card className="border-4 border-primary/30 shadow-2xl indian-card flex-1 flex flex-col">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardTitle className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-full shadow-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">AI Legal Assistant</h2>
                <CardDescription>Ask questions about your legal case and get instant guidance.</CardDescription>
              </div>
            </CardTitle>
          </CardHeader>
          
          {/* Chat Messages Area */}
          <CardContent className="flex-1 flex flex-col p-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[60vh]">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Welcome to your Legal Consultation</p>
                    <p className="text-sm">Describe your legal issue to get started</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user' 
                          ? 'bg-primary text-white' 
                          : 'bg-secondary text-white'
                      }`}>
                        {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      
                      {/* Message Content */}
                      <div className={`rounded-lg p-3 relative ${
                        message.type === 'user' 
                          ? 'bg-primary text-white' 
                          : 'bg-muted border border-border'
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
                                <span className="text-xs text-muted-foreground ml-2">AI is typing...</span>
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
                  <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Processing your request...</span>
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

              <div className="flex gap-2">
                <div className="flex-1">
                  <Textarea
                    placeholder="Ask about your legal case..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[60px] max-h-32 resize-none"
                    disabled={loading}
                  />
                </div>
                <Button
                  onClick={handleConsult}
                  disabled={!query.trim() || loading}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg px-4 py-2 h-auto self-end indian-hover"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {/* Press Enter to send, Shift+Enter for new line */}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}