const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const s3 = new AWS.S3();
const Batch = new AWS.Batch();

// ARN: 'arn:aws:s3:<region>:<accountID>:<path/to/accesspoint>';
const bucketArn = process.env.bucketarn;

exports.handler = async(event) => {
  const key = event.Records[0].s3.object.key;
  const meetingId = key.split('/')[0];
  
  // dbcount should match with the number of attendeeIds
  const dbcount = 0;
  const bucketContent = (await s3.listObjectsV2({
    Bucket: bucketArn,
    Prefix: `${meetingId}/`
  }).promise()).Contents;
  const bucketCount = bucketContent.length;

  if (bucketCount !== (dbcount + 1)) {
    console.log(`not enough file(s) found in bucket (current: ${bucketCount}, required: ${dbcount + 1})`);
    return;
  } else {
    console.log(`enough files found, submitting final process job...`);
    return await submitJob(meetingId);
  }
};

async function submitJob(meetingId) {
  const now = (new Date()).getTime();
  return await Batch.submitJob({
    jobDefinition: 'recording_finishProcess',
    jobName: `finish_${now}_${meetingId}`,
    jobQueue: 'recording_job-que_EC2',
    containerOverrides: {
      vcpus: 4,
      memory: 16384,
      environment: [
        {
          name: 'meetingId',
          value: meetingId
        }
      ]
    }
  }).promise();
};