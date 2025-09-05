
"use client";
import IndianLegalSearchApp from "@/components/indian-legal-search-app"


export default function Page() {
  return <IndianLegalSearchApp/>
}

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

  const API_BASE_URL = "https://aravsaxena884-legal-search.hf.space" // Update this to your API URL

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setResults(null)
    setAnalysis(null)

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
      })
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




import IndianLegalSearchApp from "@/components/indian-legal-search-app"


export default function Page() {
  return <IndianLegalSearchApp/>
}