"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FaTachometerAlt, FaQuestionCircle, FaMicrophone, FaRegFileAudio, FaSignOutAlt, FaImage } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { name: 'Dashboard', href: '/', icon: FaTachometerAlt },
  { name: 'Q&A / Lipsync', href: '/qa', icon: FaQuestionCircle },
  { name: 'Text to Speech', href: '/tts-page', icon: FaMicrophone },
  { name: 'Speech to Text', href: '/stt', icon: FaRegFileAudio },
  { name: 'Image Captioning', href: '/captioning', icon: FaImage },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();
  
  // Don't show layout on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700">
          AI Toolkit
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <link.icon className="h-5 w-5" />
              <span>{link.name}</span>
            </Link>
          ))}
        </nav>
        <div className="px-4 py-6 border-t border-gray-700">
           <button
             onClick={() => logout()}
             className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-300 hover:bg-red-700 hover:text-white"
           >
             <FaSignOutAlt className="h-5 w-5" />
             <span>Logout</span>
           </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 