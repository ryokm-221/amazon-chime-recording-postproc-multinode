#!/bin/bash

set -e

LAMBDA_BUCKET="lambdapackage-`date +%s`"
STACKS=$@

createTemporalBucket() {
  echo S3 bucket: "${LAMBDA_BUCKET}" create started
  aws s3 mb "s3://${LAMBDA_BUCKET}" >/dev/null
  echo S3 bucket: "${LAMBDA_BUCKET}" create finished
}

createStacks() {
  for stack in $STACKS; do
    echo CF Stack: "${stack}" create started
    TEMPLATE=$stack.yml
    PACKAGE=$stack-packaged.yml
    rm -f $PACKAGE
    aws cloudformation package --template-file $TEMPLATE --output-template-file $PACKAGE --s3-bucket $LAMBDA_BUCKET > /dev/null
    aws cloudformation create-stack --stack-name $stack --template-body "file://`pwd`/$PACKAGE" --capabilities CAPABILITY_NAMED_IAM > /dev/null
    rm $PACKAGE
    echo CF Stack: "${stack}" create finished
  done
}

waitStackCreation() {
  for stack in $STACKS; do
    STATUS=`aws cloudformation list-stacks --output text | grep STACKSUMMARIES | grep $stack | head -1 | cut -f 6`
    if [ "${STATUS}" = "CREATE_IN_PROGRESS" ]; then
      echo CF Stack: "$stack" is $STATUS, waiting...
      aws cloudformation wait stack-create-complete --stack-name $stack > /dev/null
      STATUS=`aws cloudformation list-stacks --output text | grep STACKSUMMARIES | grep $stack | head -1 | cut -f 6`
      echo CF Stack: "$stack" is $STATUS
    else
      echo CF Stack: "$stack" is $STATUS
    fi
  done
}

removeTemporalBucket() {
  echo S3 bucket: "$LAMBDA_BUCKET" deleting...
  aws s3 rb "s3://$LAMBDA_BUCKET" --force > /dev/null
  echo S3 bucket: "$LAMBDA_BUCKET" delete completed
}

echo deploy started at `date "+%Y/%m/%d %H:%M:%S"`

createTemporalBucket
createStacks
waitStackCreation
removeTemporalBucket

echo deploy finished at `date "+%Y/%m/%d %H:%M:%S"`

exit 0