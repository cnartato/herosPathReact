#!/usr/bin/env python3
"""
Convert reconciled GPS data to the format expected by the React app.
App expects: Lat,Long,Time (unix timestamp)
"""

import csv
from pathlib import Path

def main():
    script_dir = Path(__file__).parent
    input_file = script_dir / "GpsData_Reconciled.csv"
    output_file = script_dir / "GpsData_ForApp.csv"
    
    print(f"Converting {input_file.name} to app-compatible format...")
    
    records_written = 0
    
    with open(input_file, 'r', encoding='utf-8') as infile, \
         open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        
        reader = csv.DictReader(infile)
        writer = csv.writer(outfile)
        
        # Write header in the format the app expects
        writer.writerow(['Lat', 'Long', 'Time'])
        
        for row in reader:
            try:
                lat = float(row['latitude'])
                lon = float(row['longitude'])
                timestamp = float(row['timestamp'])
                
                # Write in the order: Lat, Long, Time (unix timestamp)
                writer.writerow([lat, lon, timestamp])
                records_written += 1
                
            except (ValueError, KeyError) as e:
                print(f"Skipping invalid row: {e}")
                continue
    
    print(f"\n✓ Successfully created {output_file.name}")
    print(f"  Records written: {records_written:,}")
    print(f"\nFormat: Lat,Long,Time (unix timestamp)")
    print(f"This file is ready to use with your React app!")

if __name__ == "__main__":
    main()


