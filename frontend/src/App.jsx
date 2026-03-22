import React, { useState, useEffect, useRef } from 'react';
import './index.css';

const API_BASE = 'http://localhost:3001/api';

const SERVICES = [
  { 
    id: 'CHECK_BALANCE', 
    label: 'Balance & Statement', 
    desc: 'Check balance, mini stmt', 
    type: 'b', 
    icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
  },
  { 
    id: 'MINI_STATEMENT', 
    label: 'Fund Transfer', 
    desc: 'NEFT · RTGS · IMPS · UPI', 
    type: 'r', 
    icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg> 
  },
  { 
    id: 'BLOCK_CARD', 
    label: 'Card Services', 
    desc: 'Block · PIN · Limit change', 
    type: 'r', 
    icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg> 
  },
  { 
    id: 'UPDATE_CONTACT', 
    label: 'New Account', 
    desc: 'Open savings / current', 
    type: 'b', 
    icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg> 
  },
  { 
    id: 'LOAN_ENQUIRY', 
    label: 'Loans & Apply', 
    desc: 'Home · Personal · Gold', 
    type: 'b', 
    icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> 
  },
  { 
    id: 'ESCALATE_AGENT', 
    label: 'Support & FAQs', 
    desc: 'Raise complaint · Track', 
    type: 'r', 
    icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg> 
  }
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
      setMessages([{ sender: 'bot', text: 'Namaste! Welcome to Union Bank. How can I assist you today?' }]);
      setScreen('dashboard');
    } catch (e) {
      console.error(e);
      // Fallback for demo without backend
      setSessionId('demo-session-id');
      setMessages([{ sender: 'bot', text: 'Namaste! Welcome to Union Bank. How can I assist you today?' }]);
      setScreen('dashboard');
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
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I encountered a connection issue.' }]);
      }, 1000);
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
    handleAction(service.id);
  };

  const startOtpFlow = async () => {
    setModalState('processing');
    try {
      await fetch(`${API_BASE}/auth/request-otp`, { method: 'POST', headers });
      setOtpError('');
      setModalState('otp');
    } catch (e) {
      // Fallback for demo
      setOtpError('');
      setModalState('otp');
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
      // Fallback for demo: assume OTP 123456 is valid
      if(otp === '123456') {
         executeAction(pendingAction);
      } else {
         setOtpError('Invalid OTP (Hint: use 123456)');
         setModalState('otp');
      }
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
      
    } catch (e) {
      // Fallback for demo
      setResultData({
        message: "Action processed successfully (Demo mode)",
        balance: 184320,
        transactions: [
          {date: "15 Mar 2026", description: "NEFT", amount: -12500},
          {date: "14 Mar 2026", description: "UPI Credit", amount: 8000}
        ]
      });
      setModalState('result');
    }
  };

  const closeOverlay = () => {
    setModalState(null);
    setResultData(null);
    setPendingAction(null);
  };

  if(screen === 'welcome') {
    return (
      <div className="scene">
        
        {/* PREMIUM BRANDED SPLASH SCREEN */}
        <div className="welcome-scene" onClick={startSession}>
          <div className="welcome-content">
            <svg viewBox="0 0 32 32" fill="none" className="welcome-logo" style={{width: 120, height: 120}}>
              <rect width="32" height="32" rx="5" fill="white"/>
              <path d="M5 7 L5 20 Q5 26 11 26 Q17 26 17 20 L17 7" stroke="#DA251C" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <path d="M17 7 L17 26 M17 7 L25 26 M25 7 L25 26" stroke="#00579C" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="welcome-logo-text">
              <div className="welcome-logo-main">Union Bank</div>
              <div className="welcome-logo-sub">OF INDIA</div>
            </div>
            <div className="welcome-subtitle">Digital Self-Service Kiosk</div>
            <button className="welcome-btn" onClick={(e) => { e.stopPropagation(); startSession(); }}>
              TOUCH TO BEGIN
            </button>
          </div>
        </div>
        
        {/* Bottom bezel full width */}
        <div className="bezel-bottom">
          <span className="bezel-txt">Union Bank AI Kiosk v2.1 · Branch: Connaught Place, New Delhi</span>
          <div className="bezel-right">
            <span className="bezel-txt">RBI Compliant · PCI-DSS Certified</span>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <div className="status-dot"></div>
              <span className="bezel-txt" style={{color:'#22c55e'}}>Online</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scene">
      <div className="screen">

        {/* LEFT: Brand + AI Voice */}
        <div className="left-panel">
          <div className="logo-bar">
            <svg viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="5" fill="white"/>
              <path d="M5 7 L5 20 Q5 26 11 26 Q17 26 17 20 L17 7" stroke="#DA251C" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <path d="M17 7 L17 26 M17 7 L25 26 M25 7 L25 26" stroke="#00579C" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="logo-name">
              <div className="logo-name-main">Union Bank</div>
              <div className="logo-name-sub">OF INDIA</div>
            </div>
          </div>
          <span className="slogan-badge"><span className="slogan-txt">Good People To Bank With</span></span>

          <div className="avatar-block">
            <div className="avatar-circle">
              <svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
            </div>
            <div>
              <div className="avatar-name">Aria — AI Assistant</div>
              <div className="avatar-role">Union Bank · Powered by Gen-AI</div>
            </div>
          </div>

          <div className="wave-col">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
          <div className="listening-txt">{isTyping ? 'Assistant is processing...' : 'Listening… speak or touch a service'}</div>

          <div className="ai-bubble">
            <div className="ai-bubble-history">
              {messages.map((m, i) => (
                <div key={i} className={m.sender === 'bot' ? 'ai-msg-bot' : 'ai-msg-user'}>
                  {m.sender === 'bot' && <strong>Aria</strong>} 
                  {m.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-input-area">
              <input 
                className="chat-input" 
                type="text" 
                placeholder="Type here..." 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(inputValue)}
              />
              <button className="send-btn" onClick={() => sendMessage(inputValue)}>Send</button>
            </div>
          </div>

          <div className="lang-chips">
            <span className="lc lc-on">EN</span>
            <span className="lc lc-off">हि</span>
            <span className="lc lc-off">मर</span>
            <span className="lc lc-off">தமிழ்</span>
            <span className="lc lc-off">తె</span>
          </div>
        </div>

        {/* CENTRE: Services (Right-aligned now since 3rd col is removed) */}
        <div className="centre-panel">
          <div className="centre-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="centre-greeting">What can we help you with?</div>
              <div className="centre-sub">Touch a service, speak your request, or insert your card to begin</div>
            </div>
            <button className="btn btn-outline" style={{ borderColor: '#DA251C', color: '#DA251C', backgroundColor: '#fff' }} onClick={endSession}>
               End Session
            </button>
          </div>
          <div className="divider"></div>

          <div className="svc-grid">
            {SERVICES.map(svc => (
              <div key={svc.id} className={`svc-card ${svc.type}`} onClick={() => triggerService(svc)}>
                {svc.icon}
                <div className="svc-card-name">{svc.label}</div>
                <div className="svc-card-desc">{svc.desc}</div>
              </div>
            ))}
          </div>


        </div>

      </div>{/* /screen */}

      {/* Bottom bezel full width */}
      <div className="bezel-bottom">
        <span className="bezel-txt">Union Bank AI Kiosk v2.1 · Branch: Connaught Place, New Delhi</span>
        <div className="bezel-right">
          <span className="bezel-txt">RBI Compliant · PCI-DSS Certified · ISO 27001</span>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <div className="status-dot"></div>
            <span className="bezel-txt" style={{color:'#22c55e'}}>Online</span>
          </div>
        </div>
      </div>

      {/* OVERLAYS */}
      {modalState === 'processing' && (
        <div className="full-overlay">
          <div className="spinner"></div>
          <h2 className="modal-title" style={{fontSize: '24px'}}>Processing your request...</h2>
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
            {otpError && <p style={{ color: '#DA251C', margin: '0 0 24px 0', fontWeight: 'bold' }}>{otpError}</p>}
            <div className="quick-actions">
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
          <div className="modal-card" style={{ maxWidth: '700px' }}>
            <div className="result-msg">{resultData.message || 'Success'}</div>
            
            <div className="result-content">
              {resultData.balance && <p><strong>Available Balance:</strong> ₹{resultData.balance.toLocaleString('en-IN')}</p>}
              
              {resultData.transactions && (
                <div style={{marginTop: '16px'}}>
                  <strong>Recent Transactions:</strong>
                  <ul style={{ listStyle: 'none', padding: 0, marginTop: '12px' }}>
                    {resultData.transactions.map((t, idx) => (
                      <li key={idx} style={{ padding: '12px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{t.date} - {t.description}</span>
                        <strong style={{ color: t.amount < 0 ? '#DA251C' : '#059669' }}>
                          ₹{Math.abs(t.amount).toLocaleString('en-IN')} {t.amount < 0 ? 'DR' : 'CR'}
                        </strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {resultData.eligibleAmount && (
                <div style={{marginTop: '16px'}}>
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
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Securely transferring session context.</p>
            <div className="quick-actions">
              <button className="btn btn-outline" onClick={closeOverlay}>Cancel</button>
              <button className="btn btn-primary" onClick={endSession}>End Call & Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
