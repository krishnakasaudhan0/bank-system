const mockSessions = new Map();
let nextSessionId = 1;

const mockUserData = {
  name: 'John Doe',
  balance: 25000.00,
  phone: '+91-9876543210',
  cardNumber: '**** **** **** 4812'
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

module.exports = {
  mockSessions,
  mockUserData,
  generateOTP,
  getNextSessionId: () => nextSessionId++
};
