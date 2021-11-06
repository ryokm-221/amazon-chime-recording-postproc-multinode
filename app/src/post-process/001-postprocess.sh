#!/bin/bash
#-----------------------------------------------------------
# Amazon Chime SDK Recording Post-Process Script
#                               for AWS Batch & Docker
#
# Usage: $ sh 001-postprocess.sh
#
#-----------------------------------------------------------

set -e

echo "-----------------------------------------"
echo "Amazon Chime SDK"
echo "Meeting Recording Post-Process Script"
echo "Version: 1.0.0"
echo "Current NodeJS Version: $(node --version)"
echo "Required: NodeJS^10"
echo "-----------------------------------------"

MEETING_ID=$meetingId
# attendee ID or "audio"
ATTENDEE_ID=$attendeeId

ffmpeg="../../bin/ffmpeg"

echo "Processing Meeting: $MEETING_ID $MEETING_CODE"

now=`date "+%s"`
path=./$now/
mkdir $path; cd $path
mkdir tmp output
echo "Working Dir: $(pwd)"

echo "Main process started at $(date "+%T")"
echo "Begin listing and downloading S3 object(s)..."
node ../getFileList.js $MEETING_ID $ATTENDEE_ID
total_of_file=`cat tmp/concat_list.txt | wc -l`
echo "Number of processing file(s): $total_of_file"
echo "End listing and downloading S3 object(s)!"

echo "Begin concatting process..."
cd tmp
if [ $ATTENDEE_ID = "audio" ]; then
  $ffmpeg -f concat -safe 0 -i concat_list.txt -loglevel 16 ../output/audio_full.mp4 </dev/null
else
  k=1
  while [ $k -le `cat ../list.txt | wc -l` ]; do
    item=${k}_org.mp4
    if [ ! -f $item ]; then
      echo "breaking..."
      break
    fi
    echo "timescale adjusting: #$k/$total_of_file"
    $ffmpeg -i $item -video_track_timescale 10000 -loglevel 16 ${k}.mp4 </dev/null
    echo "file ${k}.mp4" >> concat_list.txt
    k=$(expr $k + 1)
  done
  $ffmpeg -f concat -safe 0 -i concat_list.txt -loglevel 16 ../output/${ATTENDEE_ID}_full.mp4 </dev/null
fi
cd ../
echo "End concatting process!"

echo "Uploading..."
node ../upload.js $MEETING_ID $ATTENDEE_ID
echo "Uploaded!"
echo "Main process done at $(date "+%T")"

exit 0