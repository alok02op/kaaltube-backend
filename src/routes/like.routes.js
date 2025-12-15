import { Router } from 'express';
import { verifyJWT } from "../middlewares/index.js"
import { getLikedVideos, toggleVideoLike, deleteLikedVideo } from '../controllers/index.js';
 
const router = Router();
router.use(verifyJWT);

router.route('/toggle/video/:videoId').patch(toggleVideoLike);
router.route('/videos').get(getLikedVideos);
router.route('/delete/:videoId').delete(deleteLikedVideo);


export default router