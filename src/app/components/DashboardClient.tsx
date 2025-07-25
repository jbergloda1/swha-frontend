"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { FaQuestionCircle, FaMicrophone, FaRegFileAudio, FaSignOutAlt, FaImage } from "react-icons/fa";
import React from "react";

export default function DashboardClient({ systemInfo, modelsInfo }: {
  systemInfo: {
    cpu_percent: number;
    cpu_count: number;
    ram_total: number;
    ram_used: number;
    ram_percent: number;
    load_avg: number[];
    os: string;
    os_version: string;
    hostname: string;
  } | null,
  modelsInfo: {
    lipsync: {
      supported_models: string[];
      active_jobs: number;
      job_count_by_model: Record<string, number>;
    };
    tts: {
      supported_models: string[];
    };
  } | null
}) {
  const { isAuthenticated, logout, loading: authLoading } = useAuth();
  const router = useRouter();

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
    },
    {
      title: "Table Detection",
      description: "Detect tables in images and visualize the result.",
      href: "/table-detect",
      icon: FaRegFileAudio, // You can replace with a more suitable icon
      color: "from-yellow-500 to-orange-600"
    },
    {
      title: "Image Captioning",
      description: "Generate captions for images using AI.",
      href: "/captioning",
      icon: FaImage,
      color: "from-orange-500 to-yellow-500"
    }
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Features */}
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
        {/* System Info */}
        {systemInfo && (
          <div className="mb-8 bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-xl font-bold mb-2 text-blue-300">System Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-200">
              <div>CPU: {systemInfo.cpu_percent}% ({systemInfo.cpu_count} cores)</div>
              <div>RAM: {((systemInfo.ram_used / 1024 / 1024 / 1024).toFixed(2))}GB / {((systemInfo.ram_total / 1024 / 1024 / 1024).toFixed(2))}GB ({systemInfo.ram_percent}%)</div>
              <div>Load Avg: {systemInfo.load_avg?.join(", ")}</div>
              <div>OS: {systemInfo.os} ({systemInfo.os_version})</div>
              <div>Hostname: {systemInfo.hostname}</div>
            </div>
          </div>
        )}
        {/* Models Info */}
        {modelsInfo && (
          <div className="mb-8 bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-xl font-bold mb-2 text-green-300">Models Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-200">
              <div>
                <span className="font-semibold">Lipsync Models:</span> {modelsInfo.lipsync?.supported_models?.join(", ")}
              </div>
              <div>
                <span className="font-semibold">TTS Models:</span> {modelsInfo.tts?.supported_models?.join(", ")}
              </div>
              <div>
                <span className="font-semibold">Lipsync Active Jobs:</span> {modelsInfo.lipsync?.active_jobs}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 