"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { getVoices, getLanguages, generateTTS } from "../api/tts";

interface Voice {
  id: string;
  name: string;
}
interface Language {
  code: string;
  name: string;
}

export default function TextToSpeechPage() {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [speed, setSpeed] = useState(1.0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getVoices();
        if (data.voices && Array.isArray(data.voices)) {
          const arr = data.voices.map((id: string) => ({
            id,
            name: id.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          }));
          setVoices(arr);
          if (arr.length > 0) setSelectedVoice(arr[0].id);
        }
      } catch {
        setVoices([]);
      }
    })();
    (async () => {
      try {
        const data = await getLanguages();
        if (data.languages && typeof data.languages === "object") {
          const arr = Object.entries(data.languages).map(([code, name]) => ({
            code,
            name: name as string,
          }));
          setLanguages(arr);
          if (arr.length > 0) setSelectedLanguage(arr[0].code);
        }
      } catch {
        setLanguages([]);
      }
    })();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAudioUrl(null);

    if (!text.trim()) {
      setError("Please enter text to synthesize.");
      return;
    }
    setLoading(true);
    try {
      const data = await generateTTS({
        text,
        voice: selectedVoice,
        language_code: selectedLanguage,
        speed,
        split_pattern: "\\n+",
      });
      if (data.audio_files && data.audio_files.length > 0) {
        setAudioUrl(data.audio_files[0]);
      } else if (data.audio_segments && data.audio_segments.length > 0) {
        setAudioUrl(data.audio_segments[0].presigned_url);
      } else {
        setError("No audio file returned from API.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to generate audio.");
      } else {
        setError("Failed to generate audio.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setAudioUrl(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 text-center">Text to Speech</h1>
        <p className="text-gray-600 mb-6 text-center">
          Enter your text, select a voice and language, and generate speech audio.
        </p>
        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label htmlFor="tts-text" className="block text-sm font-medium text-gray-700 mb-1">
              Text
            </label>
            <textarea
              id="tts-text"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Type or paste text here..."
              disabled={loading}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
              <select
                value={selectedVoice}
                onChange={e => setSelectedVoice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {voices.length > 0 ? (
                  voices.map(voice => (
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {languages.length > 0 ? (
                  languages.map(lang => (
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
                onChange={e => setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={loading}
              />
            </div>
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
              {loading ? "Generating..." : "Generate Audio"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear
            </button>
          </div>
        </form>
        {audioUrl && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-blue-700 mb-2">Audio Result</h2>
            <audio controls src={audioUrl} className="w-full" preload="metadata">
              Your browser does not support the audio element.
            </audio>
            <div className="mt-2 flex justify-between items-center">
              <a
                href={audioUrl}
                download="tts-audio.wav"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Download Audio
              </a>
              <Link href={`/stt?audioUrl=${encodeURIComponent(audioUrl)}`} className="bg-green-600 text-white py-1 px-3 rounded-md text-sm hover:bg-green-700 transition-colors">
                  Transcribe this Audio
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 