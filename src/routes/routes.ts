import { Router } from 'express';
import {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  removeDevice,
  loginUser,
  wolDevice,
  shutdownDevice,
  pingDevice,
} from '../controllers/controller';

const router = Router();

router.get('/devices', getDevices);
router.get('/devices/:id', getDeviceById);
router.post('/devices', createDevice);
router.put('/devices/:id', updateDevice);
router.delete('/devices/:id', removeDevice);

router.post('/login', loginUser);
router.get('/wol/:id', wolDevice);
router.get('/shutdown/:id', shutdownDevice);
router.get('/ping/:id', pingDevice);

export default router;
