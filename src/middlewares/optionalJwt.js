import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

export const optionalJWT = async (req, _, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decoded?._id) {
      req.user = null;
      return next();
    }

    const user = await User.findById(decoded._id)
      .select("-password -refreshToken");

    req.user = user || null;
    return next();
  } catch (err) {
    req.user = null;
    return next();
  }
};

