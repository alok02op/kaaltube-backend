import { ApiResponse, asyncHandler } from "../utils/index.js";


const healthcheck = asyncHandler(async (_, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                uptime: process.uptime(),
                timestamp: new Date(),
                memoryUsage: process.memoryUsage().rss
            },
            "OK"
        )
    );
})

export {
    healthcheck
}
    