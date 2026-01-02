# GPS Data Files - Format Guide

## Files Created

### 1. GpsData_Reconciled.csv
**Location:** `GpsData/GpsData_Reconciled.csv`

**Purpose:** Human-readable master file with all GPS data from all sources

**Format:**
```csv
datetime,date,time,latitude,longitude,timestamp,accuracy,source
2023-04-20 01:03:11,2023-04-20,01:03:11,29.6260034,-82.341168,1681966991.125,15,GoogleTakeoutHistory.csv
```

**Stats:**
- 20,623 unique GPS points
- Spans: April 20, 2023 → December 18, 2025
- Data gap: September 7, 2024 → February 11, 2025 (source data unavailable)

---

### 2. GpsData_ForApp.csv ⭐
**Locations:** 
- `GpsData/GpsData_ForApp.csv` (source)
- `public/GpsData_ForApp.csv` (ready for app use)

**Purpose:** GPS data formatted for the React app

**Format:**
```csv
Lat,Long,Time
29.6260034,-82.341168,1681966991.125
29.6260949,-82.34123,1681967271.012
```

**Column Order (CRITICAL):**
1. `Lat` - Latitude (float)
2. `Long` - Longitude (float)
3. `Time` - Unix timestamp in seconds (float)

This matches the expected format in `src/Helper.js`:
```javascript
const lat = parseFloat(cells[0])      // Column 0: Latitude
const long = parseFloat(cells[1])     // Column 1: Longitude  
const datetime = unixToJsDate(cells[2])  // Column 2: Unix timestamp
```

**Stats:**
- 20,623 GPS points
- File size: 828 KB
- ✅ Verified compatible with parseCsv()

---

## Scripts

### convert_for_app.py
Converts the reconciled CSV to app-compatible format.

**Usage:**
```bash
cd GpsData
python3 convert_for_app.py
```

This will:
1. Read `GpsData_Reconciled.csv`
2. Extract latitude, longitude, and timestamp
3. Write to `GpsData_ForApp.csv` in correct column order

### test_format.js
Tests that the CSV format works with the app's parser.

**Usage:**
```bash
cd GpsData
node test_format.js
```

---

## Using the GPS Data in Your App

### Option 1: Debug Mode (Auto-load)
In `src/App.js`, set:
```javascript
const DEBUGMODE = true
```

Then update the fetch path to use the new file:
```javascript
const response = await (await fetch('/GpsData_ForApp.csv')).text()
```

### Option 2: File Upload (Default)
1. Run the app
2. Click the file input at the top-left
3. Select `public/GpsData_ForApp.csv`
4. The map will animate your GPS history!

---

## Data Gap Information

⚠️ **Missing Data:** September 7, 2024 → February 11, 2025 (~5 months)

**Last record before gap:**
- Date: September 7, 2024 at 2:50:40 AM
- Location: Charlotte, NC area (35.1292°N, 80.9908°W)

**First record after gap:**
- Date: February 11, 2025 at 10:26:38 AM  
- Location: Florida (29.6260°N, 82.3411°W)

**To fill this gap:**
- Export newer Google Takeout location data
- Check for other location tracking apps/services from that period
- Re-run `convert_for_app.py` after adding new source files

---

## File Locations Reference

```
herosPathReact/
├── GpsData/
│   ├── GpsData_Reconciled.csv      # Master file (all data)
│   ├── GpsData_ForApp.csv          # App-compatible format
│   ├── convert_for_app.py          # Conversion script
│   ├── test_format.js              # Format verification
│   └── [source files...]           # Original GPS data
└── public/
    └── GpsData_ForApp.csv          # App-ready file ⭐
```


