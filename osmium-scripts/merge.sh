#!/bin/sh

sorted_countries=($(echo "$@" | tr ' ' '\n' | sort))

output_file="data/"
output_file+=$(IFS=-; echo "${sorted_countries[*]}")  # Join with '-'
output_file+="-rail.osm.pbf"

command="osmium merge -O -o $output_file"

for country in "${sorted_countries[@]}"; do
    command="$command data/$country-rail.osm.pbf"
done

eval "$command"
echo "Merged $(IFS=" "; echo "${sorted_countries[*]}") into $output_file"
