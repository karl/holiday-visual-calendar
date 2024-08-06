import { addDays, format, getDay, isValid, parse, set } from "date-fns";
import type { MetaFunction } from "@vercel/remix";
import { useSearchParams } from "@remix-run/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const shouldRevalidate = () => {
  return false;
};

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

type DayColor =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "purple"
  | "pink";

type ColorInfo = {
  background: string;
  labelBackground: string;
  border: string;
};

const colors: Record<DayColor, ColorInfo> = {
  red: {
    background: "bg-red-100",
    labelBackground: "bg-red-600",
    border: "border-red-600",
  },
  orange: {
    background: "bg-orange-100",
    labelBackground: "bg-orange-500",
    border: "border-orange-500",
  },
  yellow: {
    background: "bg-yellow-100",
    labelBackground: "bg-yellow-500",
    border: "border-yellow-500",
  },
  green: {
    background: "bg-green-100",
    labelBackground: "bg-green-600",
    border: "border-green-600",
  },
  teal: {
    background: "bg-teal-100",
    labelBackground: "bg-teal-600",
    border: "border-teal-600",
  },
  blue: {
    background: "bg-blue-100",
    labelBackground: "bg-blue-500",
    border: "border-blue-500",
  },
  purple: {
    background: "bg-purple-100",
    labelBackground: "bg-purple-500",
    border: "border-purple-500",
  },
  pink: {
    background: "bg-pink-100",
    labelBackground: "bg-pink-500",
    border: "border-pink-500",
  },
};

type Day = {
  type?: "blank";
  description?: string;
  color?: DayColor;
  image?: string;
};

const defaultStartDate = format(new Date(), "yyyy-MM-dd");

const defaultEvents = `Home, blue, https://tjh.com/wp-content/uploads/2023/06/TJH_HERO_TJH-HOME@2x-1-1536x1021.webp
Holiday, orange, https://www.travelsupermarket.com/cdn-cgi/image/f=auto,width=495,height=500,fit=cover,quality=75/sonic/image/source/holiday-type/summer/holidaytype-summer.jpg`;

const parseEvents = (events: string): Array<Day> => {
  return events
    .split("\n")
    .map((event) => {
      const [description, color, image] = event.split(", ");
      return {
        description,
        color: color as DayColor,
        image,
      };
    })
    .filter((event) => event.description);
};

export const useSearchParamForInput = (
  key: string,
  defaultValue: string
): [string, (newValue: string) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) || defaultValue;

  const [tempValue, setTempValue] = useState(value);
  const ignoreNextUpdateRef = useRef(false);

  if (value !== tempValue && !ignoreNextUpdateRef.current) {
    setTempValue(value);
  }

  useEffect(() => {
    ignoreNextUpdateRef.current = false;
  }, [value]);

  const setValue = useCallback(
    (newValue: string) => {
      ignoreNextUpdateRef.current = true;
      setTempValue(newValue);
      setSearchParams(
        (prev) => {
          prev.set(key, newValue);
          return prev;
        },
        { preventScrollReset: true }
      );
    },
    [key, setSearchParams]
  );

  return [value, setValue];
};

export default function Index() {
  const [title, setTitle] = useSearchParamForInput("title", "Holiday Calendar");
  const [start, setStart] = useSearchParamForInput("start", defaultStartDate);
  const [events, setEvents] = useSearchParamForInput("events", defaultEvents);

  let startDate = parse(start, "yyyy-MM-dd", new Date());
  if (!isValid(startDate)) {
    startDate = parse(defaultStartDate, "yyyy-MM-dd", new Date());
  }

  const days = useMemo(() => parseEvents(events), [events]);

  // Add padding days to the beginning and end of the month
  let dayOfWeekStart = getDay(startDate);
  if (dayOfWeekStart === 0) {
    dayOfWeekStart = 7;
  }
  const numPaddingDaysBeginning = dayOfWeekStart - 1;
  let dayOfWeekEnd = getDay(addDays(startDate, days.length - 1));
  if (dayOfWeekEnd === 0) {
    dayOfWeekEnd = 7;
  }
  const numPaddingDaysEnding = 7 - dayOfWeekEnd;

  const paddedDays = [...days];
  paddedDays.unshift(
    ...[...Array(numPaddingDaysBeginning)].map((): Day => ({ type: "blank" }))
  );
  paddedDays.push(
    ...[...Array(numPaddingDaysEnding)].map((): Day => ({ type: "blank" }))
  );

  // split days into weeks
  const weeks = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  return (
    <>
      <h1 className="m-6 text-5xl font-bold text-center text-gray-800 print:hidden">
        {title}
      </h1>
      <div
        className="flex flex-col gap-2 p-4"
        style={{ WebkitPrintColorAdjust: "exact" }}
      >
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className="flex justify-center gap-2 break-inside-avoid-page"
          >
            {week.map((day, dayIndex) => {
              if (day.type === "blank") {
                return <div key={dayIndex} className="size-36" />;
              }

              const date = format(
                addDays(
                  startDate,
                  weekIndex * 7 + dayIndex - numPaddingDaysBeginning
                ),
                "E do"
              );
              const color = day.color || "blue";
              const colorInfo = colors[color];

              return (
                <div
                  key={dayIndex}
                  className={`size-36 rounded-md ${colorInfo.background} border-solid border-4 ${colorInfo.border} p-1 flex flex-col justify-between bg-cover bg-center`}
                  style={{
                    backgroundImage: `url(${day.image})`,
                  }}
                >
                  <div>
                    <p
                      className="float-right px-1 text-sm text-white bg-black rounded-sm bg-opacity-15"
                      style={{ textShadow: "rgba(0, 0, 0, 0.3) 0 0 3px" }}
                    >
                      {date}
                    </p>
                  </div>
                  <h2
                    className={`text-sm font-bold text-white ${colorInfo.labelBackground} rounded-sm text-center px-1 size`}
                  >
                    {day.description}
                  </h2>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <details className="p-4 print:hidden">
        <summary className="p-2 bg-gray-100 border border-gray-500 border-solid rounded cursor-pointer">
          Edit
        </summary>

        <EditHolidayCalendar
          title={title}
          onTitleChange={(newTitle) => setTitle(newTitle)}
          start={start}
          onStartChange={(newStart) => setStart(newStart)}
          events={events}
          onEventsChange={(newEvents) => setEvents(newEvents)}
        />
      </details>
    </>
  );
}

type EditHolidayCalendarProps = {
  title: string;
  onTitleChange: (title: string) => void;
  start: string;
  onStartChange: (start: string) => void;
  events: string;
  onEventsChange: (events: string) => void;
};

export const EditHolidayCalendar = ({
  title,
  onTitleChange,
  start,
  onStartChange,
  events,
  onEventsChange,
}: EditHolidayCalendarProps) => {
  return (
    <div className="p-4 mt-2 bg-gray-100">
      <div className="mb-4">
        <label
          htmlFor="title"
          className="block mb-2 text-sm font-bold text-gray-700"
        >
          Title
        </label>
        <input
          id="title"
          type="text"
          name="title"
          className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
          value={title}
          onChange={(event) => {
            onTitleChange(event.target.value);
          }}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="startDate"
          className="block mb-2 text-sm font-bold text-gray-700"
        >
          Start Date
        </label>
        <input
          id="startDate"
          type="text"
          name="startDate"
          className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
          value={start}
          onChange={(event) => {
            onStartChange(event.target.value);
          }}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="events"
          className="block mb-2 text-sm font-bold text-gray-700"
        >
          Events
        </label>
        <textarea
          id="events"
          name="events"
          className="w-full px-3 py-2 text-gray-700 border rounded shadow appearance-none text-nowrap leading focus:outline-none focus:shadow-outline"
          // @ts-expect-error
          style={{ fieldSizing: "content" }}
          value={events}
          onChange={(event) => {
            onEventsChange(event.target.value);
          }}
        />
      </div>
    </div>
  );
};