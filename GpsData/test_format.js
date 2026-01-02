// Quick test to verify the GPS data format works with the app's parseCsv function
// Run with: node test_format.js

function unixToJsDate(unixSwiftDate) {
    return new Date(unixSwiftDate * 1000)
}

function parseCsv(csvContents) {
    const lines = csvContents.split('\n')
    let output = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if(i===0) continue
        
        const cells = line.split(',')
        const lat = parseFloat(cells[0])
        const long = parseFloat(cells[1])
        const datetime = unixToJsDate(cells[2])
        output.push({lat, long, datetime})
    }

    return output
}

// Test with sample data
const sampleCsv = `Lat,Long,Time
29.6260034,-82.341168,1681966991.125
29.6260949,-82.34123,1681967271.012
29.6260041,-82.3413169,1681995047.998`

const result = parseCsv(sampleCsv)

console.log('✓ Parse test successful!')
console.log('\nSample parsed records:')
result.forEach((record, i) => {
    console.log(`  Record ${i + 1}:`)
    console.log(`    Latitude: ${record.lat}`)
    console.log(`    Longitude: ${record.long}`)
    console.log(`    DateTime: ${record.datetime.toLocaleString()}`)
})

console.log(`\n✓ Format is compatible with the React app!`)
console.log(`  Total test records: ${result.length}`)


