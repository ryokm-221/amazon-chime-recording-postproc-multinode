const AWS = require('aws-sdk');
const fs = require('fs');
const { argv } = require('process');

// Region should be the same with S3 bucket specified with ARN
const S3 = new AWS.S3({ region: 'us-east-1' });
// ARN: 'arn:aws:s3:<region>:<accountID>:<path/to/accesspoint>';
const bucketARN = process.env.bucketarn;

const getFileList = async () => {
  const MEETING_ID = argv[2];
  const audioBucketParams = {
    Bucket: bucketARN,
    Prefix: `${MEETING_ID}/audio`,
    Marker: ''
  };
  const videoBucketParams = {
    Bucket: bucketARN,
    Prefix: `${MEETING_ID}/video`,
    Marker: ''
  };

  try {
    // getting audio files
    fs.mkdirSync('./audio');
    let i = 1;
    while (i === 1 || audioBucketParams.Marker) {
      console.log(`${i} time${i = 1 ? '' : 's'}`);
      const bucketList = await S3.listObjects(audioBucketParams).promise();
      for (const object in bucketList.Contents) {
        // For getting signed url,
        // expire time can be set between 1 ~ 604800 sec (7 days).
        let url = await S3.getSignedUrlPromise('getObject', {
          Bucket: bucketARN,
          Key: bucketList.Contents[object].Key,
          Expires: 60*60*24 
        });
        console.log(url);
        fs.appendFileSync('./audio/audio_list.txt', `${url}\n`);
      }
      if (bucketList.IsTruncated) audioBucketParams.Marker = bucketList.NextMarker;
      i = i + 1;
    }
    // getting video files
    fs.mkdirSync('./video');
    let j = 1;
    while (j === 1 || videoBucketParams.Marker) {
      const bucketList = await S3. listObjects(videoBucketParams).promise();
      for (const object in bucketList.Contents) {
        console.log(bucketList.Contents[object].Key);
        // substr to get attendeeId from object key
        // filename: yyyy-mm-dd-hh-mm-ss-fff-(attendeeId).mp4
        // ex. 2021-09-16-03-28-00-828-32e7855d-e525-0ff8-1e65-80da4d78641c.mp4
        const attendeeId = ((bucketList.Contents[object].Key).split('/')[2]).substr(24, 36);
        let url = await S3.getSignedUrlPromise('getObject', {
          Bucket: bucketARN,
          Key: bucketList.Contents[object].Key,
          Expires: 60*60*24
        });
        console.log(url);
        if (!fs.existsSync(`./video/${attendeeId}`)) fs.mkdirSync(`./video/${attendeeId}`);
        fs.appendFileSync(`./video/${attendeeId}/video_list.txt`, `${url}\n`);
      }
      if (bucketList.IsTruncated) videoBucketParams.Marker = bucketList.NextMarker;
      j = j + 1;
    }
  } catch (e) {
    throw new Error(e);
  }
};

getFileList();