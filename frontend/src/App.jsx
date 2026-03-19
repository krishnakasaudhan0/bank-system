import React, { useState, useEffect, useRef } from 'react';
import './index.css';

const API_BASE = 'http://localhost:3001/api';

const SERVICES = [
  { id: 'CHECK_BALANCE', label: 'Check Balance', icon: '💰' },
  { id: 'MINI_STATEMENT', label: 'Mini Statement', icon: '📄' },
  { id: 'BLOCK_CARD', label: 'Block Card', icon: '🚫' },
  { id: 'UPDATE_CONTACT', label: 'Update Contact', icon: '📱' },
  { id: 'LOAN_ENQUIRY', label: 'Loan Enquiry', icon: '📊' },
  { id: 'ESCALATE_AGENT', label: 'Talk to Agent', icon: '📞' }
];

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [modalState, setModalState] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [otpError, setOtpError] = useState('');
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const headers = { 
    'Content-Type': 'application/json',
    'x-session-id': sessionId
  };

  const startSession = async () => {
    setModalState('processing');
    try {
      const res = await fetch(`${API_BASE}/session/start`, { method: 'POST' });
      const data = await res.json();
      setSessionId(data.sessionId);
      setMessages([{ sender: 'bot', text: 'Welcome to Smart Banking Assistant. How may I assist you today?' }]);
      setScreen('dashboard');
    } catch (e) {
      console.error(e);
      alert('Failed to connect to backend.');
    } finally {
      setModalState(null);
    }
  };

  const endSession = async () => {
    try {
      if (sessionId) await fetch(`${API_BASE}/session/end`, { method: 'POST', headers });
    } catch (e) { console.error(e); }
    setSessionId(null);
    setScreen('welcome');
    setMessages([]);
    setModalState(null);
    setResultData(null);
  };

  const sendMessage = async (text, hideFromUI = false) => {
    if (!text.trim()) return;
    
    if (!hideFromUI) {
      setMessages(prev => [...prev, { sender: 'user', text }]);
    }
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/conversation/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { sender: 'bot', text: data.text }]);
        
        if (data.action) {
          handleAction(data.action);
        }
      }, 1000); // Simulate network delay
      
    } catch (e) {
      setIsTyping(false);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I encountered a connection issue.' }]);
    }
  };

  const handleAction = (action) => {
    if (action === 'ESCALATE_AGENT') {
      setModalState('escalated');
    } else if (action === 'LOAN_ENQUIRY') {
      executeAction(action);
    } else {
      setPendingAction(action);
      startOtpFlow();
    }
  };

  const triggerService = (service) => {
    // Kiosk acts as direct input: bypass chatbot intent API entirely
    setMessages(prev => [...prev, { sender: 'user', text: `Selected: ${service.label}` }]);
    handleAction(service.id);
  };

  const startOtpFlow = async () => {
    setModalState('processing');
    try {
      await fetch(`${API_BASE}/auth/request-otp`, { method: 'POST', headers });
      setOtpError('');
      setModalState('otp');
    } catch (e) {
      setModalState(null);
      alert('Failed to request OTP');
    }
  };

  const verifyOtp = async (otp) => {
    if (otp.length !== 6) return;
    setModalState('processing');
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ otp })
      });
      if (res.ok) {
        executeAction(pendingAction);
      } else {
        const data = await res.json();
        setOtpError(data.error || 'Invalid OTP');
        setModalState('otp');
      }
    } catch (e) {
      setOtpError('Error verifying OTP');
      setModalState('otp');
    }
  };

  const executeAction = async (action) => {
    setModalState('processing');
    try {
      let endpoint = '';
      let body = {};
      
      switch (action) {
        case 'CHECK_BALANCE': endpoint = '/banking/balance'; break;
        case 'MINI_STATEMENT': endpoint = '/banking/mini-statement'; break;
        case 'BLOCK_CARD': endpoint = '/banking/block-card'; break;
        case 'UPDATE_CONTACT': 
          endpoint = '/banking/update-contact'; 
          body = { newPhone: '+91-9999999999' }; 
          break;
        case 'LOAN_ENQUIRY': endpoint = '/banking/loan-enquiry'; break;
        default: return;
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers,
        body: Object.keys(body).length ? JSON.stringify(body) : undefined
      });
      
      const data = await res.json();
      setResultData(data);
      setModalState('result');
      
      setMessages(prev => [...prev, { sender: 'bot', text: data.message }]);
      
    } catch (e) {
      alert('Error processing action');
      setModalState(null);
    }
  };

  const closeOverlay = () => {
    setModalState(null);
    setResultData(null);
    setPendingAction(null);
  };

  return (
    <div className="kiosk-wrapper">
      <header className="kiosk-header">
        <div className="brand">
          <h1>GLOBAL STANDARD BANK</h1>
          <span className="subtitle">Self-Service Kiosk</span>
        </div>
      </header>

      <main className="kiosk-body">
        {screen === 'welcome' && (
          <div className="welcome-screen">
            <h2>Welcome to Your Digital Bank</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-light)', marginBottom: '40px' }}>
              Experience fast, secure, and smart self-service banking.
            </p>
            <button className="btn btn-primary" style={{ padding: '20px 48px', fontSize: '1.5rem' }} onClick={startSession}>
              START SESSION
            </button>
          </div>
        )}

        {screen === 'dashboard' && (
          <div className="dashboard-layout">
            <div className="left-panel">
              <h3 className="section-title">Select Service</h3>
              <div className="services-grid">
                {SERVICES.map(svc => (
                  <div key={svc.id} className="service-card" onClick={() => triggerService(svc)}>
                    <div className="service-icon">{svc.icon}</div>
                    <div className="service-label">{svc.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="right-panel">
              <div className="chat-header">
                🤖 AI Banking Assistant
              </div>
              <div className="chat-history">
                {messages.map((m, i) => (
                  <div key={i} className={`chat-bubble ${m.sender === 'bot' ? 'bot-msg' : 'user-msg'}`}>
                    {m.text}
                  </div>
                ))}
                {isTyping && (
                  <div className="typing-indicator">Assistant is typing...</div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-input-area">
                <input 
                  className="chat-input" 
                  type="text" 
                  placeholder="Type your request here..." 
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage(inputValue)}
                />
                <button className="send-btn" onClick={() => sendMessage(inputValue)}>
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {screen === 'dashboard' && (
        <footer className="kiosk-footer">
          <button className="btn btn-outline" onClick={endSession}>
            End Session
          </button>
        </footer>
      )}

      {modalState === 'processing' && (
        <div className="full-overlay">
          <div className="spinner"></div>
          <h2>Processing your request...</h2>
        </div>
      )}

      {modalState === 'otp' && (
        <div className="full-overlay">
          <div className="modal-card">
            <h2 className="modal-title">Verification Required</h2>
            <p className="modal-desc">Please enter the 6-digit OTP sent to your registered mobile number.</p>
            <input 
              type="text" 
              className="otp-input" 
              maxLength={6} 
              id="otpInput"
              autoFocus
            />
            {otpError && <p style={{ color: 'var(--primary-red)', marginBottom: '16px' }}>{otpError}</p>}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={closeOverlay}>Cancel</button>
              <button className="btn btn-primary" onClick={() => verifyOtp(document.getElementById('otpInput').value)}>
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {modalState === 'result' && resultData && (
        <div className="full-overlay">
          <div className="modal-card" style={{ maxWidth: '800px' }}>
            <div className="result-msg">{resultData.message}</div>
            
            <div className="result-content">
              {resultData.balance && <p><strong>Available Balance:</strong> ₹{resultData.balance.toLocaleString('en-IN')}</p>}
              
              {resultData.transactions && (
                <div>
                  <strong>Recent Transactions:</strong>
                  <ul style={{ listStyle: 'none', padding: 0, marginTop: '12px' }}>
                    {resultData.transactions.map((t, idx) => (
                      <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-border)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{t.date} - {t.description}</span>
                        <strong style={{ color: t.amount < 0 ? 'var(--primary-red)' : '#059669' }}>
                          ₹{Math.abs(t.amount).toLocaleString('en-IN')} {t.amount < 0 ? 'DR' : 'CR'}
                        </strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {resultData.eligibleAmount && (
                <div>
                  <p><strong>Eligible Amount:</strong> {resultData.eligibleAmount}</p>
                  <p><strong>Interest Rate:</strong> {resultData.interestRate}</p>
                </div>
              )}
            </div>

            <div className="quick-actions">
              <button className="btn btn-outline" onClick={closeOverlay}>Done</button>
              {pendingAction === 'CHECK_BALANCE' && (
                <button className="btn btn-primary" onClick={() => { closeOverlay(); sendMessage('Mini Statement'); }}>
                  View Statement
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {modalState === 'escalated' && (
        <div className="full-overlay">
          <div className="modal-card">
            <h2 className="modal-title">Connecting to Agent</h2>
            <div className="spinner"></div>
            <p className="modal-desc">Connecting to Alice... (Estimated wait: 2 minutes)</p>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Securely transferring session context.</p>
            <div style={{ marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={endSession}>End Call & Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
