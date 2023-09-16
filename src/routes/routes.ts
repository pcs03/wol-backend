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
  registerUser,
} from '../controllers/controller';
import { shutdownDummy, wolDummy } from '../controllers/controllerDummy';

const router = Router();

router.get('/devices', getDevices);
router.get('/devices/:id', getDeviceById);
router.post('/devices', createDevice);
router.put('/devices/:id', updateDevice);
router.delete('/devices/:id', removeDevice);

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/wol/:id', wolDevice);
router.get('/shutdown/:id', shutdownDevice);
router.get('/ping/:id', pingDevice);

router.get('/shutdownDummy/:id', shutdownDummy);
router.get('/wolDummy/:id', wolDummy);

export default router;
