import { Router } from 'express';
import { Video } from "../models/index.js"
import {
    postVideo,
    togglePublishStatus,
    getAllUserVideos,
    getAllVideos,
    getVideoById,
    deleteVideo,
    updateVideo,
    getWatchHistory,
    removeFromWatchHistory
} from "../controllers/index.js"
import {
    verifyJWT,
    checkOwnership,
    optionalJWT
} from "../middlewares/index.js"
 
const router = Router();
router.route('/get-all-videos').get(getAllVideos);
router.route('/getVideo').get(optionalJWT, getVideoById);
router.use(verifyJWT);

router.route("/post-video").post(postVideo);
router.route("/toggle/publish/:videoId").patch(checkOwnership(Video, "videoId"), togglePublishStatus);
router.route('/get-user-videos').get(getAllUserVideos);
router.route('/delete/:videoId').post(checkOwnership(Video, 'videoId'), deleteVideo);

router.route('/watch-history').get(getWatchHistory)
router.route('/watch-history/:videoId').patch(removeFromWatchHistory)
router
    .route("/:videoId")
    .delete(checkOwnership(Video, "videoId"), deleteVideo)
    .patch(checkOwnership(Video, 'videoId'), updateVideo)

export default router