import { Router } from 'express';
import { searchAll, searchSuggestions } from '../controllers/index.js'
import { optionalJWT } from '../middlewares/index.js'

const router = Router();

router.route('/suggestions').get(searchSuggestions);
router.route('/').get(optionalJWT, searchAll);

export default router