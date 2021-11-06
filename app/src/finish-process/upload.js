const AWS = require('aws-sdk');
const { createReadStream } = require('fs');
// Region should be the same with S3 bucket specified with ARN
const s3 = new AWS.S3({region: 'us-east-1'});
const { argv } = require('process');

const MEETING_ID = argv[2];
// ARN: 'arn:aws:s3:<region>:<accountID>:<path/to/accesspoint>';
const bucketArn = process.env.bucketarn;

const upload = async () => {
  console.log(`uploading: ${MEETING_ID}_full.zip`);
  await s3.upload({
    Bucket: bucketArn,
    Key: `${MEETING_ID}/${MEETING_ID}_full.zip`,
    Body: createReadStream(`./${MEETING_ID}_full.zip`),
    ContentType: 'application/zip',
    Tagging: 'full'
  }, {
    partSize: 100 * 1024 * 1024
  }).promise();
}

upload();