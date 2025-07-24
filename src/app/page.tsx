"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { FaQuestionCircle, FaMicrophone, FaRegFileAudio, FaSignOutAlt } from "react-icons/fa";

export default function DashboardPage() {
  const { isAuthenticated, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const features = [
    {
      title: "Q&A and Lipsync",
      description: "Ask questions, get answers, and generate a lipsync video from the result.",
      href: "/qa",
      icon: FaQuestionCircle,
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "Text-to-Speech",
      description: "Convert any text into natural-sounding speech with various voices and languages.",
      href: "/tts-page",
      icon: FaMicrophone,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "Speech-to-Text",
      description: "Transcribe audio files or URLs into text with high accuracy.",
      href: "/stt",
      icon: FaRegFileAudio,
      color: "from-green-500 to-teal-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="flex justify-between items-center p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">AI Tools Dashboard</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </header>
      <main className="p-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold mb-2">Welcome to Your AI Toolkit</h2>
          <p className="text-gray-400">Select a tool below to get started.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Link href={feature.href} key={index}>
              <div className={`group relative p-8 rounded-lg bg-gradient-to-r ${feature.color} transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-black/50 cursor-pointer`}>
                 <div className="absolute inset-0 bg-black opacity-20 group-hover:opacity-10 transition-opacity duration-300"></div>
                 <div className="relative">
                   <feature.icon className="h-12 w-12 mb-4 text-white opacity-80" />
                   <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                   <p className="text-gray-200">{feature.description}</p>
                 </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
