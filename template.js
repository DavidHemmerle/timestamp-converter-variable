﻿const makeInteger = require('makeInteger');
const Math = require('Math');
const getTimestampMillis = require('getTimestampMillis');
const makeString = require('makeString');
const log = require('logToConsole');
//log(getTimestampMillis());

const leapYear = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const nonLeapYear = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const secToMs = (s) => s * 1000;
const minToMs = (m) => m * secToMs(60);
const hoursToMs = (h) => h * minToMs(60);
const daysToMs = (d) => d * hoursToMs(24);
const padStart = (value, length) => {
  let result = makeString(value); 
  while (result.length < length) {
    result = '0' + result;
  }
  return result;
};

function convertTimestampToISO(timestamp, offset) {
  //log(timestamp + " " + offset);
  const fourYearsInMs = daysToMs(365 * 4 + 1);
  let year = 1970 + Math.floor(timestamp / fourYearsInMs) * 4;
  timestamp = timestamp % fourYearsInMs;

  while (true) {
    let isLeapYear = year % 4 === 0;
    let nextTimestamp = timestamp - daysToMs(isLeapYear ? 366 : 365);
    if (nextTimestamp < 0) {
      break;
    }
    timestamp = nextTimestamp;
    year = year + 1;
  }

  const daysByMonth = year % 4 === 0 ? leapYear : nonLeapYear;

  let month = 0;
  for (let i = 0; i < daysByMonth.length; i++) {
    let msInThisMonth = daysToMs(daysByMonth[i]);
    if (timestamp > msInThisMonth) {
      timestamp = timestamp - msInThisMonth;
    } else {
      month = i + 1;
      break;
    }
  }
  let date = Math.ceil(timestamp / daysToMs(1));
  timestamp = timestamp - daysToMs(date - 1);
  let hours = Math.floor(timestamp / hoursToMs(1));
  timestamp = timestamp - hoursToMs(hours);
  let minutes = Math.floor(timestamp / minToMs(1));
  timestamp = timestamp - minToMs(minutes);
  let sec = Math.floor(timestamp / secToMs(1));
  timestamp = timestamp - secToMs(sec);
  let milliSeconds = timestamp;
  
  let offsetISO = offset ? offset / (1000*60*60) : 0;
  let offsetSeparator = offsetISO < 0 ? '-' : '+';
      
  return (
    year +
    '-' +
    padStart(month, 2) +
    '-' +
    padStart(date, 2) +
    'T' +
    //padStart(hours, 2) +
    (padStart(hours, 2) === "24" ? "00" : padStart(hours, 2)) +
    ':' +
    padStart(minutes, 2) +
    ':' +
    padStart(sec, 2) +
    '.' +
    padStart(milliSeconds, 3) +
    offsetSeparator + 
    padStart(offsetISO, 2) +
    ':00'
  );
}

function convertISOToTime(dateTime) {
  const dateArray = dateTime.split('T')[0].split('-');
  const timeArray = dateTime.split('T')[1].split(':');
  
  let offsetTime = 0;
  if (dateTime.indexOf("+") > 0 || dateTime.indexOf("-") > 0) {
    let seperator = dateTime.indexOf("+") > 0 ? "+" : "-";
    let multiplicator = dateTime.indexOf("+") > 0 ? -1 : 1;
    const offsetArray = dateTime.split(seperator)[1].split(':');
    offsetTime = (makeInteger(offsetArray[0]) * 3600) + (makeInteger(offsetArray[1]) * 60);
    offsetTime = offsetTime * multiplicator; 
    //log(offsetTime);
  }

  const year = makeInteger(dateArray[0]);
  const month = makeInteger(dateArray[1]);
  const day = makeInteger(dateArray[2]);
  const hour = makeInteger(timeArray[0]);
  const minutes = makeInteger(timeArray[1]);
  const seconds = makeInteger(timeArray[2]);

  let yearCounter = 1970;
  let unixTime = 0;

  while (yearCounter < year) {
    if (yearCounter % 4 === 0) {
      unixTime += 31622400;
    } else {
      unixTime += 31536000;
    }
    yearCounter++;
  }

  const monthList = yearCounter % 4 === 0 ? leapYear : nonLeapYear; 

  let monthCounter = 1;
  while (monthCounter < month) {
    unixTime += monthList[monthCounter - 1] * 86400;
    monthCounter++;
  }

  let dayCounter = 1;
  while (dayCounter < day) {
    unixTime += 86400;
    dayCounter++;
  }

  let hourCounter = 0;
  while (hourCounter < hour) {
    unixTime += 3600;
    hourCounter++;
  }

  let minutesCounter = 0;
  while (minutesCounter < minutes) {
    unixTime += 60;
    minutesCounter++;
  }

  let secondsCounter = 0;
  while (secondsCounter < seconds) {
    unixTime += 1;
    secondsCounter++;
  }

  return unixTime + offsetTime;
}

const type = data.type;

if (type === 'to_iso') {
  let offset = makeInteger(data.offsetIso);
  let timestamp = makeInteger(data.timestamp);
  
  return convertTimestampToISO(
    data.timestamp === 'current_timestamp' || !data.timestamp || ((data.timestamp.length < 13 || data.timestamp < 9999999999) && data.timestampFormat === "msecs")
      ? (getTimestampMillis() + offset)
      : (data.timestampFormat === "seconds" ? timestamp*1000 + offset : timestamp + offset),
    offset
  );
} else if (type === 'to_timestamp') {
  return makeInteger(convertISOToTime(data.iso8601DateTime));
} else {
  return 'Invalid type';
}