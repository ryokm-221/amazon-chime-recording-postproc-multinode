// Required areguments
// node upload.js <meetingId> <local-path-to-full-mp4>
const AWS = require('aws-sdk');
const fs = require('fs');
const { argv } = require('process');

// Region should be the same with S3 bucket specified with ARN
const S3 = new AWS.S3({ region: 'us-east-1' });
// ARN: 'arn:aws:s3:<region>:<accountID>:<path/to/accesspoint>';
const bucketARN = process.env.bucketarn;
const meetingId = argv[2];

const upload = async (path) => {
  const file = fs.readFileSync(`${path}`);
  const uploadParams = {
    Bucket: bucketARN,
    Key: `${meetingId}/${meetingId}_full.zip`,
    Body: file
  };
  try {
    await S3.putObject(uploadParams).promise();
    console.log('upload completed');
  } catch (e) {
    throw new Error(e);
  }
};

upload(argv[3]);