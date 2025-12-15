import express, { json, urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import {
    userRouter,
    healthcheckRouter,
    videoRouter,
    likeRouter,
    subscriptionRouter,
    commentRouter,
    searchRouter
} from './routes/index.js'
import { errorHandler } from './middlewares/index.js'

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : [];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(json({limit: '16kb'}))
app.use(urlencoded({extended: true, limit : '16kb'}))
app.use(cookieParser())

app.use('/api/v1/users/', userRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/likes", likeRouter)
app.use('/api/v1/subscriptions', subscriptionRouter)
app.use('/api/v1/comments/', commentRouter)
app.use('/api/v1/search', searchRouter)

app.use(errorHandler)

export {app}