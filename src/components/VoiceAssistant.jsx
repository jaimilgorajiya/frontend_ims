import React, { useEffect, useState, useRef, useCallback } from "react";
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

const VoiceAssistant = () => {
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const abortTimeoutRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const speechQueueRef = useRef([]);
  const voicesLoadedRef = useRef(false);

  // Available commands mapping
  const commands = {
    dashboard: { path: "/", label: "Dashboard" },
    home: { path: "/", label: "Home" },
    "stock in": { path: "/stock-in", label: "Stock In" },
    "stock out": { path: "/stock-out", label: "Stock Out" },
    records: { path: "/records", label: "View Records" },
    "view records": { path: "/records", label: "View Records" },
    reports: { path: "/reports/stock-in", label: "Reports" },
    "stock in report": { path: "/reports/stock-in", label: "Stock In Reports" },
    "stock in reports": { path: "/reports/stock-in", label: "Stock In Reports" },
    "stock out report": { path: "/reports/stock-out", label: "Stock Out Reports" },
    "stock out reports": { path: "/reports/stock-out", label: "Stock Out Reports" },
    logout: { path: null, action: "logout", label: "Logout" },
    "log out": { path: null, action: "logout", label: "Logout" },
    help: { path: null, action: "help", label: "Help" },
  };

  // Initialize speech synthesis and wait for voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    const synth = window.speechSynthesis;
    
    // Load voices
    const loadVoices = () => {
      try {
        const voices = synth.getVoices();
        if (voices.length > 0) {
          voicesLoadedRef.current = true;
        }
      } catch (err) {
        console.warn("Could not load voices:", err);
      }
    };

    // Some browsers load voices asynchronously
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }

    synthRef.current = synth;

    return () => {
      try {
        if (synthRef.current) {
          synthRef.current.cancel();
        }
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  // Process speech queue
  const processSpeechQueue = useCallback(() => {
    if (!synthRef.current || isSpeakingRef.current || speechQueueRef.current.length === 0) {
      return;
    }

    const { text } = speechQueueRef.current.shift();
    isSpeakingRef.current = true;

    try {
      const synth = window.speechSynthesis;
      
      // Check if synthesis is available
      if (!synth) {
        console.warn("Speech synthesis not available");
        isSpeakingRef.current = false;
        processSpeechQueue(); // Process next in queue
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      // Set up event handlers
      utterance.onstart = () => {
        isSpeakingRef.current = true;
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        // Process next item in queue
        setTimeout(() => processSpeechQueue(), 100);
      };

      utterance.onerror = (event) => {
        isSpeakingRef.current = false;
        
        // Handle specific error types
        let errorMessage = "Speech synthesis error";
        if (event.error) {
          switch (event.error) {
            case 'network':
              errorMessage = "Network error during speech";
              break;
            case 'synthesis-failed':
              errorMessage = "Speech synthesis failed";
              break;
            case 'synthesis-unavailable':
              errorMessage = "Speech synthesis unavailable";
              break;
            case 'audio-busy':
              errorMessage = "Audio system busy";
              break;
            case 'not-allowed':
              errorMessage = "Speech synthesis not allowed";
              break;
            case 'interrupted':
            case 'canceled':
              // Speech was interrupted (e.g. by cancel() or new speech), this is expected.
              return;
            default:
              errorMessage = `Speech error: ${event.error}`;
          }
        }
        
        // Only log errors, don't show to user unless critical
        console.warn(errorMessage, event);
        
        // Process next item in queue
        setTimeout(() => processSpeechQueue(), 100);
      };

      // Speak the utterance
      synth.speak(utterance);
      
    } catch (error) {
      console.warn("Text-to-speech error:", error);
      isSpeakingRef.current = false;
      // Process next item in queue
      setTimeout(() => processSpeechQueue(), 100);
    }
  }, []);

  // Text-to-speech helper
  const speak = useCallback((text, priority = false) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn("Speech synthesis not supported");
      return;
    }

    // If priority, cancel current speech and clear queue
    if (priority) {
      try {
        if (synthRef.current) {
          synthRef.current.cancel();
        }
        speechQueueRef.current = [];
        isSpeakingRef.current = false;
      } catch {
        // Ignore cancellation errors
      }
    }

    // Add to queue (priority items go to front)
    if (priority) {
      speechQueueRef.current.unshift({ text, priority });
    } else {
      speechQueueRef.current.push({ text, priority });
    }

    // Process queue if not already speaking
    if (!isSpeakingRef.current) {
      processSpeechQueue();
    }
  }, [processSpeechQueue]);

  // Handle command execution
  const handleCommand = useCallback((command) => {
    const normalizedCommand = command.toLowerCase().trim();
    
    // Theme switching commands (light/dark mode)
    const wantsLight = /\b(light\s*(mode|theme)|enable\s*light|switch\s*to\s*light|make\s*it\s*light)\b/.test(normalizedCommand);
    const wantsDark = /\b(dark\s*(mode|theme)|enable\s*dark|switch\s*to\s*dark|make\s*it\s*dark)\b/.test(normalizedCommand);

    if (wantsLight || wantsDark) {
      const next = wantsLight ? 'light' : 'dark';
      try {
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', next);
        }
        localStorage.setItem('theme', next);
        // Notify app to sync state
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          const evt = new CustomEvent('app-theme-change', { detail: { theme: next } });
          window.dispatchEvent(evt);
        }
        speak(`Switching to ${next} mode.`, true);
        setMessage(`🌓 Theme set to ${next}.`);
      } catch {
        // ignore
      }
      return;
    }
    
    // Find matching command
    // Sort by key length (longest first) to match more specific commands first
    // e.g., "stock out report" should match before "stock out"
    const sortedCommands = Object.entries(commands).sort((a, b) => b[0].length - a[0].length);
    
    let matchedCommand = null;
    
    for (const [key, value] of sortedCommands) {
      if (normalizedCommand.includes(key)) {
        matchedCommand = value;
        break;
      }
    }

    if (matchedCommand) {
      // Handle actions
      if (matchedCommand.action === "logout") {
        handleLogout();
        return;
      }
      
      if (matchedCommand.action === "help") {
        showHelpCommands();
        return;
      }

      // Navigate if path exists
      if (matchedCommand.path) {
        // Don't navigate if already on that page
        if (location.pathname === matchedCommand.path) {
          speak(`You're already on the ${matchedCommand.label} page.`);
          setMessage(`📍 Already on ${matchedCommand.label}`);
          return;
        }
        
        navigate(matchedCommand.path);
        speak(`Navigating to ${matchedCommand.label}.`);
        setMessage(`✅ Navigated to ${matchedCommand.label}`);
      }
    } else {
      speak("Sorry, I didn't recognize that command. Say 'help' to see available commands.", true);
      setMessage(`❓ Unknown command: "${command}"`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, location.pathname, speak]);

  // Show help commands
  const showHelpCommands = useCallback(() => {
    const helpText = [
      "Available commands:",
      "Dashboard or Home",
      "Stock In",
      "Stock Out",
      "Records",
      "Reports",
      "Stock In Report",
      "Stock Out Report",
      "Logout",
      "Minimize or Expand",
      "And Help"
    ].join(", ");
    
    speak(helpText, true);
    setMessage("💡 Available commands displayed. Check the history.");
  }, [speak]);

  // Handle logout
  const handleLogout = useCallback(() => {
    speak("Logging you out...", true);
    
    try {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      navigate("/login");
      setMessage("✅ Logged out successfully.");
      setTimeout(() => speak("You have been logged out.", true), 500);
    } catch (error) {
      console.error("Logout error:", error);
      speak("There was an error logging out. Please try again.");
      setMessage("❌ Logout error occurred.");
    }
  }, [navigate, speak]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage("❌ Voice recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setMessage(" Listening...");
      speak("I'm listening, please say your command.", true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(`🗣 You said: "${transcript}"`);
      handleCommand(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Recognition error:", event.error);
      
      let errorMessage = "An error occurred.";
      switch (event.error) {
        case "no-speech":
          errorMessage = "No speech detected. Please try again.";
          break;
        case "aborted":
          return; // User manually stopped, don't show error
        case "audio-capture":
          errorMessage = "Microphone not found. Please check your microphone.";
          break;
        case "network":
          errorMessage = "Network error. Please check your connection.";
          break;
        case "not-allowed":
          errorMessage = "Microphone permission denied. Please allow microphone access.";
          break;
        default:
          errorMessage = `Error: ${event.error}`;
      }
      
      setMessage(errorMessage);
      setListening(false);
      if (event.error !== "aborted") {
        speak(errorMessage, true);
      }
    };

    recognition.onend = () => {
      setListening(false);
      setMessage("Click the mic to speak again.");
    };

    recognitionRef.current = recognition;

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore abort errors during cleanup
        }
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (abortTimeoutRef.current) {
        clearTimeout(abortTimeoutRef.current);
      }
    };
  }, [handleCommand, speak]);

  // Start recognition
  const startRecognition = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (listening) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch {
        // Ignore errors
      }
      setListening(false);
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error("Failed to start recognition:", error);
      setMessage("⚠️ Could not start voice recognition. Please try again.");
    }
  }, [listening]);

  // Keyboard shortcut support (Ctrl/Cmd + Shift + V)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "V") {
        e.preventDefault();
        startRecognition();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [startRecognition]);

  // Auto-stop recognition after timeout
  useEffect(() => {
    if (listening) {
      abortTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && listening) {
          try {
            recognitionRef.current.stop();
          } catch {
            // Ignore errors
          }
        }
      }, 10000); // 10 second timeout
    }

    return () => {
      if (abortTimeoutRef.current) {
        clearTimeout(abortTimeoutRef.current);
      }
    };
  }, [listening]);

  // Don't render on auth pages 
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);
  
  if (isAuthPage) {
    return null;
  }

  return (
    <>
      {/* Grid Overlay Background */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 999,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          opacity: 0.5,
        }}
      />

      {/* Abstract Pattern Effect (Top-Left) */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "400px",
          height: "400px",
          pointerEvents: "none",
          zIndex: 998,
          background: `
            radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 60% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 50%)
          `,
          filter: "blur(40px)",
          opacity: 0.6,
        }}
      />

      <AnimatePresence>
        {/* Fixed Position Container */}
        <div
          style={{
            position: "fixed",
            // Compact, non-intrusive placement in the lower-right corner
            bottom: "80px",
            right: "32px",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Message Display - Pill Shape with Mic Icon - Positioned Above Button */}
          <AnimatePresence>
            {message && message !== "Click the mic to speak again." && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                  mass: 0.8,
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{
                  position: "absolute",
                  bottom: "100px",
                  backgroundColor: "rgba(30, 30, 30, 0.9)",
                  color: "#fff",
                  borderRadius: "50px",
                  padding: "10px 20px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  whiteSpace: "nowrap",
                }}
                onClick={() => {}}
              >
                {/* Small White Microphone Icon */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 14C13.1 14 14 13.1 14 12V6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6V12C10 13.1 10.9 14 12 14Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M17 12C17 14.8 14.8 17 12 17C9.2 17 7 14.8 7 12H5C5 15.9 8.1 19 12 19C15.9 19 19 15.9 19 12H17Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M12 20C12.6 20 13 20.4 13 21V22C13 22.6 12.6 23 12 23C11.4 23 11 22.6 11 22V21C11 20.4 11.4 20 12 20Z"
                    fill="#ffffff"
                  />
                </svg>
                <span>{message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Mic Button - Fixed Position */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              mass: 0.5,
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
                {/* Pulsing Blue Rings - Outer Layer */}
                {listening && (
                  <>
                    <motion.div
                      animate={{
                        scale: [1, 1.6, 1],
                        opacity: [0.7, 0, 0.7],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: [0.4, 0, 0.2, 1],
                        times: [0, 0.5, 1],
                      }}
                      style={{
                        position: "absolute",
                        width: "90px",
                        height: "90px",
                        borderRadius: "50%",
                        border: "3px solid rgba(135, 206, 250, 0.8)",
                        boxShadow: "0 0 20px rgba(135, 206, 250, 0.6), 0 0 40px rgba(135, 206, 250, 0.4)",
                        pointerEvents: "none",
                      }}
                    />
                    <motion.div
                      animate={{
                        scale: [1, 2.2, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        delay: 0.3,
                        ease: [0.4, 0, 0.2, 1],
                        times: [0, 0.5, 1],
                      }}
                      style={{
                        position: "absolute",
                        width: "90px",
                        height: "90px",
                        borderRadius: "50%",
                        border: "3px solid rgba(135, 206, 250, 0.6)",
                        boxShadow: "0 0 30px rgba(135, 206, 250, 0.5), 0 0 60px rgba(135, 206, 250, 0.3)",
                        pointerEvents: "none",
                      }}
                    />
                  </>
                )}

            {/* White Circle Button */}
            <motion.button
              onClick={startRecognition}
              animate={{
                scale: listening ? [1, 1.03, 1] : 1,
                boxShadow: listening
                  ? "0 0 30px rgba(135, 206, 250, 0.5), 0 0 60px rgba(135, 206, 250, 0.3), inset 0 0 20px rgba(135, 206, 250, 0.2)"
                  : "0 4px 20px rgba(0, 0, 0, 0.3)",
              }}
              transition={{
                scale: {
                  repeat: listening ? Infinity : 0,
                  duration: 2,
                  ease: [0.4, 0, 0.6, 1],
                  times: [0, 0.5, 1],
                },
                boxShadow: {
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                },
              }}
              whileHover={{
                scale: 1.05,
                transition: {
                  duration: 0.2,
                  ease: [0.4, 0, 0.2, 1],
                },
              }}
              whileTap={{
                scale: 0.97,
                transition: {
                  duration: 0.1,
                  ease: [0.4, 0, 0.2, 1],
                },
              }}
              style={{
                backgroundColor: "#ffffff",
                border: "none",
                borderRadius: "50%",
                width: "60px",
                height: "60px",
                cursor: "pointer",
                outline: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                zIndex: 1,
              }}
              title={listening ? "Stop listening (or Ctrl+Shift+V)" : "Start voice command (Ctrl+Shift+V)"}
            >
              {/* Light Blue Microphone Icon */}
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 14C13.1 14 14 13.1 14 12V6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6V12C10 13.1 10.9 14 12 14Z"
                  fill="#14afedff"
                />
                <path
                  d="M17 12C17 14.8 14.8 17 12 17C9.2 17 7 14.8 7 12H5C5 15.9 8.1 19 12 19C15.9 19 19 15.9 19 12H17Z"
                  fill="#14afedff"
                />
                <path
                  d="M12 20C12.6 20 13 20.4 13 21V22C13 22.6 12.6 23 12 23C11.4 23 11 22.6 11 22V21C11 20.4 11.4 20 12 20Z"
                  fill="#14afedff"
                />
              </svg>
            </motion.button>
          </motion.div>
        </div>
      </AnimatePresence>
    </>
  );
};

export default VoiceAssistant;

