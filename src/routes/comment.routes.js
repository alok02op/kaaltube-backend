import { Router } from 'express';
import { checkOwnership, verifyJWT, optionalJWT } from "../middlewares/index.js"
import { 
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
    toggleCommentLike
} from '../controllers/index.js';
import { Comment } from '../models/index.js'
 
const router = Router();

router.route('/').get(optionalJWT, getVideoComments);

router.use(verifyJWT);

router.route('/add-comment').post(addComment);
router.route('/like').patch(toggleCommentLike);
router.route('/:commentId').patch(checkOwnership(Comment, 'commentId'), updateComment);
router.route('/:commentId').delete(checkOwnership(Comment, 'commentId'), deleteComment);

export default router