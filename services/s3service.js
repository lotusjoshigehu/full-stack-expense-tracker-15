const AWS = require("aws-sdk");

// S3 configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// ================= UPLOAD FILE =================
exports.uploadToS3 = async (data, filename) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
    Body: data,
    ContentType: "text/csv",
    ContentDisposition: "attachment"
  };

  const response = await s3.upload(params).promise();
  return response.Location;
};


// ================= SIGNED DOWNLOAD URL =================
exports.getSignedUrl = (filename) => {
  return s3.getSignedUrl("getObject", {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
    Expires: 300 // 5 minutes
  });
};
