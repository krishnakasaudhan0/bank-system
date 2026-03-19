import React, { useState, useEffect, useRef } from 'react';
import './index.css';

const API_BASE = 'http://localhost:3001/api';

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [errorText, setErrorText] = useState('');

  const chatEndRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const headers = { 
    'Content-Type': 'application/json',
    'x-session-id': sessionId
  };

  const endSession = async () => {
    try {
      if (sessionId) await fetch(`${API_BASE}/session/end`, { method: 'POST', headers });
    } catch (e) { console.error(e); }
    setSessionId(null);
    setScreen('welcome');
    setMessages([]);
    setPendingAction(null);
    setResultData(null);
    setErrorText('');
  };

  const startSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/session/start`, { method: 'POST' });
      const data = await res.json();
      setSessionId(data.sessionId);
      setScreen('services');
      setErrorText('');
    } catch (e) {
      setErrorText('Failed to start session. Backend might be down.');
    }
  };

  const selectService = async (serviceName) => {
    sendMessage(serviceName);
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const newMsgs = [...messages, { sender: 'user', text }];
    setMessages(newMsgs);
    setInputValue('');

    try {
      const res = await fetch(`${API_BASE}/conversation/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      setMessages([...newMsgs, { sender: 'bot', text: data.text }]);
      
      if (data.action) {
        if (data.action === 'ESCALATE_AGENT') {
          setTimeout(() => setScreen('escalation'), 1500);
        } else if (data.action === 'LOAN_ENQUIRY') {
          setTimeout(() => executeAction(data.action), 1500);
        } else {
          setPendingAction(data.action);
          setTimeout(() => startOtpFlow(), 1500);
        }
      }
    } catch (e) {
      setMessages([...newMsgs, { sender: 'bot', text: 'Sorry, I am having trouble connecting to the system.' }]);
    }
  };

  const startOtpFlow = async () => {
    try {
      await fetch(`${API_BASE}/auth/request-otp`, { method: 'POST', headers });
      setScreen('otp');
      setErrorText('');
    } catch (e) {
      setErrorText('Failed to request OTP');
    }
  };

  const verifyOtp = async (otp) => {
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
        setErrorText(data.error || 'Invalid OTP');
      }
    } catch (e) {
      setErrorText('Error verifying OTP');
    }
  };

  const executeAction = async (action) => {
    try {
      let endpoint = '';
      let body = {};
      
      switch (action) {
        case 'CHECK_BALANCE': endpoint = '/banking/balance'; break;
        case 'MINI_STATEMENT': endpoint = '/banking/mini-statement'; break;
        case 'BLOCK_CARD': endpoint = '/banking/block-card'; break;
        case 'UPDATE_CONTACT': 
          endpoint = '/banking/update-contact'; 
          body = { newPhone: '+1-555-9999' }; // Hardcoded demo value
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
      setScreen('result');
    } catch (e) {
      setErrorText('Error processing action');
    }
  };

  return (
    <div className="kiosk-container">
      <header className="kiosk-header">
        <h1>Global Standard Bank</h1>
      </header>

      <div className="kiosk-content" style={{ display: screen === 'welcome' ? 'flex' : 'none' }}>
        <div className="center-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 className="page-title">Welcome to Self-Service Kiosk</h2>
          {errorText && <p className="error-text">{errorText}</p>}
          <button className="btn btn-primary" onClick={startSession} style={{ padding: '30px 40px', fontSize: '2rem' }}>
            START SESSION
          </button>
        </div>
      </div>

      <div className="kiosk-content" style={{ display: screen === 'services' ? 'flex' : 'none', flexDirection: 'row', gap: '30px', padding: '20px' }}>
        {/* Left Side: Services */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 className="page-title" style={{ textAlign: 'center' }}>Select a Service</h2>
          <div className="grid-cards">
            <button className="card-btn" style={{ padding: '25px 15px', fontSize: '1.2rem' }} onClick={() => selectService('Check Balance')}>Check Balance</button>
            <button className="card-btn" style={{ padding: '25px 15px', fontSize: '1.2rem' }} onClick={() => selectService('Mini Statement')}>Mini Statement</button>
            <button className="card-btn" style={{ padding: '25px 15px', fontSize: '1.2rem' }} onClick={() => selectService('Block Card')}>Block Card</button>
            <button className="card-btn" style={{ padding: '25px 15px', fontSize: '1.2rem' }} onClick={() => selectService('Update Contact')}>Update Contact</button>
            <button className="card-btn" style={{ padding: '25px 15px', fontSize: '1.2rem' }} onClick={() => selectService('Loan Enquiry')}>Loan Enquiry</button>
            <button className="card-btn" style={{ padding: '25px 15px', fontSize: '1.2rem' }} onClick={() => selectService('Talk to Agent')}>Talk to Agent</button>
          </div>
          <div className="home-btn-container">
            <button className="btn btn-secondary" onClick={endSession}>END SESSION</button>
          </div>
        </div>

        {/* Right Side: Chatbot */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="chat-window" style={{ flex: 1, border: '4px solid var(--black)', backgroundColor: 'var(--white)' }}>
            <div className="chat-history" style={{ display: 'flex', flexDirection: 'column' }}>
              {messages.length === 0 && (
                <div className="chat-message msg-bot">
                  Hello! How can I help you today? You can select an option on the left or type your request below.
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`chat-message ${m.sender === 'bot' ? 'msg-bot' : 'msg-user'}`}>
                  {m.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-actions">
              <input 
                className="chat-input" 
                type="text" 
                placeholder="Type your request here..." 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(inputValue)}
              />
              <button className="btn btn-primary chat-send" onClick={() => sendMessage(inputValue)}>SEND</button>
            </div>
          </div>
        </div>
      </div>

      <div className="kiosk-content" style={{ display: screen === 'otp' ? 'flex' : 'none' }}>
        <div className="center-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 className="page-title">Identity Verification</h2>
          <p style={{ fontSize: '1.5rem', marginBottom: '30px' }}>Please enter the 6-digit OTP sent to your registered device.</p>
          <p style={{ fontSize: '1rem', color: 'gray', marginBottom: '10px' }}>(Hint: Check backend logs for demo OTP)</p>
          <input 
            type="text" 
            className="big-input" 
            maxLength={6} 
            placeholder="• • • • • •" 
            id="otpInput"
          />
          {errorText && <p className="error-text">{errorText}</p>}
          <button className="btn btn-primary" onClick={() => verifyOtp(document.getElementById('otpInput').value)}>
            VERIFY & PROCEED
          </button>
          <button className="btn btn-secondary" onClick={endSession}>CANCEL SESSION</button>
        </div>
      </div>

      <div className="kiosk-content" style={{ display: screen === 'result' ? 'flex' : 'none' }}>
        <div className="center-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 className="page-title">Service Request Completed</h2>
          <div className="results-box">
            {resultData && (
              <>
                <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>{resultData.message}</p>
                {resultData.balance && <p>Balance: $ {resultData.balance}</p>}
                {resultData.transactions && (
                  <ul style={{ paddingLeft: '20px', fontSize: '1.2rem', marginTop: '10px' }}>
                    {resultData.transactions.map((t, idx) => (
                      <li key={idx} style={{ padding: '5px 0' }}>{t.date} | {t.description} | ${t.amount}</li>
                    ))}
                  </ul>
                )}
                {resultData.eligibleAmount && (
                  <div>
                    <p>Eligible Amount: {resultData.eligibleAmount}</p>
                    <p>Interest Rate: {resultData.interestRate}</p>
                  </div>
                )}
              </>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => setScreen('services')}>RETURN TO MENU</button>
          <button className="btn btn-secondary" onClick={endSession}>FINISH & LOGOUT</button>
        </div>
      </div>

      <div className="kiosk-content" style={{ display: screen === 'escalation' ? 'flex' : 'none' }}>
        <div className="center-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 className="page-title">Connecting to Human Agent</h2>
          <div className="results-box" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Please wait while we connect you to an agent.</p>
            <p style={{ fontWeight: 'bold' }}>Agent Name: Alice</p>
            <p style={{ color: 'gray' }}>Estimated wait time: 2 minutes</p>
            <div style={{ marginTop: '30px', borderTop: '2px solid var(--black)', paddingTop: '20px' }}>
              <p style={{ fontSize: '1.2rem' }}>Session context has been securely forwarded to the agent.</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={endSession}>END CALL & LOGOUT</button>
        </div>
      </div>

    </div>
  );
}
