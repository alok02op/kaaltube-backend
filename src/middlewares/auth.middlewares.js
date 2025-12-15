import { User } from '../models/index.js'
import jwt from "jsonwebtoken";
import { ApiError, refreshAccessToken, asyncHandler } from '../utils/index.js'

// _ means res is not used.
export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken;
        if (!accessToken) throw new ApiError(401, "Please Login");
        try {
            const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
            if (!user) throw new ApiError(404, "User not found");
            req.user = user;
            return next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                const token = req.cookies?.refreshToken;
                if (!token) throw new ApiError(404, 'Refresh token not found')
                const { accessToken, refreshToken} = refreshAccessToken(token);

                const options = {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/"
                };
                res
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)

                const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
                const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
                if (!user) throw new ApiError(404, "User not found");
                req.user = user;
                return next();
            } else {
                throw new ApiError(401, "INVALID_ACCESS_TOKEN");
            }
        }
    } catch (error) {
        throw new ApiError(401, error?.message || "Access token Invalid");
    }
})

