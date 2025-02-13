import { addDays, format, getDay, isValid, parse } from "date-fns";
import type { MetaFunction } from "@vercel/remix";
import { useSearchParams } from "@remix-run/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export const shouldRevalidate = () => {
  return false;
};

export const meta: MetaFunction = ({ location }) => {
  const title =
    new URLSearchParams(location.search).get("title") ?? "Holiday Calendar";

  return [{ title: title }];
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
  name?: string;
  description?: string;
  color?: DayColor;
  image?: string;
};

const defaultStartDate = format(new Date(), "yyyy-MM-dd");

const defaultEvents = `Home, blue, Daddy, https://tjh.com/wp-content/uploads/2023/06/TJH_HERO_TJH-HOME@2x-1-1536x1021.webp
Holiday, orange, https://www.travelsupermarket.com/cdn-cgi/image/f=auto,width=495,height=500,fit=cover,quality=75/sonic/image/source/holiday-type/summer/holidaytype-summer.jpg`;

const parseEvents = (events: string): Array<Day> => {
  return events
    .split("\n")
    .map((event) => {
      const [description, color, imageOrName, image] = event.split(", ");

      return {
        description,
        color: color as DayColor,
        image: image ?? imageOrName,
        name: image ? imageOrName : undefined,
      };
    })
    .filter((event) => event.description);
};

export const useSearchParamForInput = (
  key: string,
  defaultValue: string
): [string, (newValue: string) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) ?? defaultValue;

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

export const EditableText = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.select();
    }
  }, [isEditing]);

  useLayoutEffect(() => {
    if (textareaRef.current && spanRef.current) {
      textareaRef.current.style.width = `${spanRef.current.getBoundingClientRect().width + 8}px`;
      textareaRef.current.style.height = `${spanRef.current.getBoundingClientRect().height}px`;
      textareaRef.current.style.textAlign = window.getComputedStyle(
        spanRef.current
      ).textAlign;
    }
  }, [value, isEditing]);

  return (
    <span className="relative inline-block">
      <span
        ref={spanRef}
        onClick={() => {
          setIsEditing(true);
        }}
        className={
          "inline-block" +
          (isEditing ? " whitespace-pre-wrap invisible" : "") +
          (value === "" ? " text-gray-400" : "")
        }
      >
        {value ? value : placeholder ?? "\u00A0\u00A0\u00A0\u00A0"}
      </span>
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          onBlur={() => {
            setIsEditing(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              setIsEditing(false);
            }
          }}
          autoFocus
          className="inline-block absolute top-0 -left-1 pl-1 pr-1 bg-white bg-opacity-75 text-black overflow-hidden"
        />
      ) : undefined}
    </span>
  );
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
    <div className="min-w-[1200px]">
      <h1 className="m-6 text-5xl font-bold text-center text-gray-800 print:hidden">
        <EditableText value={title} onChange={setTitle} placeholder="Title" />
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
                return <div key={dayIndex} className="size-40" />;
              }

              const setName = (newName: string) => {
                const newDays = [...days];
                newDays[
                  weekIndex * 7 + dayIndex - numPaddingDaysBeginning
                ].name = newName;
                setEvents(
                  newDays
                    .map(
                      (day) =>
                        `${day.description}, ${day.color}, ${day.name}, ${day.image}`
                    )
                    .join("\n")
                );
              };

              const setDescription = (newDescription: string) => {
                const newDays = [...days];
                newDays[
                  weekIndex * 7 + dayIndex - numPaddingDaysBeginning
                ].description = newDescription;
                setEvents(
                  newDays
                    .map(
                      (day) =>
                        `${day.description}, ${day.color}, ${day.name}, ${day.image}`
                    )
                    .join("\n")
                );
              };

              const date = format(
                addDays(
                  startDate,
                  weekIndex * 7 + dayIndex - numPaddingDaysBeginning
                ),
                "E do"
              );
              const color = day.color || "blue";
              const colorInfo = colors[color] ?? colors.blue;

              return (
                <div
                  key={dayIndex}
                  className={`size-40 rounded-md ${colorInfo.background} border-solid border-4 ${colorInfo.border} p-1 flex flex-col justify-between bg-cover bg-center`}
                  style={{
                    backgroundImage: `url(${day.image})`,
                  }}
                >
                  <div>
                    <p
                      className={"float-left px-1 text-sm text-white bg-black rounded-sm bg-opacity-15" + (day.name ? "" : " bg-transparent text-transparent")}
                      style={day.name ? { textShadow: "rgba(0, 0, 0, 0.3) 0 0 3px" } : {}}
                    >
                      <EditableText value={day.name ?? ""} onChange={setName} />
                    </p>
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
                    <EditableText
                      value={day.description ?? ""}
                      onChange={setDescription}
                      placeholder="Description"
                    />
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
          startDate={startDate}
          title={title}
          onTitleChange={(newTitle) => setTitle(newTitle)}
          start={start}
          onStartChange={(newStart) => setStart(newStart)}
          events={events}
          onEventsChange={(newEvents) => setEvents(newEvents)}
        />
      </details>
    </div>
  );
}

type EditHolidayCalendarProps = {
  startDate: Date;
  title: string;
  onTitleChange: (title: string) => void;
  start: string;
  onStartChange: (start: string) => void;
  events: string;
  onEventsChange: (events: string) => void;
};

export const EditHolidayCalendar = ({
  startDate,
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
        <div className="flex flex-row">
          <div className="w-24 p-2 text-right">
            {[...Array(events.split("\n").length)].map((_, i) => {
              const date = format(addDays(startDate, i), "E do");
              return (
                <div
                  key={i}
                  className="pt-2 pb-1 text-sm text-gray-500 leading"
                >
                  {date}
                </div>
              );
            })}
          </div>
          <textarea
            id="events"
            name="events"
            className="w-full px-3 py-2 leading-loose text-gray-700 border rounded shadow appearance-none text-nowrap focus:outline-none focus:shadow-outline"
            // @ts-expect-error
            style={{ fieldSizing: "content" }}
            value={events}
            onChange={(event) => {
              onEventsChange(event.target.value);
            }}
          />
        </div>
      </div>
    </div>
  );
};
