#!/bin/bash

set -e

BUCKET="buildtmp"
SOURCES=$@

uploadSourceFile() {
  mkdir -p ../tmp/
  for item in $SOURCES; do
    echo Zipping $item files...
    (cd ../src/finish-process/ && zip -r ../../tmp/$item.zip .)
    echo Zipping $item files complted, uploading to s3://$BUCKET/$item.zip
    aws s3 cp ../tmp/$item.zip s3://$BUCKET/$item.zip > /dev/null
    echo Uploading $item completed
  done
  rm -rf ../tmp/
}

createStacks() {
  for item in $SOURCES; do
    echo CF Stack: $item create started
    PACKAGE=$item.yml
    aws cloudformation create-stack --stack-name $item --template-body "file://`pwd`/$PACKAGE" --capabilities CAPABILITY_NAMED_IAM > /dev/null
    echo CF Stack: $item create finished
  done
}

echo deploy started at `date "+%Y/%m/%d %H:%M:%S"`

uploadSourceFile
createStacks

echo deploy finished at `date "+%Y/%m/%d %H:%M:%S"`
exit 0