import { Router } from "express";
import { verifyJWT, optionalJWT } from "../middlewares/index.js";
import { 
    getSubscribedChannels,
    subscribeChannel,
    unsubscribeChannel,
    getChannelProfile,
    getUserChannelProfile
} from "../controllers/index.js";

const router = Router();

router.route('/').get(optionalJWT, getChannelProfile);

router.use(verifyJWT);

router.route('/user-channel').get(getUserChannelProfile);
router.route('/subscribed-channel').get(getSubscribedChannels);
router.route('/subscribe').post(subscribeChannel);
router.route('/unsubscribe').post(unsubscribeChannel);

export default router