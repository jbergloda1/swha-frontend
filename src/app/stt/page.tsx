"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { transcribeAudioFile, transcribeAudioUrl } from "../api/stt";
import { FaUpload, FaLink, FaTimes, FaCopy, FaMicrophone } from "react-icons/fa";
import { useAuth } from "@/app/context/AuthContext";

interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  processing_time_ms?: number;
  buffer_size?: number;
}

interface PartialTranscriptionResult {
  text: string;
  language?: string;
  processing_time_ms?: number;
  buffer_size?: number;
  timestamp?: number;
  debug_info?: string;
  is_final?: boolean;
}

export default function SpeechToTextPage() {
  const { token: authToken } = useAuth();
  const searchParams = useSearchParams();
  const [audioUrl, setAudioUrl] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [partialResult, setPartialResult] = useState<PartialTranscriptionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"file" | "live">("file");
  const [isRecording, setIsRecording] = useState(false);
  const [socketReady, setSocketReady] = useState(false);

  const socket = useRef<WebSocket | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Kết nối WebSocket khi vào trang
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const envWsUrl = process.env.NEXT_PUBLIC_STT_WS_URL;
    const baseWsUrl = envWsUrl || `${protocol}//${window.location.host}/api/v1/stt/ws/transcribe`;
    if (!authToken) {
      setError("Authentication token not found. Please log in.");
      setLoading(false);
      return;
    }
    const wsUrl = `${baseWsUrl}?token=${authToken}`;
    socket.current = new WebSocket(wsUrl);
    
    socket.current.onopen = () => {
      console.log('🔌 WebSocket connected');
      // Không set socketReady ngay, đợi message 'connected' từ server
    };
    
    socket.current.onmessage = (event) => {
      console.log('📨 Received message from server:', event.data);
      
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Parsed message:', data);
        
        // Connection ready - theo protocol mới
        if (data.type === 'connected') {
          console.log('✅ Server ready confirmation:', data);
          setSocketReady(true);
        }
        
        // Recording started confirmation
        else if (data.type === 'recording_started') {
          console.log('🎙️ Recording started confirmation');
        }
        
        // Chunk acknowledgment từ server
        else if (data.type === 'chunk_received') {
          console.log(`📦 Chunk ack: ${data.chunk_size} bytes, total: ${data.total_size}`);
        }
        
        // Real-time partial transcription
        else if (data.type === 'partial_transcription') {
          console.log('📝 Partial transcription:', data);
          
          // Cập nhật partial result với đầy đủ thông tin
          setPartialResult({
            text: data.text || "",
            language: data.language,
            processing_time_ms: data.processing_time_ms,
            buffer_size: data.buffer_size,
            timestamp: data.timestamp,
            debug_info: data.debug_info,
            is_final: data.is_final
          });
          
          // Nếu có debug info, log ra
          if (data.debug_info) {
            console.log('🔧 Debug info:', data.debug_info);
          }
        }
        
        // Final session complete
        else if (data.type === 'session_complete') {
          console.log('🎯 Session complete:', data.full_text);
          setResult({
            text: data.full_text || "",
            language: data.language || "unknown",
            duration: data.duration || 0,
            processing_time_ms: data.processing_time_ms,
            buffer_size: data.buffer_size
          });
          setPartialResult(null);
          setIsRecording(false);
          setLoading(false);
        }
        
        // Error từ server
        else if (data.error) {
          console.error('❌ Server error:', data.error);
          setError(`Server error: ${data.error}`);
          setPartialResult("");
          setIsRecording(false);
          setLoading(false);
        }
        
        // Backward compatibility - legacy message format
        else if (data.status === 'connected') {
          console.log('✅ Legacy server ready:', data.message);
          setSocketReady(true);
        }
        else if (data.text !== undefined && !data.type) {
          console.log('📝 Legacy transcription result:', data.text);
          setResult(data);
          setPartialResult("");
          setIsRecording(false);
          setLoading(false);
        }
        
        // Log unhandled messages
        else {
          console.log('ℹ️ Unhandled message type:', data);
        }
        
      } catch (e) {
        console.log('📨 Non-JSON message from server:', event.data);
        // Server có thể gửi text message không phải JSON
      }
    };
    
    socket.current.onerror = (err) => {
      console.error('❌ WebSocket error:', err);
      setError("WebSocket connection error. Please try again.");
      setSocketReady(false);
    };
    
    socket.current.onclose = (event) => {
      console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason}`);
      setSocketReady(false);
      setIsRecording(false);
      setLoading(false);
      setPartialResult("");
      
      // Handle specific close codes theo tài liệu
      if (event.code === 4001) {
        setError('❌ Missing or invalid token');
      } else if (event.code === 4003) {
        setError('❌ Authentication failed');
      }
      
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((track) => track.stop());
      }
    };
    
    // Cleanup khi rời trang
    return () => {
      if (socket.current) {
        socket.current.close();
      }
      if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
        mediaRecorder.current.stop();
      }
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [authToken]);

  useEffect(() => {
    const urlFromQuery = searchParams.get("audioUrl");
    if (urlFromQuery) {
      setAudioUrl(urlFromQuery);
      setFileName(urlFromQuery);
    }
  }, [searchParams]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setAudioUrl(""); // Clear URL input if file is selected
      setFileName(file.name);
      setError("");
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAudioUrl(e.target.value);
    setAudioFile(null); // Clear file input if URL is entered
    setFileName(e.target.value);
    setError("");
  };
  
  const handleClearInput = () => {
    setAudioFile(null);
    setAudioUrl("");
    setFileName("");
    setError("");
    setResult(null);
  }

  const handleTranscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile && !audioUrl) {
      setError("Please upload a file or provide an audio URL.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      let data;
      if (audioFile) {
        data = await transcribeAudioFile(audioFile);
      } else {
        data = await transcribeAudioUrl(audioUrl);
      }
      setResult(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Transcription failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setPartialResult(null); // Clear previous partial results
    
    try {
      mediaStream.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      if (!socketReady || !socket.current || socket.current.readyState !== WebSocket.OPEN) {
        setError("WebSocket is not ready. Please try again.");
        setLoading(false);
        return;
      }
      
      // Bắt đầu recording session
      socket.current.send('start_recording');
      console.log("📡 Sent start_recording signal");
      
      setIsRecording(true);
      setLoading(false);
      
      mediaRecorder.current = new MediaRecorder(mediaStream.current, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0 && socket.current?.readyState === WebSocket.OPEN) {
          console.log("About to send audio chunk", {
            size: event.data.size,
            readyState: socket.current?.readyState,
            socketOpen: socket.current?.readyState === WebSocket.OPEN
          });
          
          // Convert Blob to ArrayBuffer và gửi liên tục
          event.data.arrayBuffer().then(buffer => {
            try {
              if (socket.current?.readyState === WebSocket.OPEN) {
                socket.current.send(buffer);
                console.log("Audio chunk sent successfully");
              }
            } catch (err) {
              console.error("Failed to send audio chunk", err);
            }
          });
        }
      };
      
      mediaRecorder.current.onstop = () => {
        // Kết thúc recording session
        if (socket.current?.readyState === WebSocket.OPEN) {
          socket.current.send('stop_recording');
          console.log("📡 Sent stop_recording signal");
        }
      };
      
      mediaRecorder.current.start(100); // Emit chunk every 100ms
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to start recording: ${errorMessage}`);
      setLoading(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
    setLoading(false);
  };

  const handleCopy = () => {
    if(result?.text){
      navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 text-center">Speech to Text</h1>
        <p className="text-gray-600 mb-6 text-center">
          Transcribe audio from a file, a URL, or live from your microphone.
        </p>

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => {
                setMode("file");
                setError("");
                setResult(null);
              }}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                mode === "file"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              File & URL
            </button>
            <button
              onClick={() => {
                setMode("live");
                setAudioFile(null);
                setAudioUrl("");
                setFileName("");
                setError("");
                setResult(null);
              }}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                mode === "live"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Live Recording
            </button>
          </nav>
        </div>

        {mode === "file" && (
          <form onSubmit={handleTranscribe} className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <span>Upload a file</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="audio/*" />
              </label>
              <p className="pl-1">or provide a URL</p>

              {fileName && (
                <div className="mt-4 flex items-center justify-center bg-gray-100 p-2 rounded-md text-sm text-gray-700">
                  <span className="truncate">{fileName}</span>
                  <button type="button" onClick={handleClearInput} className="ml-2 text-gray-500 hover:text-gray-700">
                    <FaTimes />
                  </button>
                </div>
              )}

              {!audioFile && (
                <div className="mt-4 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLink className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="https://example.com/audio.wav"
                    value={audioUrl}
                    onChange={handleUrlChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              )}
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

            <div>
              <button
                type="submit"
                disabled={loading || (!audioFile && !audioUrl)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Transcribing..." : "Transcribe Audio"}
              </button>
            </div>
          </form>
        )}

        {mode === "live" && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FaMicrophone className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">Click the button below to start recording from your microphone.</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

            <div>
              <button
                type="button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={loading}
                className={`w-full text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                  isRecording
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? "Initializing..." : isRecording ? "Stop Recording" : "Start Recording"}
              </button>
            </div>
          </div>
        )}

        {partialResult && isRecording && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-yellow-700 mb-2">Live Transcription</h2>
            <div className="bg-white p-4 rounded-md border">
              {partialResult.text ? (
                <p className="text-gray-800 whitespace-pre-wrap">{partialResult.text}</p>
              ) : (
                <p className="text-gray-500 italic">
                  {partialResult.debug_info || "Listening for speech..."}
                </p>
              )}
              
              <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  Recording...
                </div>
                <div className="text-xs space-x-2">
                  {partialResult.language && (
                    <span>Lang: {partialResult.language}</span>
                  )}
                  {partialResult.processing_time_ms && (
                    <span>Time: {partialResult.processing_time_ms.toFixed(0)}ms</span>
                  )}
                  {partialResult.buffer_size && (
                    <span>Buffer: {partialResult.buffer_size}b</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-blue-700 mb-2">Final Transcription Result</h2>
            <div className="relative bg-white p-4 rounded-md border">
              <p className="text-gray-800 whitespace-pre-wrap">{result.text}</p>
              <button onClick={handleCopy} className="absolute top-2 right-2 text-gray-500 hover:text-blue-600">
                {copied ? "Copied!" : <FaCopy />}
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-600 space-x-4">
              <span>Language: {result.language}</span>
              {result.duration && (
                <span>Duration: {result.duration.toFixed(2)}s</span>
              )}
              {result.processing_time_ms && (
                <span>Processing: {result.processing_time_ms.toFixed(0)}ms</span>
              )}
              {result.buffer_size && (
                <span>Buffer: {result.buffer_size}b</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 