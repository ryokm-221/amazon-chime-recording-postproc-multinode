const AWS = require('aws-sdk');
const { writeFileSync, appendFileSync } = require('fs');
// Region should be the same with S3 bucket specified with ARN
const s3 = new AWS.S3({region:'us-east-1'});
const { argv } = require('process');

const MEETING_ID = argv[2];
// ARN: 'arn:aws:s3:<region>:<accountID>:<path/to/accesspoint>';
const bucketArn = process.env.bucketarn;

const download = async () => {
  const s3List = (await s3.listObjectsV2({
    Bucket: bucketArn,
    Prefix: `${MEETING_ID}/`
  }).promise()).Contents;
  for (const item of s3List) {
    const name = item.Key;
    const nameShort = name.split('/')[1]
    console.log(`downloading: ${name} to ./tmp/${nameShort}`);
    const fileBody = (await s3.getObject({
      Bucket: bucketArn,
      Key: name
    }).promise()).Body;
    writeFileSync(`./tmp/${nameShort}`, fileBody);
    if (nameShort !== 'audio_full.mp4') {
      appendFileSync('./tmp/list.txt', `${name.split('/')[1]}\n`);
    }
  }
};

download();