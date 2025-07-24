"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from 'next/link';

// ... (Copy all interfaces from the old page.tsx here)
interface QAResponse {
  question: string;
  context: string;
  answer: string;
  confidence: number;
  start_position: number;
  end_position: number;
  is_answerable: boolean;
}

interface Voice {
  id: string;
  name: string;
}

interface Language {
  code: string;
  name: string;
}

interface LipsyncJob {
  job_id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  video_url?: string;
  audio_url?: string;
  output_url?: string;
  created_at?: number;
  completed_at?: number;
  progress?: number;
  error_message?: string;
}


export default function QAPage() {
    // ... (Copy all state management and functions from the old page.tsx here)
    const [context, setContext] = useState("");
    const [question, setQuestion] = useState("");
    const [result, setResult] = useState<QAResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // TTS states
    const [voices, setVoices] = useState<Voice[]>([]);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [selectedVoice, setSelectedVoice] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState("");
    const [speed, setSpeed] = useState(1.0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [ttsLoading, setTtsLoading] = useState(false);
    const [ttsError, setTtsError] = useState("");

    // Lipsync states
    const [lipsyncJob, setLipsyncJob] = useState<LipsyncJob | null>(null);
    const [lipsyncLoading, setLipsyncLoading] = useState(false);
    const [lipsyncError, setLipsyncError] = useState("");
    const [isPolling, setIsPolling] = useState(false);

    const { isAuthenticated, token, logout, loading: authLoading } = useAuth();
    const router = useRouter();

    // Hardcoded values as requested
    const HARDCODED_VIDEO_URL = "https://drive.google.com/file/d/1oJ8xrJJIAYcOSRG8hWAOal6HhKl-RapY/view?usp=drive_link";
    const HARDCODED_API_KEY = "sk-te2wduQ_RSab12A3cSy3LQ.cRZ13R0e1tq-5GAskr7RwuJ0A8Z6IVIG";

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
        router.push("/login");
        }
    }, [isAuthenticated, authLoading, router]);

    // Fetch voices và languages khi component mount
    useEffect(() => {
        if (isAuthenticated && token) {
        fetchVoices();
        fetchLanguages();
        }
    }, [isAuthenticated, token]);

    const fetchVoices = async () => {
        try {
        const response = await fetch("http://localhost:8000/api/v1/tts/voices", {
            headers: {
            "Authorization": `Bearer ${token}`,
            },
        });
        if (response.ok) {
            const data = await response.json();
            console.log("Voices API response:", data);
            
            // Handle actual response structure: { voices: ["af_heart", "af_bella", ...] }
            if (data.voices && Array.isArray(data.voices)) {
            const voicesArray = data.voices.map((voiceId: string) => ({
                id: voiceId,
                name: voiceId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            }));
            setVoices(voicesArray);
            if (voicesArray.length > 0) setSelectedVoice(voicesArray[0].id);
            } else {
            setVoices([]);
            }
        }
        } catch (err) {
        console.error("Failed to fetch voices:", err);
        setVoices([]);
        }
    };

    const fetchLanguages = async () => {
        try {
        const response = await fetch("http://localhost:8000/api/v1/tts/languages", {
            headers: {
            "Authorization": `Bearer ${token}`,
            },
        });
        if (response.ok) {
            const data = await response.json();
            console.log("Languages API response:", data);
            
            // Handle actual response structure: { languages: { "a": "American English 🇺🇸", ... } }
            if (data.languages && typeof data.languages === 'object') {
            const languagesArray = Object.entries(data.languages).map(([code, name]) => ({
                code,
                name: name as string
            }));
            setLanguages(languagesArray);
            if (languagesArray.length > 0) setSelectedLanguage(languagesArray[0].code);
            } else {
            setLanguages([]);
            }
        }
        } catch (err) {
        console.error("Failed to fetch languages:", err);
        setLanguages([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!context.trim() || !question.trim()) {
        setError("Please fill in both context and question");
        return;
        }

        setLoading(true);
        setError("");
        setResult(null);
        setAudioUrl(null);

        try {
        const response = await fetch("http://localhost:8000/api/v1/qa/answer", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
            context: context.trim(),
            question: question.trim(),
            }),
        });

        if (response.status === 401) {
            logout();
            router.push("/login");
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: QAResponse = await response.json();
        setResult(data);
        } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
        setLoading(false);
        }
    };

    const generateTTS = async () => {
        if (!result?.answer) {
        setTtsError("No answer text to convert to speech");
        return;
        }

        setTtsLoading(true);
        setTtsError("");
        setAudioUrl(null);

        try {
        const response = await fetch("http://localhost:8000/api/v1/tts/generate", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
            text: result.answer,
            voice: selectedVoice,
            language_code: selectedLanguage,
            speed: speed,
            split_pattern: "\\n+",
            }),
        });

        if (response.status === 401) {
            logout();
            router.push("/login");
            return;
        }

        if (!response.ok) {
            throw new Error(`TTS generation failed: ${response.status}`);
        }

        const data = await response.json();
        console.log("TTS API response:", data);

        // Handle new response structure
        if (data.audio_files && data.audio_files.length > 0) {
            // Use first presigned URL from audio_files array
            setAudioUrl(data.audio_files[0]);
        } else if (data.audio_segments && data.audio_segments.length > 0) {
            // Fallback to presigned_url from first segment
            setAudioUrl(data.audio_segments[0].presigned_url);
        } else {
            throw new Error("No audio URL found in response");
        }
        } catch (err) {
        setTtsError(err instanceof Error ? err.message : "TTS generation failed");
        } finally {
        setTtsLoading(false);
        }
    };

    const cleanupAudio = async () => {
        try {
        await fetch("http://localhost:8000/api/v1/tts/cleanup", {
            method: "POST",
            headers: {
            "Authorization": `Bearer ${token}`,
            },
        });
        
        // Clear audio URL (no need to revoke presigned URLs)
        setAudioUrl(null);
        } catch (err) {
        console.error("Failed to cleanup audio:", err);
        }
    };

    const createLipsyncJob = async () => {
        if (!audioUrl) {
        setLipsyncError("No audio URL available for lipsync");
        return;
        }

        setLipsyncLoading(true);
        setLipsyncError("");
        setLipsyncJob(null);

        try {
        // Encode parameters for URL
        const params = new URLSearchParams({
            video_url: HARDCODED_VIDEO_URL,
            tts_audio_url: audioUrl,
            api_key: HARDCODED_API_KEY,
        });

        const response = await fetch(`http://localhost:8000/api/v1/lipsync/create-from-tts?${params}`, {
            method: "POST",
            headers: {
            "Authorization": `Bearer ${token}`,
            },
            // No body needed since parameters are in query string
        });

        if (response.status === 401) {
            logout();
            router.push("/login");
            return;
        }

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Lipsync creation error:", errorData);
            throw new Error(`Lipsync creation failed: ${response.status}`);
        }

        const data = await response.json();
        console.log("Lipsync creation response:", data);

        setLipsyncJob({
            job_id: data.job_id,
            status: data.status,
            video_url: data.video_url,
            audio_url: data.audio_url,
            created_at: data.created_at,
        });

        // Start polling for status updates
        startPolling(data.job_id);
        } catch (err) {
        setLipsyncError(err instanceof Error ? err.message : "Lipsync creation failed");
        } finally {
        setLipsyncLoading(false);
        }
    };

    const checkLipsyncStatus = async (jobId: string) => {
        try {
        const response = await fetch(`http://localhost:8000/api/v1/lipsync/status/${jobId}?api_key=${HARDCODED_API_KEY}`, {
            headers: {
            "Authorization": `Bearer ${token}`,
            },
        });

        if (response.status === 401) {
            logout();
            router.push("/login");
            return null;
        }

        if (!response.ok) {
            throw new Error(`Status check failed: ${response.status}`);
        }

        const data = await response.json();
        console.log("Lipsync status response:", data);

        return data;
        } catch (err) {
        console.error("Failed to check lipsync status:", err);
        return null;
        }
    };

    const startPolling = (jobId: string) => {
        setIsPolling(true);
        
        const pollInterval = setInterval(async () => {
        const statusData = await checkLipsyncStatus(jobId);
        
        if (statusData) {
            setLipsyncJob(prev => prev ? {
            ...prev,
            status: statusData.status,
            output_url: statusData.output_url,
            completed_at: statusData.completed_at,
            progress: statusData.progress,
            error_message: statusData.error_message,
            } : null);

            // Stop polling if job is completed or failed
            if (statusData.status === "COMPLETED" || statusData.status === "FAILED") {
            clearInterval(pollInterval);
            setIsPolling(false);
            
            if (statusData.status === "FAILED") {
                setLipsyncError(statusData.error_message || "Lipsync job failed");
            }
            }
        }
        }, 3000); // Poll every 3 seconds

        // Auto-stop polling after 5 minutes to prevent infinite polling
        setTimeout(() => {
        clearInterval(pollInterval);
        setIsPolling(false);
        }, 300000);
    };

    const stopPolling = () => {
        setIsPolling(false);
    };

    const clearForm = () => {
        setContext("");
        setQuestion("");
        setResult(null);
        setError("");
        setTtsError("");
        setLipsyncError("");
        setLipsyncJob(null);
        setIsPolling(false);
        // Clear audio URL (no need to revoke presigned URLs)
        setAudioUrl(null);
    };

    const handleLogout = () => {
        cleanupAudio();
        stopPolling();
        logout();
        router.push("/login");
    };

    if (authLoading) {
        return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
            </div>
        </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    // ... (Copy all JSX from the old page.tsx here, but wrap it in a main content div)
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
            {/* Header với logout button */}
            <div className="flex justify-between items-center mb-8">
            <div className="text-center flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Question & Answer System
                </h1>
                <p className="text-gray-600">
                Enter your context and question to get an AI-powered answer with text-to-speech
                </p>
            </div>
            <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
                Logout
            </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
                    Context
                </label>
                <textarea
                    id="context"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Enter the context or passage that contains the information..."
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={loading}
                />
                </div>

                <div>
                <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                    Question
                </label>
                <input
                    type="text"
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter your question..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                />
                </div>

                {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
                )}

                <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? "Processing..." : "Get Answer"}
                </button>
                <button
                    type="button"
                    onClick={clearForm}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Clear
                </button>
                </div>
            </form>
            </div>

            {result && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>
                
                <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Answer</h3>
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-green-800 font-medium">{result.answer}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Confidence</h3>
                    <div className="bg-gray-50 rounded-md p-2">
                        <p className="text-sm font-mono">
                        {(result.confidence * 100).toFixed(2)}%
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${result.confidence * 100}%` }}
                        ></div>
                        </div>
                    </div>
                    </div>

                    <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Position</h3>
                    <div className="bg-gray-50 rounded-md p-2">
                        <p className="text-sm font-mono">
                        {result.start_position} - {result.end_position}
                        </p>
                    </div>
                    </div>

                    <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Answerable</h3>
                    <div className="bg-gray-50 rounded-md p-2">
                        <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.is_answerable
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                        >
                        {result.is_answerable ? "Yes" : "No"}
                        </span>
                    </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Question</h3>
                    <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm text-gray-800">{result.question}</p>
                    </div>
                </div>
                </div>
            </div>
            )}

            {/* Text-to-Speech Section */}
            {result && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Text-to-Speech</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voice
                    </label>
                    <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={ttsLoading}
                    >
                    {Array.isArray(voices) && voices.length > 0 ? (
                        voices.map((voice) => (
                        <option key={voice.id} value={voice.id}>
                            {voice.name}
                        </option>
                        ))
                    ) : (
                        <option value="">No voices available</option>
                    )}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                    </label>
                    <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={ttsLoading}
                    >
                    {Array.isArray(languages) && languages.length > 0 ? (
                        languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.name}
                        </option>
                        ))
                    ) : (
                        <option value="">No languages available</option>
                    )}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Speed: {speed}x
                    </label>
                    <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={ttsLoading}
                    />
                </div>

                <div className="flex items-end">
                    <button
                    onClick={generateTTS}
                    disabled={ttsLoading || !selectedVoice || !selectedLanguage}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                    {ttsLoading ? "Generating..." : "Generate Audio"}
                    </button>
                </div>
                </div>

                {ttsError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {ttsError}
                </div>
                )}

                {audioUrl && (
                <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-purple-700 mb-2">Audio Generated</h4>
                    <div className="flex items-center gap-4">
                    <audio
                        controls
                        src={audioUrl}
                        className="flex-1"
                        preload="metadata"
                    >
                        Your browser does not support the audio element.
                    </audio>
                    <button
                        onClick={cleanupAudio}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                    >
                        Clear Audio
                    </button>
                    </div>
                </div>
                )}
            </div>
            )}

            {/* Lipsync Section */}
            {audioUrl && (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Lipsync Video</h2>
                
                <div className="space-y-4">
                {!lipsyncJob && (
                    <div className="flex items-center gap-4">
                    <button
                        onClick={createLipsyncJob}
                        disabled={lipsyncLoading || !audioUrl}
                        className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {lipsyncLoading ? "Creating Lipsync..." : "Create Lipsync Video"}
                    </button>
                    <p className="text-sm text-gray-600">
                        Generate a lipsync video using the audio above
                    </p>
                    </div>
                )}

                {lipsyncError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {lipsyncError}
                    </div>
                )}

                {lipsyncJob && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-indigo-700">
                        Lipsync Job: {lipsyncJob.job_id}
                        </h4>
                        <div className="flex items-center gap-2">
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lipsyncJob.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : lipsyncJob.status === "PROCESSING"
                                ? "bg-blue-100 text-blue-800"
                                : lipsyncJob.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                        >
                            {lipsyncJob.status}
                        </span>
                        {isPolling && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        )}
                        </div>
                    </div>

                    {(lipsyncJob.status === "PENDING" || lipsyncJob.status === "PROCESSING") && (
                        <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Processing video...</span>
                            {isPolling && <span>Checking status...</span>}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                                lipsyncJob.status === "PENDING"
                                ? "bg-yellow-400 w-1/4"
                                : "bg-blue-400 w-3/4"
                            }`}
                            ></div>
                        </div>
                        </div>
                    )}

                    {lipsyncJob.status === "COMPLETED" && lipsyncJob.output_url && (
                        <div className="mt-4">
                        <h5 className="text-sm font-medium text-indigo-700 mb-2">
                            Lipsync Video Result
                        </h5>
                        <video
                            controls
                            src={lipsyncJob.output_url}
                            className="w-full max-w-md rounded border"
                            preload="metadata"
                        >
                            Your browser does not support the video element.
                        </video>
                        <div className="mt-2">
                            <a
                            href={lipsyncJob.output_url}
            target="_blank"
            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-sm underline"
                            >
                            Download Video
                            </a>
                        </div>
                        </div>
                    )}

                    {lipsyncJob.status === "FAILED" && (
                        <div className="mt-4 text-sm text-red-600">
                        Lipsync generation failed. Please try again.
                        </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-indigo-200">
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                        <div>
                            <span className="font-medium">Created:</span>{" "}
                            {lipsyncJob.created_at 
                            ? new Date(lipsyncJob.created_at * 1000).toLocaleString()
                            : "N/A"}
                        </div>
                        {lipsyncJob.completed_at && (
                            <div>
                            <span className="font-medium">Completed:</span>{" "}
                            {new Date(lipsyncJob.completed_at * 1000).toLocaleString()}
                            </div>
                        )}
                        </div>
                    </div>
                    </div>
                )}
                </div>
            </div>
            )}
        </div>
        </div>
    );
} 