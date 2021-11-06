const AWS = require('aws-sdk');
// region should be modified
AWS.config.update({ region: 'us-east-1' });
const batch = new AWS.Batch();


exports.handler = async (event) => {
  // attendee id must be given with dbList parameter
  const dblist = [];
  const processList = [];
  const recDetail = event.body;
  const MEETING_ID = recDetail.meetingId;
  for (const item of dblist) {
    processList.push(item);
  }
  processList.push('audio');
  console.log(`processingList: ${processList}`);

  let resultArr = [];
  for (const attendeeId of processList) {
    const now = (new Date()).getTime();
    const param = {
      jobDefinition: 'recording_job-def_EC2',
      jobName: `rec_${recDetail.meetingId}_${now}`,
      jobQueue: 'recording_job-que_EC2',
      containerOverrides: {
        environment: [
          {
            name: 'meetingId',
            value: MEETING_ID
          },
          {
            name: 'attendeeId',
            value: attendeeId
          }
        ]
      }
    };
    console.log(`job: rec_${recDetail.meetingId}_${now} ${attendeeId}`);
    const result = await batch.submitJob(param).promise();
    resultArr.push(result.jobName);
  }

  return resultArr;
};