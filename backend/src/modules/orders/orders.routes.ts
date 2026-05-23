import { Router } from 'express';
import { OrdersController } from './orders.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', OrdersController.checkout); // Send "park: true" inside body execution payload to toggle caching state
router.get('/parked', OrdersController.listParked); // Returns active pending parked lists
router.get('/completed', OrdersController.listCompleted); // Returns active finalized completed list logs
router.put('/parked/:id/finalize', OrdersController.finalizeParked); // Submits terminal payload edits, process stock, and settles payments

export default router;