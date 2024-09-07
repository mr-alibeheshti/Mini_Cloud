#!/bin/bash

VG="minicloudVolume"

THRESHOLD=80

EMAIL="user@example.com"

LV_LIST=$(ls /dev/mapper/${VG}-*)

for LV_PATH in $LV_LIST; do
  LV_NAME=$(basename $LV_PATH)
  
  USAGE=$(df -h | grep "$LV_PATH" | awk '{print $5}' | tr -d '%' | head -n 1)
  if  (( USAGE > THRESHOLD )) ; then
    MESSAGE="Warning: Volume $LV_NAME is $USAGE% full. Please take action."
    echo "$MESSAGE" | mail -s "LVM Usage Warning" "$EMAIL"
    echo "$MESSAGE" 
  fi
done
