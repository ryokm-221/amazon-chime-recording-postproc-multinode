#!/bin/bash
#-----------------------------------------------------------
# Amazon Chime SDK Recording Post-Process Script
#                               for AWS Batch & Docker
#
# Usage: $ sh 001-postprocess.sh
# 
# Update:
#   2021-09-13 Created Ver 1.0.0
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

echo "Processing Meeting: $MEETING_ID"

now=`date "+%s"`
path=./$now/
mkdir $path ; cd $path
mkdir output
echo "Working Dir: $(pwd)"

echo "Main process started at $(date "+%T")"
echo "Begin listing S3 object(s)..."
node /usr/src/getFileList.js $MEETING_ID
number_of_item_audio=`cat ./audio/audio_list.txt | wc -l`
echo "End listing S3 object(s)!"

echo "Begin concatting audio object(s)..."
cd audio
i=1
cat audio_list.txt | while read file; do
  echo "# ${i} $file"
  curl -s $file > ./${i}_audio_org.mp4
  echo "file ${i}_audio_org.mp4" >> audio_concat_list.txt
  i=$(expr $i + 1)
done

/usr/src/bin/ffmpeg -f concat -safe 0 -i audio_concat_list.txt -loglevel 16 ./${MEETING_ID}_audio_full.mp4 </dev/null
cd ../
echo "End concatting audio object(s)!: ${MEETING_ID}_audio_full.mp4"

echo "Begin concatting video object(s)..."
cd video
wd=`pwd`
ls -dl */ | awk '{print $9}' | while read procdir; do
  echo "now processing: $procdir"
  cd $wd/$procdir
  j=1
  cat ./video_list.txt | while read url; do
    echo "# $j $url"
    curl -s $url > ./${j}_video_org.mp4
    j=$(expr $j + 1)
  done

  k=1
  while [ $k -le `cat video_list.txt | wc -l` ]; do
    item=${k}_video_org.mp4
    if [ ! -f $item ]; then
      echo "breaking..."
      break
    fi
    echo "# $k $item"
    /usr/src/bin/ffmpeg -i ./$item -video_track_timescale 10000 -loglevel 16 ./${k}.mp4 </dev/null
    echo "file ${k}.mp4" >> concat_list.txt
    k=$(expr $k + 1)
  done

  /usr/src/bin/ffmpeg -f concat -safe 0 -i concat_list.txt -loglevel 16 ./${procdir:0:36}_full.mp4 </dev/null
  /usr/src/bin/ffmpeg -i ${procdir:0:36}_full.mp4 -i \
    ../../audio/${MEETING_ID}_audio_full.mp4 -c:v copy -c:a aac -loglevel 16 \
    ../../output/${procdir:0:36}.mp4 </dev/null
  echo "processing end: ${MEETING_ID}_${procdir:0:36}_full.mp4"

done
echo "Main process end at $(date "+%T")!"

echo "Zipping necessary files..."
cd ../; pwd
zip -j output.zip output/*.mp4
echo "Zipping completed!"

echo "Upload process..."
cd ../
node /usr/src/upload.js $MEETING_ID /usr/src/$now/output.zip
echo "Upload process completed!"

exit 0