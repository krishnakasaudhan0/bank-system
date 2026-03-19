/* Backend Server for Kiosk Demo */
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory mock data
const mockSessions = new Map();
let nextSessionId = 1;

// Mock user data
const mockUserData = {
  name: 'John Doe',
  balance: 14500.75,
  phone: '+1-555-0100',
  cardNumber: '**** **** **** 4812'
};

// Utilities
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Middlewares
const validateSession = (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId || !mockSessions.has(parseInt(sessionId))) {
    return res.status(401).json({ error: 'Invalid or missing session' });
  }
  req.session = mockSessions.get(parseInt(sessionId));
  next();
};

// 1. Start Session
app.post('/api/session/start', (req, res) => {
  const sessionId = nextSessionId++;
  const session = { id: sessionId, startedAt: new Date(), authorized: false };
  mockSessions.set(sessionId, session);
  res.json({ sessionId, message: 'Session started' });
});

// 2. End Session
app.post('/api/session/end', validateSession, (req, res) => {
  mockSessions.delete(req.session.id);
  res.json({ message: 'Session ended' });
});

// 3. Request OTP
app.post('/api/auth/request-otp', validateSession, (req, res) => {
  const otp = generateOTP();
  req.session.currentOtp = otp;
  // In a real app we'd SMS/email the OTP. For demo, we just return it or log it.
  console.log(`[Demo] Generated OTP for session ${req.session.id}: ${otp}`);
  // Returning the OTP in response just for the demo prototype
  res.json({ message: 'OTP sent successfully', demoOtp: otp });
});

// 4. Verify OTP
app.post('/api/auth/verify-otp', validateSession, (req, res) => {
  const { otp } = req.body;
  if (!otp || otp !== req.session.currentOtp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
  req.session.authorized = true;
  req.session.currentOtp = null;
  res.json({ message: 'OTP verified successfully' });
});

// 5. Send Conversation Message (AI Intent Mapper)
app.post('/api/conversation/message', validateSession, (req, res) => {
  const { text } = req.body;
  let intent = 'UNKNOWN';
  let responseText = "I didn't quite catch that. Could you please clarify your request?";
  let requireAction = null;

  const lowerText = text.toLowerCase();
  
  // Very simplistic rule-based NLP
  if (lowerText.includes('balance') || lowerText.includes('how much')) {
    intent = 'CHECK_BALANCE';
    responseText = 'I can help you check your account balance. Would you like to proceed?';
    requireAction = 'CHECK_BALANCE';
  } else if (lowerText.includes('statement') || lowerText.includes('transactions')) {
    intent = 'MINI_STATEMENT';
    responseText = 'I can fetch your mini statement showing your recent transactions.';
    requireAction = 'MINI_STATEMENT';
  } else if (lowerText.includes('block') || lowerText.includes('lost') || lowerText.includes('stolen')) {
    intent = 'BLOCK_CARD';
    responseText = 'I understand you want to block your card. This action is irreversible online.';
    requireAction = 'BLOCK_CARD';
  } else if (lowerText.includes('contact') || lowerText.includes('phone') || lowerText.includes('update')) {
    intent = 'UPDATE_CONTACT';
    responseText = 'I can help you update your registered contact number.';
    requireAction = 'UPDATE_CONTACT';
  } else if (lowerText.includes('loan')) {
    intent = 'LOAN_ENQUIRY';
    responseText = 'You are inquiring about a new loan. I can provide the basic details.';
    requireAction = 'LOAN_ENQUIRY';
  } else if (lowerText.includes('agent') || lowerText.includes('human') || lowerText.includes('help')) {
    intent = 'ESCALATE_AGENT';
    responseText = 'Let me connect you to a human agent who can assist you further.';
    requireAction = 'ESCALATE_AGENT';
  }

  res.json({
    intent,
    text: responseText,
    action: requireAction
  });
});

// Demo Banking APIs - typically these require authorization
const ensureAuthorized = (req, res, next) => {
  if (!req.session.authorized) {
    return res.status(403).json({ error: 'OTP verification required for this action' });
  }
  next();
};

// 6. Check Balance
app.post('/api/banking/balance', validateSession, ensureAuthorized, (req, res) => {
  res.json({ 
    balance: mockUserData.balance,
    currency: 'USD',
    message: `Your current balance is $${mockUserData.balance}`
  });
});

// 7. Mini Statement
app.post('/api/banking/mini-statement', validateSession, ensureAuthorized, (req, res) => {
  const transactions = [
    { date: '2023-10-01', description: 'Grocery Store', amount: -45.50 },
    { date: '2023-10-02', description: 'Salary Credit', amount: 3500.00 },
    { date: '2023-10-05', description: 'Electric Bill', amount: -120.00 }
  ];
  res.json({ transactions, message: 'Recent transactions fetched successfully' });
});

// 8. Block Card
app.post('/api/banking/block-card', validateSession, ensureAuthorized, (req, res) => {
  mockUserData.cardNumber = 'Blocked';
  res.json({ message: 'Your card has been blocked successfully for security.' });
});

// 9. Update Contact
app.post('/api/banking/update-contact', validateSession, ensureAuthorized, (req, res) => {
  const { newPhone } = req.body;
  if (!newPhone) return res.status(400).json({ error: 'New phone number required' });
  mockUserData.phone = newPhone;
  res.json({ message: `Contact updated successfully to ${newPhone}` });
});

// 10. Loan Enquiry
app.post('/api/banking/loan-enquiry', validateSession, (req, res) => {
  // doesn't usually require strict full auth for just an inquiry
  res.json({ 
    eligibleAmount: '$50,000', 
    interestRate: '5.5%', 
    message: 'Based on your profile, you are pre-approved for up to $50,000.'
  });
});

// 11. Escalate to Agent
app.post('/api/escalation/agent', validateSession, (req, res) => {
  res.json({ 
    agentName: 'Alice', 
    waitTime: '2 minutes',
    message: 'You have been added to the queue to speak with an agent.' 
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
