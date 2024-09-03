#!/bin/bash
#run cronJob ->  * */12 * * * /Volumes/check_usages.sh > /Volumes/log.txt
directory="/Volumes"
threshold=80
block_size=1024

for file in "$directory"/*.loop; do
    if [ -f "$file" ]; then
        file_size=$(stat -c %s "$file")

        used_blocks=$(du -s "$file" | awk '{print $1}')

        used_space=$((used_blocks * block_size))

        percent_used=$(echo "scale=2; ($used_space / $file_size) * 100" | bc)

        echo "$file: $percent_used% used"

        if (( $(echo "$percent_used > $threshold" | bc -l) )); then
            email=$(basename "$file" | awk -F'_' '{print $1}')
            email="$email"

            echo "Warning: $file is using more than 80% of its allocated space!" | mail -s "Disk Usage Warning" "$email"
            echo "Alert sent to: $email"
        fi
    fi
done
