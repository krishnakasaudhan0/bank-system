const db = require('../data/mockDB');

exports.startSession = (req, res) => {
  const sessionId = db.getNextSessionId();
  const session = { id: sessionId, startedAt: new Date(), authorized: false };
  db.mockSessions.set(sessionId, session);
  res.json({ sessionId, message: 'Session started' });
};

exports.endSession = (req, res) => {
  db.mockSessions.delete(req.session.id);
  res.json({ message: 'Session ended' });
};

exports.requestOtp = (req, res) => {
  const otp = db.generateOTP();
  req.session.currentOtp = otp;
  console.log(`[Demo] Generated OTP for session ${req.session.id}: ${otp}`);
  res.json({ message: 'OTP sent successfully', demoOtp: otp });
};

exports.verifyOtp = (req, res) => {
  const { otp } = req.body;
  if (!otp || otp !== req.session.currentOtp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
  req.session.authorized = true;
  req.session.currentOtp = null;
  res.json({ message: 'OTP verified successfully' });
};

exports.conversationMessage = (req, res) => {
  const { text } = req.body;
  let intent = 'UNKNOWN';
  let responseText = "I didn't quite catch that. Could you please clarify your request?";
  let requireAction = null;

  const lowerText = text.toLowerCase();
  
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
    responseText = 'I understand you want to block your card. This action is irreversible online. Shall we proceed?';
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

  res.json({ intent, text: responseText, action: requireAction });
};

exports.checkBalance = (req, res) => {
  res.json({ 
    balance: db.mockUserData.balance,
    currency: 'INR',
    message: `✔ Your balance is ₹${db.mockUserData.balance.toLocaleString('en-IN')}`
  });
};

exports.miniStatement = (req, res) => {
  const transactions = [
    { date: '2023-10-01', description: 'Grocery Store', amount: -450.50 },
    { date: '2023-10-02', description: 'Salary Credit', amount: 35000.00 },
    { date: '2023-10-05', description: 'Electric Bill', amount: -1200.00 }
  ];
  res.json({ transactions, message: '✔ Recent transactions fetched successfully' });
};

exports.blockCard = (req, res) => {
  db.mockUserData.cardNumber = 'Blocked';
  res.json({ message: '✔ Card blocked successfully for security.' });
};

exports.updateContact = (req, res) => {
  const { newPhone } = req.body;
  if (!newPhone) return res.status(400).json({ error: 'New phone number required' });
  db.mockUserData.phone = newPhone;
  res.json({ message: `✔ Contact updated successfully to ${newPhone}` });
};

exports.loanEnquiry = (req, res) => {
  res.json({ 
    eligibleAmount: '₹5,00,000', 
    interestRate: '8.5%', 
    message: '✔ Based on your profile, you are pre-approved for up to ₹5,00,000.'
  });
};

exports.escalateAgent = (req, res) => {
  res.json({ 
    agentName: 'Alice', 
    waitTime: '2 minutes',
    message: '✔ You have been added to the queue to speak with an agent.' 
  });
};
