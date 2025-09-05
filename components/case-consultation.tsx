"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type ConsultationResponse = {
  consultation?: string
  keyword?: string | string[]
  [key: string]: unknown
}

export default function CaseConsultation() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ConsultationResponse | null>(null)

  async function handleConsult() {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/legal-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Request failed with ${res.status}`)
      }
      const data: ConsultationResponse = await res.json()
      setResult(data)
    } catch (e: any) {
      setError(e?.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const keywords: string[] = Array.isArray(result?.keyword)
    ? (result?.keyword as string[])
    : result?.keyword
      ? String(result?.keyword)
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean)
      : []

  return (
    <Card className="container mx-auto px-4 mt-8 mb-6 indian-card">
      <CardHeader>
        <CardTitle className="text-pretty">Tell me about your case</CardTitle>
        <CardDescription>Enter your case details to get a consultation and key legal keywords.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <label htmlFor="case-details" className="sr-only">
          Describe your case
        </label>
        <Textarea
          id="case-details"
          placeholder="Describe your case (facts, parties, dates, orders, relief sought)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-32"
        />
        <div className="flex items-center gap-3">
          <Button onClick={handleConsult} disabled={loading || !query.trim()}>
            {loading ? "Analyzing..." : "Get consultation"}
          </Button>
          <span className="text-sm text-muted-foreground">Calls your backend and shows consultation + keywords.</span>
        </div>

        {error && (
          <div role="alert" className="text-sm text-red-600">
            {error}
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="font-medium mb-1">Consultation</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {result.consultation || "No consultation returned."}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Keywords</h3>
              {keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((k, i) => (
                    <Badge key={`${k}-${i}`} variant="secondary">
                      {k}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No keywords returned.</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
