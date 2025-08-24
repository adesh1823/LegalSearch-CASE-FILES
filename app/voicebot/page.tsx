"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react"
import {
  useVoiceAssistant,
  BarVisualizer,
  VoiceAssistantControlBar,
  useTrackTranscription,
  useLocalParticipant,
} from "@livekit/components-react"
import { Track } from "livekit-client"
import "@livekit/components-styles"

// Message component for chat display with subtle Indian theme
const Message: React.FC<{ type: "agent" | "user"; text: string }> = ({ type, text }) => {
  return (
    <div className="flex items-start space-x-3 mb-4">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
          type === "agent" ? "bg-orange-500" : "bg-green-600"
        }`}
      >
        {type === "agent" ? "⚖️" : "👤"}
      </div>
      <div
        className={`flex-1 p-3 rounded-lg ${
          type === "agent" ? "bg-orange-50 border-l-4 border-orange-500" : "bg-green-50 border-l-4 border-green-600"
        }`}
      >
        <p className="text-gray-800 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

// Voice Assistant Component with clean design
const VoiceAssistantInterface: React.FC = () => {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant()
  const localParticipant = useLocalParticipant()
  const { segments: userTranscriptions } = useTrackTranscription({
    publication: localParticipant.microphoneTrack,
    source: Track.Source.Microphone,
    participant: localParticipant.localParticipant,
  })

  const [messages, setMessages] = useState<
    Array<{ id?: string; text: string; type: "agent" | "user"; firstReceivedTime: number }>
  >([])

  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const allMessages = [
      ...(agentTranscriptions?.map((t) => ({ ...t, type: "agent" as const })) ?? []),
      ...(userTranscriptions?.map((t) => ({ ...t, type: "user" as const })) ?? []),
    ].sort((a, b) => a.firstReceivedTime - b.firstReceivedTime)
    setMessages(allMessages)
  }, [agentTranscriptions, userTranscriptions])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-green-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">⚖️ Legal Voice Assistant</h2>
            <p className="text-orange-100 mt-1">Professional Legal Guidance</p>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              state === "listening"
                ? "bg-green-500"
                : state === "thinking"
                  ? "bg-yellow-500"
                  : state === "speaking"
                    ? "bg-orange-500"
                    : "bg-gray-500"
            }`}
          >
            {state === "listening"
              ? "🎤 Listening"
              : state === "thinking"
                ? "🤔 Thinking"
                : state === "speaking"
                  ? "🗣️ Speaking"
                  : "✅ Ready"}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 border-b">
        <div className="flex justify-center items-center">
          <div className="w-full max-w-md">
            <BarVisualizer state={state} barCount={12} trackRef={audioTrack} className="h-16" />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-gray-50 px-6 py-4 border-b">
        <VoiceAssistantControlBar />
        <p className="text-sm text-gray-600 mt-2 text-center">
          <span className="font-semibold">⚠️ Disclaimer:</span> This provides general legal information only, not legal
          advice. Consult a qualified attorney for specific legal matters.
        </p>
      </div>

      <div ref={chatContainerRef} className="h-96 overflow-y-auto p-6 bg-white">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">⚖️</span>
            </div>
            <p className="text-xl font-semibold mb-2">Welcome to Legal Voice Assistant</p>
            <p className="text-sm mt-2">
              🗣️ Ask any legal question to get started. I can help with contract law, employment issues, family law, and
              more.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <Message key={msg.id || index} type={msg.type} text={msg.text} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const LegalAssistantPage: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  const connectToAgent = useCallback(async () => {
    setIsConnecting(true)
    try {
      const userName = `user-${Math.random().toString(36).substring(7)}`
      const response = await fetch(
        `https://aravsaxena884-voiceLegal.hf.space/getToken?name=${encodeURIComponent(userName)}`,
      )

      if (!response.ok) {
        throw new Error("Failed to get token")
      }

      const tokenData = await response.text()
      setToken(tokenData)
      setIsConnected(true)
    } catch (error) {
      console.error("Connection error:", error)
      alert("Failed to connect to legal assistant. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnectFromAgent = useCallback(() => {
    setIsConnected(false)
    setToken(null)
  }, [])

  if (isConnected && token) {
    return (
      <div className="min-h-screen bg-gray-50 relative">
        <div className="container mx-auto px-4 py-8">
          <a
            href="/"
            className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </a>

          <LiveKitRoom
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://app-zq7e4mya.livekit.cloud"}
            token={token}
            connect={true}
            video={false}
            audio={true}
            onDisconnected={disconnectFromAgent}
            className="w-full"
          >
            <RoomAudioRenderer />
            <VoiceAssistantInterface />
          </LiveKitRoom>
        </div>
        <div className="absolute top-6 right-6">
          <a href="/" className="text-gray-600 hover:text-orange-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-white to-green-600">
      <main className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="text-white mb-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">⚖️</span>
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-500 bg-clip-text text-transparent drop-shadow-2xl filter brightness-125 saturate-150">
              Legal Voice Assistant
            </h1>
            <h2 className="text-3xl font-semibold mb-2 bg-gradient-to-r from-orange-500 via-orange-300 to-green-600 bg-clip-text text-transparent drop-shadow-xl filter brightness-125">
              कानूनी आवाज सहायक
            </h2>
            <button
            onClick={connectToAgent}
            disabled={isConnecting}
            className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-orange-500 to-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Connecting...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                <span>🗣️ Start Voice Chat</span>
              </span>
            )}
          </button>
            <p className="text-xl text-green-600 mb-4 max-w-2xl mx-auto">
              Get instant access to professional legal information through our AI-powered voice assistant
            </p>
            <p className="text-lg text-green-600 mb-8 max-w-2xl mx-auto">
              हमारे AI-संचालित आवाज सहायक के माध्यम से पेशेवर कानूनी जानकारी तुरंत प्राप्त करें
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/90 rounded-xl p-6 shadow-lg">
              <div className="text-3xl mb-3">⚖️</div>
              <h3 className="text-lg font-semibold mb-2">Contract Law</h3>
              <p className="text-gray-600">Understanding agreements and legal obligations</p>
            </div>
            <div className="bg-white/90 rounded-xl p-6 shadow-lg">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="text-lg font-semibold mb-2">Employment Law</h3>
              <p className="text-gray-600">Workplace rights and labor issues</p>
            </div>
            <div className="bg-white/90 rounded-xl p-6 shadow-lg">
              <div className="text-3xl mb-3">🏠</div>
              <h3 className="text-lg font-semibold mb-2">Family & Property</h3>
              <p className="text-gray-600">Personal and property matters</p>
            </div>
          </div>

          

          <div className="mt-12 p-4 bg-yellow-100/90 rounded-xl border border-yellow-300 text-yellow-800 max-w-2xl mx-auto">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h4 className="font-semibold mb-1">Important Legal Notice</h4>
                <p className="text-sm">
                  This AI assistant provides general legal information only and does not constitute legal advice. For
                  specific legal matters, always consult with a qualified attorney.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LegalAssistantPage
