import { Router } from 'express';
import { ConsultationHandler } from '../services/consultation-agent/handlers/consultation-handler';

const router = Router();
const consultationHandler = new ConsultationHandler();

// Health check for consultation service (must be before parameterized routes)
router.get('/health', (_req, res) => {
  res.json({ 
    status: 'active', 
    agent: 'Mack - Corporate Intelligence Specialist',
    service: 'ProspectPI Consultation Agent',
    version: '1.0.0'
  });
});

// Mack Consultation Agent Routes
router.post('/start', consultationHandler.startConsultation);
router.post('/message', consultationHandler.processMessage);
router.get('/:conversationId', consultationHandler.getConversation);
router.post('/:conversationId/generate-research', consultationHandler.generateResearch);

export default router;