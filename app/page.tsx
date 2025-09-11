"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link" // add Link import to enable navigation to the separate consultation route
import {
  Search,
  Scale,
  FileText,
  Gavel,
  Calendar,
  ExternalLink,
  Loader2,
  Building,
  AlertCircle,
  Brain,
  Sparkles,
  Flag,
  Star,
  Crown,
  Zap,
} from "lucide-react"

interface SearchResult {
  title: string
  snippet: string
  link: string
  source: string
  court?: string
  date?: string
  relevance?: string
}

interface SearchResponse {
  query: string
  search_type: string
  timestamp: string
  sources: {
    indian_kanoon?: { docs?: SearchResult[]; error?: string }
    supreme_court?: SearchResult[]
    ecourts?: SearchResult[]
    legal_news?: SearchResult[]
  }
}

interface AnalysisResponse {
  analysis: string
  error?: string
}

interface ConsultationResponse {
  consultation?: string
  keyword?: string | string[]
  error?: string
}

export default function IndianLegalSearchApp() {
  const [query, setQuery] = useState("")
  const [searchType, setSearchType] = useState("all")
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [documentPreview, setDocumentPreview] = useState<{ title: string; content: string } | null>(null)
  const [filters, setFilters] = useState({
    doctypes: "",
    fromdate: "",
    todate: "",
    court_type: "",
    year: "",
  })
  const [consultation, setConsultation] = useState<ConsultationResponse | null>(null)
  const [consultLoading, setConsultLoading] = useState(false)
  const [consultError, setConsultError] = useState<string | null>(null)
  const [caseDetails, setCaseDetails] = useState("")

  const API_BASE_URL = "https://aravsaxena884-legal-search.hf.space" // Update this to your API URL

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setResults(null)
    setAnalysis(null)
    setConsultation(null)
    setConsultError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          search_type: searchType,
          filters,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("Search failed:", error)
      setResults({
        query,
        search_type: searchType,
        timestamp: new Date().toISOString(),
        sources: {
          indian_kanoon: { error: "Search failed. Please check your connection and try again." },
        },
      } as any)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!results) return

    setAnalyzing(true)
    setAnalysis(null)

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search_results: results,
          analysis_type: "comprehensive",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setAnalysis(data)
    } catch (error) {
      console.error("Analysis failed:", error)
      setAnalysis({
        analysis: "",
        error: "AI analysis failed. Please try again later.",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDocumentPreview = async (docId: string, title: string) => {
    try {
      // Extract document ID from Indian Kanoon links if needed
      let actualDocId = docId
      if (docId.includes("/doc/")) {
        const matches = docId.match(/\/doc\/(\d+)/)
        actualDocId = matches ? matches[1] : docId
      }

      const response = await fetch(`${API_BASE_URL}/document/${actualDocId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      // Handle different response formats from the API
      let content = "Document content not available."
      if (data.content) {
        content = data.content
      } else if (data.doc_content) {
        content = data.doc_content
      } else if (data.text) {
        content = data.text
      } else if (typeof data === "string") {
        content = data
      }

      setDocumentPreview({ title, content })
    } catch (error) {
      console.error("Document preview failed:", error)
      setDocumentPreview({
        title,
        content: `Failed to load document preview: ${error instanceof Error ? error.message : "Unknown error"}. This document may not be available for preview.`,
      })
    }
  }

  const handleConsult = async () => {
    const payload = (caseDetails && caseDetails.trim()) || (query && query.trim())
    if (!payload) return

    setConsultLoading(true)
    setConsultError(null)
    setConsultation(null)
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: payload }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      // Normalize potential variations
      const rawConsultation = data?.consultation ?? data?.Consultation ?? ""
      const rawKeyword = data?.keyword ?? data?.keywords ?? []

      setConsultation({
        consultation: typeof rawConsultation === "string" ? rawConsultation : JSON.stringify(rawConsultation, null, 2),
        keyword: rawKeyword,
      })
    } catch (err) {
      console.error("Consultation failed:", err)
      setConsultError("Failed to fetch consultation. Please try again.")
    } finally {
      setConsultLoading(false)
    }
  }

  const renderSearchResults = (source: string, data: any) => {
    if (!data) return null

    if (data.error) {
      return (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{data.error}</AlertDescription>
        </Alert>
      )
    }

    let resultsArray: SearchResult[] = []

    if (source === "indian_kanoon" && data.docs) {
      resultsArray = data.docs
    } else if (Array.isArray(data)) {
      resultsArray = data
    }

    if (resultsArray.length === 0) {
      return (
        <Alert>
          <AlertDescription>No results found for this source.</AlertDescription>
        </Alert>
      )
    }

    return (
      <div className="space-y-4">
        {resultsArray.map((result, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg leading-tight">
                  {result.link && result.link !== "#" && result.link.startsWith("http") ? (
                    <a
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 flex items-center gap-2 transition-colors duration-200 hover:underline"
                    >
                      <span className="flex-1">{result.title}</span>
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{result.title}</span>
                      {source === "indian_kanoon" &&
                        result.link &&
                        (result.link.includes("/doc/") || result.link.match(/\d+/)) && (
                          <>
                            <Badge variant="outline" className="text-xs">
                              📄 Document Available
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border-primary/30"
                              onClick={() => handleDocumentPreview(result.link || `doc_${index}`, result.title)}
                            >
                              👁️ Preview Document
                            </Button>
                          </>
                        )}
                    </div>
                  )}
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {result.source}
                  </Badge>
                  {result.relevance && (
                    <Badge variant="outline" className="text-xs">
                      {result.relevance}
                    </Badge>
                  )}
                  {result.link && result.link !== "#" && result.link.startsWith("http") && (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                      🔗 Active Link
                    </Badge>
                  )}
                </div>
              </div>
              {(result.court || result.date) && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {result.court && (
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {result.court}
                    </div>
                  )}
                  {result.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {result.date}
                    </div>
                  )}
                </div>
              )}
              {result.link && (
                <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/30 rounded border-l-2 border-primary/30 indian-card lotus-pattern">
                  <span className="font-medium">🔗 Source URL: </span>
                  <span className="font-mono break-all">{result.link}</span>
                  {!result.link.startsWith("http") && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      ⚠️ Invalid URL
                    </Badge>
                  )}
                </div>
              )}
            </CardHeader>
            {result.snippet && (
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">{result.snippet}</p>
                {(!result.link || !result.link.startsWith("http")) && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Link not available</span>
                    </div>
                    <p className="text-sm text-orange-700 mb-3">
                      This document link is not accessible. Try searching for the case title on Indian Kanoon directly.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs bg-transparent"
                        onClick={() => {
                          const searchQuery = encodeURIComponent(result.title)
                          window.open(`https://indiankanoon.org/search/?formInput=${searchQuery}`, "_blank")
                        }}
                      >
                        🔍 Search on Indian Kanoon
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs bg-transparent"
                        onClick={() => {
                          navigator.clipboard.writeText(result.title)
                          alert("Case title copied to clipboard!")
                        }}
                      >
                        📋 Copy Title
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background mandala-pattern">
      {loading && (
        <div className="search-loading-overlay">
          <div className="ashoka-chakra-loader"></div>
          <div className="mt-8 text-center">
            <h3 className="text-3xl font-bold text-white mb-4 sanskrit-style">
              🔍 खोज रहे हैं... • Searching Legal Database
            </h3>
            <p className="text-white/90 text-xl">
              🇮🇳 Please wait while we search across Indian legal databases • कृपया प्रतीक्षा करें
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
          </div>
        </div>
      )}

      {documentPreview && (
        <div className="document-preview-modal" onClick={() => setDocumentPreview(null)}>
          <div className="document-preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-primary/20 bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-primary sanskrit-style">📄 Document Preview</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDocumentPreview(null)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  ✕ Close
                </Button>
              </div>
              <h4 className="text-lg font-semibold mt-2 text-muted-foreground">{documentPreview.title}</h4>
            </div>
            <div className="p-6 max-h-96 overflow-auto">
              <div className="prose prose-lg max-w-none">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground bg-muted/30 p-4 rounded-lg border border-primary/20 sanskrit-style">
                  {documentPreview.content}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="indian-flag-gradient text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 lotus-pattern"></div>
        <div className="absolute top-4 left-4 ashoka-wheel opacity-20">
          <div className="w-16 h-16 border-4 border-white/30 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/50 rounded-full relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-white/70 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 ashoka-wheel opacity-20" style={{ animationDirection: "reverse" }}>
          <div className="w-16 h-16 border-4 border-white/30 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/50 rounded-full relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-white/70 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="flex items-center gap-6 mb-10">
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full p-4 indian-border">
              <Flag className="h-10 w-10 text-white" />
              <Scale className="h-10 w-10 text-white" />
              <Crown className="h-8 w-8 text-white/80" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3 text-white drop-shadow-2xl sanskrit-style devanagari-accent">
                भारतीय न्यायिक अनुसंधान पोर्टल
              </h1>
              <h2
                className="text-2xl font-semibold mb-2 text-white/95 hindi-accent"
                style={{ WebkitTextFillColor: "white" }}
              >
                Indian Legal Research Portal
              </h2>
              <p className="text-white/90 text-xl flex items-center gap-2">
                <span className="text-2xl">🇮🇳</span>
                <span className="sanskrit-style">न्याय सेवा • Legal Excellence • सत्यमेव जयते</span>
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/consultation" className="block">
                <Button className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white shadow-2xl px-6 py-4 h-auto text-lg font-bold indian-hover pulse-saffron">
                  <Sparkles className="h-6 w-6 mr-3" />
                  <span className="sanskrit-style">🗣️ Case Consultation • परामर्श</span>
                </Button>
              </Link>
              {/* existing chatbot and voice buttons */}
              <Link href="/chatbot" className="block">
                <Button className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white shadow-2xl px-6 py-4 h-auto text-lg font-bold indian-hover pulse-saffron">
                  <Brain className="h-6 w-6 mr-3" />
                  <span className="sanskrit-style">🤖 AI Chatbot Analysis • चैटबॉट विश्लेषण</span>
                </Button>
              </Link>
              <Link href="/voicebot" className="block">
                <Button className="bg-gradient-to-r from-green-500 to-orange-600 hover:from-green-600 hover:to-orange-700 text-white shadow-2xl px-6 py-4 h-auto text-lg font-bold indian-hover pulse-saffron">
                  <svg className="h-6 w-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  <span className="sanskrit-style">🗣️ Voice Assistant • आवाज सहायक</span>
                </Button>
              </Link>
              <p className="text-white/80 text-sm text-center max-w-48">
                Upload documents & get AI-powered legal insights
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <Textarea
                  placeholder="🔍 Enter your legal query • अपनी कानूनी खोज दर्ज करें (e.g., 'contract law', 'property rights', 'criminal procedure')"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-white/95 backdrop-blur-sm text-foreground border-white/40 h-14 text-lg shadow-2xl indian-card"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="bg-white text-primary hover:bg-white/90 h-14 px-10 font-bold shadow-2xl pulse-saffron indian-hover text-lg"
              >
                {loading ? (
                  <div className="ashoka-loading mr-3">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <Search className="h-6 w-6 mr-3" />
                )}
                <span className="sanskrit-style">खोजें / Search</span>
              </Button>
            </div>

            <div className="flex flex-wrap gap-4">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-52 bg-white/90 backdrop-blur-sm text-foreground border-white/40 indian-card h-12">
                  <SelectValue placeholder="🏛️ Search type" />
                </SelectTrigger>
                <SelectContent className="indian-card">
                  <SelectItem value="all">🌟 All Sources</SelectItem>
                  <SelectItem value="cases">⚖️ Cases & Judgments</SelectItem>
                  <SelectItem value="supreme_court">🏛️ Supreme Court</SelectItem>
                  <SelectItem value="high_courts">🏢 High Courts</SelectItem>
                  <SelectItem value="news">📰 Legal News</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.doctypes} onValueChange={(value) => setFilters({ ...filters, doctypes: value })}>
                <SelectTrigger className="w-52 bg-white/90 backdrop-blur-sm text-foreground border-white/40 indian-card h-12">
                  <SelectValue placeholder="🏛️ Court type" />
                </SelectTrigger>
                <SelectContent className="indian-card">
                  <SelectItem value="all">🌟 All Courts</SelectItem>
                  <SelectItem value="supremecourt">👑 Supreme Court</SelectItem>
                  <SelectItem value="delhi">🏛️ Delhi High Court</SelectItem>
                  <SelectItem value="bombay">🌊 Bombay High Court</SelectItem>
                  <SelectItem value="kolkata">🏛️ Kolkata High Court</SelectItem>
                  <SelectItem value="chennai">🏛️ Madras High Court</SelectItem>
                  <SelectItem value="tribunals">⚖️ Tribunals</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="📅 From date"
                value={filters.fromdate}
                onChange={(e) => setFilters({ ...filters, fromdate: e.target.value })}
                className="w-44 bg-white/90 backdrop-blur-sm text-foreground border-white/40 indian-card h-12"
              />

              <Input
                type="date"
                placeholder="📅 To date"
                value={filters.todate}
                onChange={(e) => setFilters({ ...filters, todate: e.target.value })}
                className="w-44 bg-white/90 backdrop-blur-sm text-foreground border-white/40 indian-card h-12"
              />
            </div>

            {/* Hidden inline consultation section */}
            <Card className="mt-2 border-4 border-primary/30 shadow-2xl bg-gradient-to-br from-primary/5 via-white to-secondary/5 indian-card hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-full shadow-lg">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-primary sanskrit-style">
                        🗣️ Tell me about your case • अपने मामले के बारे में बताएं
                      </h3>
                      <p className="text-muted-foreground text-lg">
                        Enter your case details below to get a quick consultation and key keywords.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleConsult}
                    disabled={consultLoading || !(caseDetails.trim() || query.trim())}
                    className="bg-white text-primary hover:bg-white/90 shadow-2xl px-6 py-3 h-auto text-lg font-bold indian-hover"
                  >
                    {consultLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        <span className="sanskrit-style">Fetching consultation...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        <span className="sanskrit-style">Get Consultation</span>
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <label htmlFor="case-details" className="sr-only">
                    Describe your case
                  </label>
                  <Textarea
                    id="case-details"
                    placeholder="Describe your case (facts, parties involved, dates, orders, relief sought)…"
                    value={caseDetails}
                    onChange={(e) => setCaseDetails(e.target.value)}
                    className="min-h-32"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Tip: If you leave this blank, we’ll use the main search query instead.
                  </p>
                </div>

                {consultError && (
                  <Alert className="mb-4 border-destructive/50 bg-destructive/5 indian-card">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="text-base">{consultError}</AlertDescription>
                  </Alert>
                )}

                {consultation && (consultation.consultation || consultation.keyword) && (
                  <div className="space-y-6">
                    {consultation.consultation && (
                      <div className="bg-white rounded-xl p-6 shadow-inner border-4 border-primary/20 indian-card lotus-pattern">
                        <h4 className="font-bold text-primary text-xl mb-3 sanskrit-style">📋 Consultation</h4>
                        <div className="prose max-w-none">
                          <pre className="whitespace-pre-wrap text-base leading-relaxed text-foreground bg-gradient-to-br from-muted/50 to-primary/5 p-4 rounded-lg border-2 border-primary/10 sanskrit-style">
                            {consultation.consultation}
                          </pre>
                        </div>
                      </div>
                    )}

                    {"keyword" in consultation && consultation.keyword !== undefined && (
                      <div className="bg-white rounded-xl p-6 shadow-inner border-4 border-primary/20 indian-card peacock-pattern">
                        <h4 className="font-bold text-primary text-xl mb-3 sanskrit-style">🔑 Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            const kw = Array.isArray(consultation.keyword)
                              ? consultation.keyword
                              : typeof consultation.keyword === "string"
                                ? consultation.keyword
                                    .split(/[,\n]/)
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                : []
                            return kw.length > 0 ? (
                              kw.map((k, idx) => (
                                <Badge key={idx} variant="secondary" className="text-sm">
                                  {k}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">No keywords returned.</span>
                            )
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!consultation && !consultLoading && !consultError && (
                  <p className="text-muted-foreground text-base">
                    Enter your query above and click “Get Consultation” to see a brief case guidance and keywords.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 peacock-pattern">
        {results && (
          <div className="space-y-8">
            <Card className="border-l-8 border-l-primary shadow-2xl indian-card indian-hover">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/5">
                <CardTitle className="flex items-center gap-3 text-primary text-xl">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="sanskrit-style">Search Results for "{results.query}"</span>
                  <Star className="h-5 w-5 text-yellow-500" />
                </CardTitle>
                <CardDescription className="text-lg">
                  🕐 Search completed at {new Date(results.timestamp).toLocaleString()} • 📊 Type: {results.search_type}{" "}
                  •<span className="sanskrit-style">सफल खोज</span>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-4 border-primary/30 shadow-2xl indian-card peacock-pattern">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-full shadow-lg">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-primary sanskrit-style">
                        🧠 AI Legal Analysis • कृत्रिम बुद्धि विश्लेषण
                      </h3>
                      <p className="text-muted-foreground text-lg">
                        <Sparkles className="h-4 w-4 inline mr-1" />
                        Get intelligent insights powered by advanced AI • बुद्धिमान विश्लेषण प्राप्त करें
                      </p>
                    </div>
                  </div>
                  {/* Right side: our new link button above the existing analyze button */}
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-2xl px-8 py-4 h-auto text-lg font-bold indian-hover pulse-saffron"
                      size="lg"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin mr-3" />
                          <span className="sanskrit-style">विश्लेषण कर रहे हैं... • Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-6 w-6 mr-3" />
                          <span className="sanskrit-style">🚀 Generate AI Analysis • विश्लेषण करें</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              {analysis && (
                <CardContent className="p-8">
                  {analysis.error ? (
                    <Alert className="border-destructive/50 bg-destructive/5 indian-card">
                      <AlertCircle className="h-5 w-5" />
                      <AlertDescription className="text-lg">{analysis.error}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="bg-white rounded-xl p-8 shadow-inner border-4 border-primary/20 indian-card lotus-pattern">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-full">
                          <Brain className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="font-bold text-primary text-xl sanskrit-style">
                          🎯 AI Analysis Results • विश्लेषण परिणाम
                        </h4>
                        <div className="flex gap-1">
                          <Star className="h-5 w-5 text-yellow-500" />
                          <Star className="h-5 w-5 text-yellow-500" />
                          <Star className="h-5 w-5 text-yellow-500" />
                        </div>
                      </div>
                      <ScrollArea className="h-96">
                        <div className="prose prose-lg max-w-none">
                          <pre className="whitespace-pre-wrap text-base leading-relaxed text-foreground bg-gradient-to-br from-muted/50 to-primary/5 p-6 rounded-lg border-2 border-primary/10 sanskrit-style">
                            {analysis.analysis}
                          </pre>
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            <Tabs defaultValue="supreme_court" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-primary/10 to-secondary/10 p-2 rounded-xl shadow-lg h-16">
                
                <TabsTrigger
                  value="supreme_court"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-secondary/80 data-[state=active]:text-white h-12 rounded-lg font-semibold indian-hover"
                >
                  <Gavel className="h-5 w-5" />
                  <span className="sanskrit-style">👑 Supreme Court</span>
                </TabsTrigger>
                <TabsTrigger
                  value="ecourts"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-accent/80 data-[state=active]:text-white h-12 rounded-lg font-semibold indian-hover"
                >
                  <Building className="h-5 w-5" />
                  <span className="sanskrit-style">🏛️ eCourts</span>
                </TabsTrigger>
                <TabsTrigger
                  value="legal_news"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white h-12 rounded-lg font-semibold indian-hover"
                >
                  <FileText className="h-5 w-5" />
                  <span className="sanskrit-style">📰 Legal News</span>
                </TabsTrigger>
                <TabsTrigger
                  value="indian_kanoon"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white h-12 rounded-lg font-semibold indian-hover"
                >
                  <Scale className="h-5 w-5" />
                  <span className="sanskrit-style">⚖️ Indian Kanoon</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="indian_kanoon" className="mt-8">
                <Card className="border-l-8 border-l-primary shadow-2xl indian-card indian-hover">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 lotus-pattern">
                    <CardTitle className="text-primary text-xl sanskrit-style flex items-center gap-2">
                      <Scale className="h-6 w-6" />
                      ⚖️ Indian Kanoon Database • भारतीय कानून डेटाबेस
                    </CardTitle>
                    <CardDescription className="text-lg">
                      📚 Comprehensive database of Indian legal judgments and cases •
                      <span className="sanskrit-style ml-2">व्यापक न्यायिक डेटाबेस</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-8">
                    {renderSearchResults("indian_kanoon", results.sources.indian_kanoon)}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="supreme_court" className="mt-8">
                <Card className="border-l-8 border-l-secondary shadow-2xl indian-card indian-hover">
                  <CardHeader className="bg-gradient-to-r from-secondary/10 to-secondary/5 peacock-pattern">
                    <CardTitle className="text-secondary text-xl sanskrit-style flex items-center gap-2">
                      <Gavel className="h-6 w-6" />👑 Supreme Court of India • भारत का सर्वोच्च न्यायालय
                    </CardTitle>
                    <CardDescription className="text-lg">
                      🏛️ Latest judgments and orders from the Supreme Court •
                      <span className="sanskrit-style ml-2">नवीनतम निर्णय और आदेश</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-8">
                    {renderSearchResults("supreme_court", results.sources.supreme_court)}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ecourts" className="mt-8">
                <Card className="border-l-8 border-l-accent shadow-2xl indian-card indian-hover">
                  <CardHeader className="bg-gradient-to-r from-accent/10 to-accent/5 mandala-pattern">
                    <CardTitle className="text-accent text-xl sanskrit-style flex items-center gap-2">
                      <Building className="h-6 w-6" />
                      🏛️ eCourts Platform • ई-कोर्ट प्लेटफॉरम
                    </CardTitle>
                    <CardDescription className="text-lg">
                      🏢 High Courts and District Courts across India •
                      <span className="sanskrit-style ml-2">उच्च न्यायालय और जिला न्यायालय</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-8">{renderSearchResults("ecourts", results.sources.ecourts)}</CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="legal_news" className="mt-8">
                <Card className="border-l-8 border-l-primary shadow-2xl indian-card indian-hover">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 lotus-pattern">
                    <CardTitle className="text-primary text-xl sanskrit-style flex items-center gap-2">
                      <FileText className="h-6 w-6" />📰 Legal News & Updates • कानूनी समाचार और अपडेट
                    </CardTitle>
                    <CardDescription className="text-lg">
                      📈 Recent legal developments and news from trusted sources •
                      <span className="sanskrit-style ml-2">विश्वसनीय स्रोतों से समाचार</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-8">
                    {renderSearchResults("legal_news", results.sources.legal_news)}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {!results && !loading && (
          <div className="text-center py-20 lotus-pattern">
            <div className="bg-gradient-to-br from-primary/20 via-white to-secondary/20 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8 shadow-2xl indian-card ashoka-wheel">
              <Scale className="h-16 w-16 text-primary" />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-primary sanskrit-style devanagari-accent">
              🙏 Welcome to Indian Legal Research Portal
            </h2>
            <h3 className="text-2xl font-semibold mb-6 hindi-accent">भारतीय न्यायिक अनुसंधान पोर्टल में आपका स्वागत है</h3>
            <p className="text-muted-foreground mb-16 max-w-4xl mx-auto text-xl leading-relaxed sanskrit-style">
              🇮🇳 Search across comprehensive Indian legal databases including Supreme Court judgments, High Court cases,
              district court records, and the latest legal news. Get AI-powered analysis of your search results with our
              advanced legal intelligence system. • <span className="hindi-accent">सत्यमेव जयते</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
              <Card className="border-4 border-primary/30 hover:border-primary/60 transition-all shadow-2xl hover:shadow-3xl indian-card indian-hover lotus-pattern">
                <CardHeader className="text-center">
                  <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Scale className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-2xl text-primary sanskrit-style">⚖️ Indian Kanoon</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    📚 Access millions of Indian legal documents and judgments from all courts •
                    <span className="sanskrit-style block mt-2 text-primary/70">लाखों न्यायिक दस्तावेज</span>
                  </p>
                </CardContent>
              </Card>
              <Card className="border-4 border-secondary/30 hover:border-secondary/60 transition-all shadow-2xl hover:shadow-3xl indian-card indian-hover peacock-pattern">
                <CardHeader className="text-center">
                  <div className="bg-gradient-to-br from-secondary/20 to-secondary/10 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Gavel className="h-10 w-10 text-secondary" />
                  </div>
                  <CardTitle className="text-2xl text-secondary sanskrit-style">🏛️ Court Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    👑 Search Supreme Court, High Courts, and District Courts across India •
                    <span className="sanskrit-style block mt-2 text-secondary/70">सभी न्यायालयों की खोज</span>
                  </p>
                </CardContent>
              </Card>
              <Card className="border-4 border-accent/30 hover:border-accent/60 transition-all shadow-2xl hover:shadow-3xl indian-card indian-hover mandala-pattern">
                <CardHeader className="text-center">
                  <div className="bg-gradient-to-br from-accent/20 to-accent/10 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Brain className="h-10 w-10 text-accent" />
                  </div>
                  <CardTitle className="text-2xl text-accent sanskrit-style">🧠 AI Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    🚀 Get intelligent insights and comprehensive summaries of legal research •
                    <span className="sanskrit-style block mt-2 text-accent/70">बुद्धिमान विश्लेषण प्राप्त करें</span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <footer className="saffron-gradient text-white mt-20 shadow-2xl">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="ashoka-wheel">
                <Flag className="h-8 w-8" />
              </div>
              <Scale className="h-8 w-8" />
              <div className="ashoka-wheel" style={{ animationDirection: "reverse" }}>
                <Crown className="h-8 w-8" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-3 sanskrit-style devanagari-accent">भारतीय न्यायिक अनुसंधान पोर्टल</h3>
            <p className="text-2xl mb-3 font-semibold">Indian Legal Research Portal</p>
            <p className="text-white/90 text-xl mb-6">
              🏛️ Comprehensive legal database search • Built for legal professionals and researchers
            </p>
            <div className="mt-8 text-lg text-white/80">
              <p className="sanskrit-style">
                🇮🇳 Serving the Indian legal community with advanced AI-powered research tools •
                <span className="block mt-2 text-xl hindi-accent" style={{ WebkitTextFillColor: "white" }}>
                  सत्यमेव जयते • न्याय सेवा • Legal Excellence
                </span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
