import { User } from "../models/index.js";
import { generateAccessAndRefreshTokens } from '../controllers/index.js'
import { ApiError, asyncHandler } from './index.js'
import jwt from 'jsonwebtoken'

const refreshAccessToken = asyncHandler(async (token) => {
    try {
        const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        if (!user) throw new ApiError(404, "User not found");

        if (token !== user.refreshToken) throw new ApiError(403, "Invalid refresh token");
    
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    
        return { accessToken, refreshToken }
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Refresh token is expired, login again.")
        } else {
            throw new ApiError(401, error?.message || "Invalid Refresh Token");
        }
    }
})

export { refreshAccessToken }