import { Router } from "express";
import { verifyJWT } from "../middlewares/index.js";
import { 
    registerUser, 
    loginUser, 
    logoutUser,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getImageUrl,
    verifyOtp,
    resendOtp
} from "../controllers/index.js";

const router = Router();

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route('/get-image-url').post(getImageUrl)
router.route('/verify-otp').post(verifyOtp)
router.route('/resend-otp').post(resendOtp)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/avatar").patch(verifyJWT, updateUserAvatar);
router.route("/cover-image").patch(verifyJWT, updateUserCoverImage);

export default router