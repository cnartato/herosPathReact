export function addHours(date, add) {
    let newDate = new Date(date)
    newDate.setTime(newDate.getTime() + (add*60*60*1000));
    return newDate;
}
export function unixToJsDate(unixSwiftDate)
{
    return new Date(unixSwiftDate * 1000)
}

// Home coordinates (Gainesville, FL area)
const HOME_LAT = 29.6260028;
const HOME_LONG = -82.3411691;
const HOME_RADIUS = 0.005; // ~0.5 km radius

export function isAtHome(lat, long) {
    const latDiff = Math.abs(lat - HOME_LAT);
    const longDiff = Math.abs(long - HOME_LONG);
    const distance = Math.sqrt(latDiff * latDiff + longDiff * longDiff);
    return distance < HOME_RADIUS;
}

export function findPosesWithinPeriod(timeA, timeB, uploadedPoses) {
    let start = new Date(timeA)
    let end = new Date(timeB)

    return uploadedPoses.filter(pose => {
        let poseTime = new Date(pose.datetime);
        let isInTimeRange = poseTime >= start && poseTime <= end;
        let notAtHome = !isAtHome(pose.lat, pose.long);
        return isInTimeRange && notAtHome;
    })
}

export function formInterpolatedPoint(mostRecentEstablishedPos,upcomingEstablishedPos, currentTime)
{
    let timeDistanceBetweenPoints = Math.abs(upcomingEstablishedPos.datetime - mostRecentEstablishedPos.datetime)
    let timeDistanceFromUpcomingEstablishedPos = Math.abs(currentTime - upcomingEstablishedPos.datetime)
    let timeDistanceFromMostRecentEstablishedPos = Math.abs(currentTime - mostRecentEstablishedPos.datetime)

    let timeDistanceFromUpcomingEstablishedPosPercentage = 1 - (timeDistanceFromUpcomingEstablishedPos / timeDistanceBetweenPoints)
    let timeDistanceFromMostRecentEstablishedPosPercentage = 1 - (timeDistanceFromMostRecentEstablishedPos / timeDistanceBetweenPoints)

    return [
        ((mostRecentEstablishedPos.lat * timeDistanceFromMostRecentEstablishedPosPercentage) + (upcomingEstablishedPos.lat * timeDistanceFromUpcomingEstablishedPosPercentage)),
        ((mostRecentEstablishedPos.long * timeDistanceFromMostRecentEstablishedPosPercentage) + (upcomingEstablishedPos.long * timeDistanceFromUpcomingEstablishedPosPercentage)),
    ]
}
export function findFutureEstablishedPosOutsidePeriod(currentTime, uploadedPoses) {
    let end = new Date(currentTime);
    
        return uploadedPoses
        .filter(pose => new Date(pose.datetime) > end && !isAtHome(pose.lat, pose.long)) // get only future poses not at home
        .sort((a, b) => new Date(a.datetime) - new Date(b.datetime)) // sort ascending
        .find(() => true) || null; // get the first one or return null
    }

    export function findLastEstablishedPos(currentTime, uploadedPoses) {
        let end = new Date(currentTime);
        
            return uploadedPoses
            .filter(pose => new Date(pose.datetime) <= end && !isAtHome(pose.lat, pose.long)) // get only past poses not at home
            .sort((a, b) => new Date(b.datetime) - new Date(a.datetime)) // sort ascending
            .find(() => true) || null; // get the first one or return null
        }

    export function findLastEstablishedPosIncludingHome(currentTime, uploadedPoses) {
        let end = new Date(currentTime);
        
            return uploadedPoses
            .filter(pose => new Date(pose.datetime) <= end) // get only past poses INCLUDING home
            .sort((a, b) => new Date(b.datetime) - new Date(a.datetime)) // sort descending
            .find(() => true) || null; // get the first one or return null
        }

export function parseCsv (csvContents) {
    const lines = csvContents.split('\n')

    let output = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if(i===0) continue
      
      const cells = line.split(',')
      const lat = parseFloat(cells[0])
      const long = parseFloat(cells[1])
      const datetime = unixToJsDate(cells[2])
      
      // Skip invalid entries (NaN or Invalid Date)
      if (isNaN(lat) || isNaN(long) || isNaN(datetime.getTime())) {
        continue
      }
      
      output.push({lat, long, datetime})
    }

    return output //setUploadedPos(output)
}

export function trimPath(path, length)
{
    while (path.length > length) {
        path.shift()
    }
}