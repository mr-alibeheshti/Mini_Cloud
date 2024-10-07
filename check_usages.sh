#!/bin/bash

VG="minicloudVolume"

THRESHOLD=80

EMAIL="user@example.com"
cd /dev/mapper
LV_LIST=$(ls /dev/mapper/${VG}-*)
for LV_PATH in $LV_LIST; do
  LV_NAME=$(basename $LV_PATH)
  USAGE=$(df -P $LV_PATH | awk 'NR==2 {print $5}' | tr -d '%')
  if  (( USAGE > THRESHOLD )) ; then
    MESSAGE="Warning: Volume $LV_NAME is $USAGE% full. Please take action."
    echo "$MESSAGE" | mail -s "LVM Usage Warning" "$EMAIL"
    echo "$MESSAGE" 
  fi
done