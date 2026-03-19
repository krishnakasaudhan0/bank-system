const express = require('express');
const router = express.Router();
const controller = require('../controllers/apiController');
const db = require('../data/mockDB');

const validateSession = (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId || !db.mockSessions.has(parseInt(sessionId))) {
    return res.status(401).json({ error: 'Invalid or missing session' });
  }
  req.session = db.mockSessions.get(parseInt(sessionId));
  next();
};

const ensureAuthorized = (req, res, next) => {
  if (!req.session.authorized) {
    return res.status(403).json({ error: 'OTP verification required for this action' });
  }
  next();
};

router.post('/session/start', controller.startSession);
router.post('/session/end', validateSession, controller.endSession);

router.post('/auth/request-otp', validateSession, controller.requestOtp);
router.post('/auth/verify-otp', validateSession, controller.verifyOtp);

router.post('/conversation/message', validateSession, controller.conversationMessage);

router.post('/banking/balance', validateSession, ensureAuthorized, controller.checkBalance);
router.post('/banking/mini-statement', validateSession, ensureAuthorized, controller.miniStatement);
router.post('/banking/block-card', validateSession, ensureAuthorized, controller.blockCard);
router.post('/banking/update-contact', validateSession, ensureAuthorized, controller.updateContact);
router.post('/banking/loan-enquiry', validateSession, controller.loanEnquiry);

router.post('/escalation/agent', validateSession, controller.escalateAgent);

module.exports = router;
