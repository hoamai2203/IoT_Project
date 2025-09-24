const moment = require('moment');
const { DATE_FORMATS } = require('./constants');

class DateHelper {
  static format(date, format = DATE_FORMATS.DATETIME) {
    if (!date) return null;
    return moment(date).format(format);
  }

  static parse(dateString, format = DATE_FORMATS.DATETIME) {
    if (!dateString) return null;
    const parsed = moment(dateString, format, true);
    return parsed.isValid() ? parsed.toDate() : null;
  }

  static now() {
    return new Date();
  }

  static nowISO() {
    return moment().toISOString();
  }

  static add(date, amount, unit = 'days') {
    return moment(date).add(amount, unit).toDate();
  }

  static subtract(date, amount, unit = 'days') {
    return moment(date).subtract(amount, unit).toDate();
  }

  static isValid(date) {
    return moment(date).isValid();
  }

  static isBefore(date1, date2) {
    return moment(date1).isBefore(moment(date2));
  }

  static isAfter(date1, date2) {
    return moment(date1).isAfter(moment(date2));
  }

  static startOfDay(date) {
    return moment(date).startOf('day').toDate();
  }

  static endOfDay(date) {
    return moment(date).endOf('day').toDate();
  }

  static startOfMonth(date) {
    return moment(date).startOf('month').toDate();
  }

  static endOfMonth(date) {
    return moment(date).endOf('month').toDate();
  }

  static diff(date1, date2, unit = 'days') {
    return moment(date1).diff(moment(date2), unit);
  }

  static fromNow(date) {
    return moment(date).fromNow();
  }

  static humanizeRange(startDate, endDate) {
    const start = moment(startDate);
    const end = moment(endDate);
    
    if (start.isSame(end, 'day')) {
      return start.format('MMM DD, YYYY');
    } else if (start.isSame(end, 'month')) {
      return `${start.format('MMM DD')} - ${end.format('DD, YYYY')}`;
    } else if (start.isSame(end, 'year')) {
      return `${start.format('MMM DD')} - ${end.format('MMM DD, YYYY')}`;
    } else {
      return `${start.format('MMM DD, YYYY')} - ${end.format('MMM DD, YYYY')}`;
    }
  }

  static parseDateRange(startDate, endDate) {
    const result = {
      start: null,
      end: null,
      isValid: false
    };
    
    if (startDate) {
      result.start = this.parse(startDate, DATE_FORMATS.DATE);
      if (!result.start) {
        result.start = this.parse(startDate, DATE_FORMATS.DATETIME);
      }
    }
    
    if (endDate) {
      result.end = this.parse(endDate, DATE_FORMATS.DATE);
      if (!result.end) {
        result.end = this.parse(endDate, DATE_FORMATS.DATETIME);
      }

      if (result.end) {
        result.end = this.endOfDay(result.end);
      }
    }
    
    result.isValid = result.start && result.end ? 
      this.isBefore(result.start, result.end) : 
      (result.start || result.end);
    
    return result;
  }
}

module.exports = DateHelper;
