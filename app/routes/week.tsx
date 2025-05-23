import type { MetaFunction } from "@vercel/remix";
import { useMemo } from "react";
import { EditableText } from "~/src/EditableText";
import { useSearchParamForInput } from "~/src/useSearchParamForInput";

const PIXELS_PER_HOUR = 60;
const NUM_HOURS_PER_DAY = 12;

type EventItem = {
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  color: string;
  imageUrl: string;
  id: string;
};

export const meta: MetaFunction = ({ location }) => {
  const title =
    new URLSearchParams(location.search).get("title") ??
    "Holiday Week Calendar";

  return [{ title: title }];
};

const defaultEvents = `2025-05-19,09:00,10:30,Team Meeting,#3b82f6,https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop
2025-05-20,14:00,15:00,Client Call,#10b981,https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop
2025-05-21,11:00,12:00,Lunch Break,#f59e0b,https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=200&fit=crop
2025-05-22,16:00,17:30,Project Review,#ef4444,https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=200&fit=crop`;

export default function Week() {
  const [title, setTitle] = useSearchParamForInput(
    "title",
    "Holiday Week Calendar"
  );
  const [eventText, setEventText] = useSearchParamForInput(
    "events",
    defaultEvents
  );

  // Parse events from text
  const events = useMemo(() => {
    return eventText
      .split("\n")
      .filter((line) => line.trim())
      .map((line): EventItem | null => {
        const parts = line.split(",");
        if (parts.length >= 5) {
          const [date, startTime, endTime, name, color, imageUrl] = parts;
          return {
            date: date.trim(),
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            name: name.trim(),
            color: color.trim(),
            imageUrl: imageUrl?.trim() || "",
            id: Math.random().toString(36).substr(2, 9),
          };
        }
        return null;
      })
      .filter((event) => event !== null);
  }, [eventText]);

  // Get week dates based on earliest and latest event
  const getCurrentDatesRange = () => {
    if (events.length === 0) return [];
    // Find earliest and latest event dates
    const sortedEvents = [...events].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const startDate = new Date(sortedEvents[0].date);
    const endDate = new Date(sortedEvents[sortedEvents.length - 1].date);

    // Generate all dates from startDate to endDate inclusive
    const dates: Date[] = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const weekDates = getCurrentDatesRange();
  const days = weekDates.map((date) =>
    date.toLocaleDateString(undefined, { weekday: "short" })
  );

  // Convert time to minutes from midnight
  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Format date to YYYY-MM-DD
  const formatDate = (date: Date) => {
    return (
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0")
    );
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return events.filter((event) => event.date === dateStr);
  };

  // Helper: detect overlaps and assign columns for a day's events
  function assignEventColumns(events: EventItem[]) {
    // Sort by start time
    const sorted = [...events].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
    // Each event gets a column: 0 or 1
    const columns: number[] = [];
    for (let i = 0; i < sorted.length; i++) {
      let col = 0;
      for (let j = 0; j < i; j++) {
        // If overlap, use next column
        const a = sorted[i];
        const b = sorted[j];
        const aStart = timeToMinutes(a.startTime);
        const aEnd = timeToMinutes(a.endTime);
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        // Overlap if start < other's end and end > other's start
        if (aStart < bEnd && aEnd > bStart && columns[j] === col) {
          col++;
        }
      }
      columns[i] = col;
    }
    // Map back to original event order
    return sorted.map((event, i) => ({
      ...event,
      _column: columns[i],
      _overlaps:
        columns.filter((c, idx) => {
          // Count how many events overlap with this one
          const a = sorted[i];
          const b = sorted[idx];
          if (i === idx) return false;
          const aStart = timeToMinutes(a.startTime);
          const aEnd = timeToMinutes(a.endTime);
          const bStart = timeToMinutes(b.startTime);
          const bEnd = timeToMinutes(b.endTime);
          return aStart < bEnd && aEnd > bStart;
        }).length > 0,
    }));
  }

  // Calculate event position and height
  const getEventStyle = (
    event: EventItem & { _column?: number; _overlaps?: boolean }
  ) => {
    const startMinutes = timeToMinutes(event.startTime);
    const endMinutes = timeToMinutes(event.endTime);
    const duration = endMinutes - startMinutes;

    // Calendar starts at 9 AM (540 minutes)
    const calendarStart = 9 * 60;
    const top = ((startMinutes - calendarStart) / 60) * PIXELS_PER_HOUR;
    const height = (duration / 60) * PIXELS_PER_HOUR;

    const isQuestion = event.name.trim().endsWith("?");

    // Overlap logic: if overlaps, set width 50% and left 0% or 50%
    let width = "100%";
    let left = "0";
    if (event._overlaps) {
      width = "75%";
      left = event._column === 1 ? "25%" : "0";
    }

    // Make background semi-transparent if isQuestion
    let backgroundImage = event.imageUrl ? `url(${event.imageUrl})` : "none";
    let filter = undefined;
    if (isQuestion) {
      filter = "grayscale(0.8)";
    }

    return {
      top: `${Math.max(0, top)}px`,
      height: `${Math.max(30, height)}px`,
      left,
      width,
      backgroundImage,
      border: `3px solid ${event.color}`,
      ...(filter ? { filter } : {}),
    };
  };

  // Generate hour labels
  const hours = Array.from({ length: NUM_HOURS_PER_DAY }, (_, i) => i + 9);

  return (
    <div>
      <h1 className="m-6 text-5xl font-bold text-center text-gray-800 print:hidden">
        <EditableText value={title} onChange={setTitle} placeholder="Title" />
      </h1>

      {/* Center the calendar grid horizontally */}
      <div className="flex justify-center">
        <div className="w-full max-w-[1200px] min-w-0 print:w-[1200px] bg-white rounded-lg shadow-lg overflow-hidden mb-8 print:shadow-none print:border-solid print:border-1 print:border-gray-300">
          {/* Header with days */}
          <div
            className={`grid border-b min-w-0`}
            style={{
              gridTemplateColumns: `repeat(${weekDates.length}, minmax(0, 1fr))`,
            }}
          >
            {weekDates.map((date, index) => (
              <div
                key={index}
                className="p-1 bg-gray-100 border-r last:border-r-0 text-center"
              >
                <span className="text-sm font-semibold text-gray-700">
                  {days[index]}
                </span>
                <span className="ml-2 text-xs text-gray-500">{date.getDate()}</span>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div
            className="relative"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${weekDates.length}, minmax(0, 1fr))`,
            }}
          >
            {/* Days columns */}
            {weekDates.map((date, dayIndex) => {
              // Assign columns for overlapping events
              const dayEvents = getEventsForDate(date);
              const eventsWithColumns = assignEventColumns(dayEvents);
              return (
                <div
                  key={dayIndex}
                  className="border-r last:border-r-0 relative bg-white"
                >
                  {/* Hour slots */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="border-b border-gray-100"
                      style={{
                        height: `${PIXELS_PER_HOUR}px`,
                      }}
                    ></div>
                  ))}

                  {/* Events for this day */}
                  {eventsWithColumns.map((event) => (
                    <div
                      key={event.id}
                      className="absolute right-1 rounded-md border border-white/20 shadow-sm overflow-hidden bg-cover bg-center"
                      style={getEventStyle(event)}
                    >
                      <div className="p-px h-full flex flex-col justify-start relative z-10">
                      {(() => {
                        const startMinutes = timeToMinutes(event.startTime);
                        const endMinutes = timeToMinutes(event.endTime);
                        const duration = endMinutes - startMinutes;
                        if (duration > 30) {
                        // Time range below name
                        return (
                          <>
                            <span
                            className="backdrop-blur-md text-white text-sm font-medium rounded px-2 py-px whitespace-nowrap min-w-0 inline-block overflow-hidden"
                            style={{
                              backgroundColor: event.color,
                              // textShadow:
                              // "rgba(0, 0, 0, 1) 0 0 1px, rgba(0, 0, 0, 0.5) 0 0 5px",
                              width: "fit-content",
                              maxWidth: "100%",
                            }}
                            >
                            {event.name}
                            </span>
                          <span
                            className="backdrop-blur-md bg-black/30 text-white text-xs rounded px-0.5 whitespace-nowrap opacity-90 mt-px flex-shrink-0 inline-block"
                            style={{
                              textShadow:
                                "rgba(0, 0, 0, 1) 0 0 1px, rgba(0, 0, 0, 0.5) 0 0 5px",
                              width: "fit-content",
                              maxWidth: "100%",
                            }}
                          >
                            <TimeRange
                              start={event.startTime}
                              end={event.endTime}
                            />
                          </span>
                          </>
                        );
                        } else {
                        // Time range to the right of name
                        return (
                          <div className="flex items-start justify-between gap-2">
                          <span
                            className="backdrop-blur-md text-white text-sm font-medium rounded px-2 py-px whitespace-nowrap min-w-0 inline-block overflow-hidden"
                            style={{
                              backgroundColor: event.color,
                            // textShadow:
                            //   "rgba(0, 0, 0, 1) 0 0 1px, rgba(0, 0, 0, 0.5) 0 0 5px",
                            }}
                          >
                            {event.name}
                          </span>
                          <span
                            className="backdrop-blur-md bg-black/30 text-white text-xs rounded px-0.5 whitespace-nowrap opacity-90 ml-2 flex-shrink-0"
                            style={{
                            textShadow:
                              "rgba(0, 0, 0, 1) 0 0 1px, rgba(0, 0, 0, 0.5) 0 0 5px",
                            }}
                          >
                            <TimeRange
                            start={event.startTime}
                            end={event.endTime}
                            />
                          </span>
                          </div>
                        );
                        }
                      })()}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Input */}
      <div className="bg-white rounded-lg shadow-lg p-6 print:hidden">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Event Input
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          Format: date,start_time,end_time,name,color,image_url (one event per
          line)
        </p>
        <textarea
          value={eventText}
          onChange={(e) => setEventText(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-nowrap"
          placeholder="2025-05-19,09:00,10:30,Team Meeting,#3b82f6,https://example.com/image.jpg"
          // @ts-expect-error
          style={{ fieldSizing: "content" }}
        />
        <div className="mt-3 text-xs text-gray-500">
          <strong>Example colors:</strong> #3b82f6 (blue), #10b981 (green),
          #f59e0b (yellow), #ef4444 (red)
        </div>
      </div>
    </div>
  );
}

const TimeRange = ({ start, end }: { start: string; end: string }) => {
  const formatStart = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const hour = h % 12 === 0 ? 12 : h % 12;
    return m === 0 ? `${hour}` : `${hour}:${m.toString().padStart(2, "0")}`;
  };
  const formatEnd = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const hour = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? "am" : "pm";
    return m === 0
      ? `${hour}${ampm}`
      : `${hour}:${m.toString().padStart(2, "0")}${ampm}`;
  };
  return `${formatStart(start)}-${formatEnd(end)}`;
};
