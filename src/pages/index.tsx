'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { speakText } from '../utils/tts';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Moon, Sun, Mic, Send, Volume2, VolumeX } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const chatAnimationPath = '/assets/chat.json';
const micAnimationPath = '/assets/mic.json';

export default function Home() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ type: 'user' | 'bot'; text: string | JSX.Element }[]>([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  const SpeechRecognition =
    typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMessages([{ type: 'bot', text: 'Hello! How can I assist you today?' }]);
    }
  }, []);

  const sendMessage = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) event.preventDefault();

    if (!message.trim()) {
      toast.warn('Please enter a message before sending!');
      return;
    }

    setLoading(true);
    setMessages((prev) => [...prev, { type: 'user', text: message }]);
    setMessage('');
    setMessages((prev) => [...prev, { type: 'bot', text: '...' }]);

    try {
      const res = await axios.post('/api/chat', { user_message: message });
      const botResponse = res.data.response;
      const formattedResponse = botResponse.includes('```') ? (
        <SyntaxHighlighter language="javascript" style={atomDark}>
          {botResponse.replace(/```/g, '')}
        </SyntaxHighlighter>
      ) : (
        botResponse
      );

      setMessages((prev) => [...prev.slice(0, -1), { type: 'bot', text: formattedResponse }]);
      if (!isMuted) speakText(botResponse);
    } catch (error) {
      console.error('Chatbot error:', error);
      toast.error('Error communicating with chatbot.');
      setMessages((prev) => [...prev.slice(0, -1), { type: 'bot', text: '⚠️ Chatbot is not responding. Try again.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => responseRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const startListening = () => {
    if (!recognition) {
      toast.error('Speech recognition is not supported in this browser.');
      return;
    }

    setIsListening(true);
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <div className={`min-h-screen flex flex-col items-center transition-all ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}> 
      <ToastContainer position='top-right' autoClose={3000} />
      
      {/* Header */}
      <div className='w-full px-4 py-3 flex justify-between items-center bg-white dark:bg-gray-800 shadow-md fixed top-0 z-10 max-w-5xl mx-auto'>
        <h1 className='text-xl md:text-2xl lg:text-3xl font-bold text-blue-600 dark:text-yellow-400 flex items-center'>
          AI Voice Chat
        </h1>
        <div className='flex space-x-2 md:space-x-3'>
          <button onClick={() => setIsMuted(!isMuted)} className='p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'>
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className='p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className='flex-1 w-full max-w-5xl mt-16 px-4 pb-24 flex flex-col space-y-2 overflow-y-auto'>
        {messages.map((msg, index) => (
          <div key={index} className={`p-3 md:p-4 rounded-xl max-w-[90%] md:max-w-md shadow-md ${msg.type === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white self-start'}`}> 
            {msg.text}
          </div>
        ))}
        <div ref={responseRef} />
      </div>

      {/* Input Section */}
      <div className='fixed bottom-0 w-full max-w-5xl bg-white dark:bg-gray-800 p-3 shadow-lg flex items-center space-x-2 md:space-x-3 px-4'>
        <button onClick={startListening} className={`p-3 rounded-full shadow-lg ${isListening ? 'bg-red-600' : 'bg-green-600'} text-white hover:opacity-75`}>
          <Mic size={20} />
        </button>
        
        <textarea 
          className='flex-1 border border-gray-300 dark:border-gray-600 p-2 md:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white' 
          value={message} 
          onChange={(e) => setMessage(e.target.value)}
          placeholder='Type your message...' 
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(e as any)} 
        />
        
        <button onClick={sendMessage} className='bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700' disabled={loading}> 
          <Send size={20} /> 
        </button>
      </div>
    </div>
  );
}
