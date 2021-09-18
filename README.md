# Amazon Chime SDK Recording Post Process Script
Post process script for Amazon Chime SDK Recording files.

## Why do I need this?
Recording feature [officially added](https://aws.amazon.com/jp/blogs/business-productivity/capture-amazon-chime-sdk-meetings-using-media-capture-pipelines/) on July 7th, 2021 and available from [amazon-chime-sdk^2.13.0](https://github.com/aws/amazon-chime-sdk-js/tree/v2.13.0). 

The audio and video files are chunked into 5-second pieces and stored in specified S3 bucket. By default, **audio** folder contains the video stream of active speaker with the audio from all attendees. However you can capture individual video streams if you contact AWS support. 

This script will do followings on Docker images.
  - concat the chuncked audio and video files
  - merge the audio and individual video streams

## Requirements
  - NodeJS^10
  - Any Docker Environment!

## (Suggested, **not requirement**) Environment
This script is intended to use on AWS Batch with AWS Fargate environment. However, since the docker image is build based on CentOS 8, so you can use any environment!
  
  ### Environment Variables
  - AWS Credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)

    **Following must be authorized to perform.**
    - S3 FullAccess
  
  - meetingId

    This is an issed ID by Amazon Chime SDK that is returned by performing `Chime.CreateMeeting`.

  - bucketarn

    S3 bucket ARN which contains recording files.

## How to use
  1. Clone in to any folders (following indicated by ~).
  2. Download latest version of [ffmpeg](https://johnvansickle.com/ffmpeg/).
  3. Unzip file into `~/bin/`.
  4. Build images on docker (with ex. CodeBuild on AWS)
  5. Run!