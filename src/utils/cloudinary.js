import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
});

const deleteFromCloudinary = async (public_id, resourceType) => {
    try {
        if (!public_id) return null;
        const response = await cloudinary.uploader.destroy(public_id, {
            resource_type: resourceType,
            invalidate: true
        });

        console.log("Deleting public_id:", public_id);

        return response;
    } catch (error) {
        console.log("Error in deleting from Cloudinary:", error);
        return null;
    }
};

const getCloudinaryUrl = (public_id, resourceType = "image", options = {}, signed = false) => {
  try {
    if (!public_id) return null;
    const url = cloudinary.url(public_id, {
      resource_type: resourceType,
      secure: true,
      sign_url: signed,
      ...options, // example: { width: 500, height: 300, crop: "fill" }
    });

    return url;
  } catch (error) {
    console.error("Error generating Cloudinary URL:", error);
    return null;
  }
};


export {   
    deleteFromCloudinary,
    getCloudinaryUrl
}