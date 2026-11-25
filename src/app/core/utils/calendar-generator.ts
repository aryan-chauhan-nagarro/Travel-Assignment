import { Booking } from '../models';

/**
 * ==============================================================================
 * iCalendar (.ics) Generator & Downloader
 * ==============================================================================
 * Interview Concept:
 * - Implements the international RFC 5545 iCalendar standard.
 * - Formats reservation metadata (start date, end date, summary, location, confirmation code).
 * - Creates an in-memory binary Blob (`text/calendar;charset=utf-8`).
 * - Spawns a programmatic `<a download>` click to trigger an instant browser file download.
 * - Universal compatibility: Imports seamlessly into Google Calendar, Apple Calendar, and Outlook.
 * ==============================================================================
 */

/**
 * Generates an RFC 5545 standard .ics iCalendar file string
 */
export function generateIcsContent(booking: Booking): string {
  const formatDate = (dateStr: string) => {
    // Format YYYY-MM-DD to YYYYMMDD
    return dateStr.replace(/-/g, '');
  };

  const startDate = formatDate(booking.checkIn);
  // End date for full-day event should be day after checkout or checkout date
  const endDate = formatDate(booking.checkOut);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const title = `Stay at ${booking.hotelName || 'Curated Hotel'} (${booking.roomTitle || 'Room'})`;
  const description = `Reservation code: ${booking.confirmationCode}\\nGuests: ${booking.guests}\\nTotal: ₹${booking.priceBreakdown?.total || 0}\\nCancellation: Free cancellation up to 48 hours before check-in.`;
  const location = booking.address || 'Hotel Location';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Travel Booking Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.confirmationCode}-${startDate}@travelbooking.com`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${startDate}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Triggers a browser download of the generated .ics file
 */
export function downloadIcsFile(booking: Booking): void {
  const icsData = generateIcsContent(booking);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `booking-${booking.confirmationCode}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
