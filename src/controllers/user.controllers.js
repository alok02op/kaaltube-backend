import { 
    asyncHandler, 
    ApiError, 
    ApiResponse,
    getCloudinaryUrl,
    deleteFromCloudinary,
    sendEmail
} from '../utils/index.js'
import { User } from "../models/index.js";
import bcrypt from "bcrypt";

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        
        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave : false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    const { fullName, email, username, password, avatar, coverImage } = req.body
    
    // validation - not empty
    // if (fullName === "") throw new ApiError(400, "fullName is required")

    if (
        [fullName, email, username, password, avatar].some((field) => (field?.trim() === ""))
    ) {
        throw new ApiError(400, "Please fill all the required fields");
    }
    if (username && !/^[a-z0-9]+$/.test(username)) {
        throw new ApiError(400, "Username can only contain lowercase letters and digits");
    }
    if (!isValidEmail(email)) {
        throw new ApiError(400, "Please enter valid email address");
    }

    // check if already exist : username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exist")
    }
    
    // create user object - create entry in db
    const user = await User.create({
        fullName,
        username,
        email : email.toLowerCase(),
        avatar,
        coverImage: coverImage || null,
        password,
        isVerified: false
    })
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    user.otp = hashedOtp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();
    
    await sendEmail({
        to: user.email,
        subject: "Your Kaaltube OTP",
        text: `Your OTP is ${otp}`
    });
    
    return res.status(201).json(
        new ApiResponse(201, {userId: user._id}, "User registered. OTP generated.")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    const {username, email, password} = req.body;
    
    // username or email
    if (!username && !email) {
        throw new ApiError(400, "username or email is required");
    }
    
    // find if the user is not registered
    const user = await User.findOne({
        $or : [{ username }, { email }]
    })
    if (!user) throw new ApiError(404, "User is not registered");

    if (!user.isVerified) throw new ApiError(403, "Please verify your email before logging in");

    // password check
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

    // access and refresh token
    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(user._id);

    const avatarUrl = getCloudinaryUrl(
        user.avatar, 
        'image', 
        {
            crop: 'fill',
            gravity: 'face',
            radius: 'max',
            fetch_format: 'auto',
            quality: 'auto'
        }
    )
    
    const coverImageUrl = getCloudinaryUrl(
        user.coverImage, 
        'image', 
        {
            crop: 'fill',
            gravity: 'auto',
            fetch_format: 'auto',
            quality: 'auto'
        }
    )
    
    // send cookies
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/"
    };


    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                avatar: avatarUrl,
                coverImage: coverImageUrl
            },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset : {refreshToken : 1} },
        { new : true }
    )
    
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/"
    };
    
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user
    const avatarUrl = getCloudinaryUrl(
        user.avatar, 
        'image', 
        {
            crop: 'fill',
            gravity: 'face',
            radius: 'max',
            fetch_format: 'auto',
            quality: 'auto'
        }
    )

    const coverImageUrl = getCloudinaryUrl(
        user.coverImage, 
        'image', 
        {
            crop: 'fill',
            gravity: 'auto',
            fetch_format: 'auto',
            quality: 'auto'
        }
    )
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                avatar: avatarUrl,
                coverImage: coverImageUrl
            },
            "User fetched successfully"
        )
    )
})

const changeCurrentPassword = asyncHandler(async (req,res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Current password and new password are required");
    }

    const user = await User.findById(req.user?._id);
    
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(currentPassword);
    
    if (!isPasswordValid) {
        throw new ApiError(401, "Current password is incorrect");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            {}, 
            "Password changed successfully"
        )
    );
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, username, email } = req.body

    // Validate request data
    if (!fullName || !username || !email) {
        throw new ApiError(400, "All fields are required");
    }
    if (username && !/^[a-z0-9]+$/.test(username)) {
        throw new ApiError(400, "Username can only contain lowercase letters and digits");
    }
    if (!isValidEmail(email)) {
        throw new ApiError(400, "Please enter valid email address");
    }
    // Update user details
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { 
            $set: { 
                fullName, 
                username, 
                email 
            }
        },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                username: updatedUser.username,
                fullName: updatedUser.fullName,
                email: updatedUser.email
            },
            "Account details updated successfully"
        )
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const { avatar } = req.body;
    if (!avatar) throw new ApiError(400, 'Avatar is missing');
    await deleteFromCloudinary(req.user.avatar, 'image');
    
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { avatar } },
        { new: true, runValidators: true }
    );

    const avatarUrl = getCloudinaryUrl(
        updatedUser.avatar, 
        'image', 
        {
            crop: 'fill',
            gravity: 'face',
            radius: 'max',
            fetch_format: 'auto',
            quality: 'auto'
        }
    )
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {avatarUrl},
                "User avatar updated successfully"
            )
        );
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const { coverImage }  = req.body;
    if (!coverImage) throw new ApiError(400, 'Cover is missing');
    await deleteFromCloudinary(req.user?.coverImage, 'image');

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { coverImage } },
        { new: true, runValidators: true }
    );

    const coverImageUrl = getCloudinaryUrl(
        updatedUser.coverImage, 
        'image', 
        {
            crop: 'fill',
            gravity: 'auto',
            fetch_format: 'auto',
            quality: 'auto'
        }
    );

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {coverImageUrl},
            "Cover image updated successfully"
        )
    );
})

const getImageUrl = asyncHandler(async (req, res) => {
    const { public_id } = req.body;
    if (!public_id) throw new ApiError(400, 'Public id is missing');

    const url = getCloudinaryUrl(public_id, 'image');

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            url,
            'Url fetched successfully'
        )
    )

})

const verifyOtp = asyncHandler(async (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
        throw new ApiError(400, "UserId and OTP are required");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
        return res.status(200).json(
            new ApiResponse(200, true, "User already verified")
        );
    }

    if (!user.otp || !user.otpExpiry) {
        throw new ApiError(400, "OTP not found. Please request again.");
    }

    if (Date.now() > user.otpExpiry) {
        throw new ApiError(400, "OTP expired. Please request a new one.");
    }

    const isOtpValid = await bcrypt.compare(otp, user.otp);

    if (!isOtpValid) {
        throw new ApiError(400, "Invalid OTP");
    }

    // VERIFIED
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    return res.status(200).json(
        new ApiResponse(200, true, "Email verified successfully")
    );
});

const resendOtp = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        throw new ApiError(400, "UserId is required");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
        throw new ApiError(400, "User already verified");
    }

    // generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    // send email
    await sendEmail({
        to: user.email,
        subject: "Kaaltube Email Verification (Resend)",
        text: `Your new OTP is ${otp}. It expires in 10 minutes.`
    });

    return res.status(200).json(
        new ApiResponse(200, true, "OTP resent successfully")
    );
});


export { 
    registerUser, 
    loginUser, 
    logoutUser,
    generateAccessAndRefreshTokens,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getImageUrl,
    verifyOtp,
    resendOtp
};