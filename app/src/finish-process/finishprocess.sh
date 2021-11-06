#!/bin/bash
#------------------------------------------------------
# Amazon Chime SDK Recording Script for Finish Process
#------------------------------------------------------

set -e

echo "------------------------------------------------------"
echo "Amazon Chime SDK Recording Script for Finish Process"
echo "Current NodeJS Version: $(node -v)"
echo "------------------------------------------------------"

MEETINGID=$meetingId
ffmpeg="../../bin/ffmpeg"

echo "Main Process started at $(date "+%T")"
echo "Processing: $MEETINGID"

now=`date "+%s"`
path=./$now/
mkdir $path; cd $path
mkdir tmp output
echo "Working Dir: $(pwd)"

echo "Begin downloading S3 object(s)..."
node ../download.js $MEETINGID
echo "Download completed!"

echo "Begin merging audio and video..."
cd ./tmp
number_of_item=`cat list.txt | wc -l`
i=1
cat list.txt | while read file; do
  echo "#$i/$number_of_item $file"
  $ffmpeg -itsoffset 0.67 -i $file -i audio_full.mp4 -c:v copy -c:a aac -loglevel 16 \
    ../output/$file </dev/null
  i=$(expr $i + 1)
done
echo "Merging audio and video completed!"

echo "Zipping and uploading..."
cd ../output
zip -r ${MEETINGID}_full.zip . </dev/null
node ../../upload.js $MEETINGID
echo "Zipping and uploading completed!"

echo "Main Process ended at $(date "+%T")"

exit 0