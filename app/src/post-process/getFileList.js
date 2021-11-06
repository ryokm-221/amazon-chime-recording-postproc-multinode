const AWS = require('aws-sdk');
const fs = require('fs');
const { argv } = require('process');

// Region should be the same with S3 bucket specified with ARN
const S3 = new AWS.S3({ region: 'us-east-1' });
// ARN: 'arn:aws:s3:<region>:<accountID>:<path/to/accesspoint>';
const bucketARN = process.env.bucketarn;

const MEETING_ID = argv[2];
const ATTENDEE_ID = argv[3];

const getFileList = async () => {
  let bucketParams = {
      Bucket: bucketARN,
      Prefix: '',
  };
  
  try {
    if (ATTENDEE_ID === 'audio') {
      bucketParams.Prefix = `${MEETING_ID}/audio`;
      let i = 1;
      let itemCount = 1;
      while (i === 1 || bucketParams.ContinuationToken) {
        console.log(`Getting audio files: ${i} time${i === 1 ? '' : 's'} ${ATTENDEE_ID}`);
        const bucketList = await S3.listObjectsV2(bucketParams).promise();
        for (const object in bucketList.Contents) {
          const data = (await S3.getObject({
            Bucket: bucketARN,
            Key: bucketList.Contents[object].Key
          }).promise()).Body;
          fs.writeFileSync(`./tmp/${itemCount}_org.mp4`, data);
          fs.appendFileSync('./tmp/concat_list.txt', `file ${itemCount}_org.mp4\n`);
          console.log(`#${itemCount} ${bucketList.Contents[object].Key} completed!`);
          itemCount++
        }
        if (bucketList.IsTruncated) {
          bucketParams.ContinuationToken = bucketList.NextContinuationToken;
        } else {
          bucketParams.ContinuationToken = null;
        }
        i++
      }
    } else {
      bucketParams.Prefix = `${MEETING_ID}/video`;
      let i = 1;
      let itemCount = 1;
      while (i === 1 || bucketParams.ContinuationToken) {
        console.log(`Getting video files: ${i} time${i === 1 ? '' : 's'} ${ATTENDEE_ID}`);
        const bucketList = await S3.listObjectsV2(bucketParams).promise();
        for (const object in bucketList.Contents) {
          const attendeeIdInKey = ((bucketList.Contents[object].Key).split('/')[2]).substr(24, 36);
          if (attendeeIdInKey === ATTENDEE_ID) {
            const data = (await S3.getObject({
              Bucket: bucketARN,
              Key: bucketList.Contents[object].Key
            }).promise()).Body;
            fs.writeFileSync(`./tmp/${itemCount}_org.mp4`, data);
            fs.appendFileSync('./list.txt', `${itemCount}_org.mp4\n`);
            console.log(`#${itemCount} ${bucketList.Contents[object].Key}`);
            itemCount++
          }
        }
        if (bucketList.IsTruncated) {
          bucketParams.ContinuationToken = bucketList.NextContinuationToken;
        } else {
          bucketParams.ContinuationToken = null;
        }
        i++
      }
    }
  } catch (e) {
    throw new Error(e);
  }
};

getFileList();