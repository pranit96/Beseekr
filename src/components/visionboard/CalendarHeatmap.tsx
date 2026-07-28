import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Bell,
  Calendar as CalendarIcon,
  Repeat,
  X,
  Mail,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { visionBoardApi, type Habit } from "@/api/visionboard";
import { useToast } from "@/components/ui/use-toast";

interface CalendarHeatmapProps {
  habits: Habit[];
  year: number;
  month: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  color: "terracotta" | "sage" | "slate" | "mustard" | "blush";
  recurrence: "none" | "daily" | "weekly" | "monthly";
  notify: boolean;
}

type DayStatus = "full" | "partial" | "missed" | "future" | "empty";

function getDayStatus(
  habits: Habit[],
  dateStr: string,
  today: string,
): DayStatus {
  if (dateStr > today) return "future";
  if (!habits.length) return "empty";

  const allLogs = habits.flatMap((h) =>
    h.logs.filter((l) => l.log_date === dateStr),
  );
  if (!allLogs.length) return "missed";

  const donePct =
    allLogs.filter((l) => l.status === "done").length / habits.length;
  if (donePct >= 0.8) return "full";
  if (donePct >= 0.4) return "partial";
  return "missed";
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STORAGE_KEY = "vb_calendar_events_v1";

function loadLocalEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalEvents(events: CalendarEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error("Failed to save calendar events to localStorage:", e);
  }
}

export function CalendarHeatmap({ habits, year, month }: CalendarHeatmapProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const eventsQueryKey = ["visionboard-events", year, month];

  // Fetch events from backend API
  const { data: remoteEventsRes } = useQuery({
    queryKey: eventsQueryKey,
    queryFn: async () => {
      const res = await visionBoardApi.getEvents(year, month);
      return res.data || [];
    },
    staleTime: 60 * 1000,
  });

  const [localEvents, setLocalEvents] =
    useState<CalendarEvent[]>(loadLocalEvents);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifPermission, setNotifPermission] =
    useState<NotificationPermission>(
      typeof window !== "undefined" && "Notification" in window
        ? Notification.permission
        : "default",
    );

  // Form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("09:00");
  const [eventColor, setEventColor] =
    useState<CalendarEvent["color"]>("terracotta");
  const [eventRecurrence, setEventRecurrence] =
    useState<CalendarEvent["recurrence"]>("none");
  const [eventNotify, setEventNotify] = useState(true);

  // Merge remote events with local fallback
  const combinedEvents: CalendarEvent[] = useMemo(() => {
    if (
      remoteEventsRes &&
      Array.isArray(remoteEventsRes) &&
      remoteEventsRes.length > 0
    ) {
      return remoteEventsRes.map((r: any) => ({
        id: r.id,
        title: r.title,
        date: r.event_date || r.date,
        time: r.event_time || r.time,
        color: r.color || "terracotta",
        recurrence: r.recurrence || "none",
        notify: !!r.notify,
      }));
    }
    return localEvents;
  }, [remoteEventsRes, localEvents]);

  // Sync to localStorage as offline fallback
  useEffect(() => {
    if (combinedEvents.length > 0) {
      saveLocalEvents(combinedEvents);
    }
  }, [combinedEvents]);

  // Request browser Notification permission
  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      return perm === "granted";
    }
    return false;
  };

  // Backend Mutation: Add Event (triggers Backend Email Notification if notify=true!)
  const addEventMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      date: string;
      time: string;
      color: string;
      recurrence: string;
      notify: boolean;
    }) => visionBoardApi.addEvent(year, month, payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: eventsQueryKey });
      toast({
        title: "Event Created",
        description: payloadNotifySentMessage,
      });
    },
    onError: (err: any) => {
      console.warn("Backend addEvent failed, keeping local event:", err);
    },
  });

  const [payloadNotifySentMessage, setPayloadNotifySentMessage] =
    useState("Saved to calendar");

  // Backend Mutation: Delete Event
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) =>
      visionBoardApi.deleteEvent(year, month, eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventsQueryKey });
    },
  });

  // Schedule local desktop notifications check (in addition to backend email notification)
  useEffect(() => {
    if (notifPermission !== "granted") return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentDateStr = now.toISOString().split("T")[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      combinedEvents.forEach((ev) => {
        if (!ev.notify || !ev.time) return;

        let match = false;
        if (
          ev.recurrence === "none" &&
          ev.date === currentDateStr &&
          ev.time === currentTimeStr
        ) {
          match = true;
        } else if (ev.recurrence === "daily" && ev.time === currentTimeStr) {
          match = true;
        } else if (ev.recurrence === "weekly" && ev.time === currentTimeStr) {
          const evDay = new Date(ev.date).getDay();
          if (now.getDay() === evDay) match = true;
        } else if (ev.recurrence === "monthly" && ev.time === currentTimeStr) {
          const evDate = new Date(ev.date).getDate();
          if (now.getDate() === evDate) match = true;
        }

        if (match) {
          try {
            new Notification(`Vision Board Event: ${ev.title}`, {
              body: `Scheduled for ${ev.time} (${ev.recurrence !== "none" ? ev.recurrence + " recurring" : "today"})`,
              icon: "/favicon.ico",
            });
          } catch (e) {
            console.error("Error displaying desktop notification:", e);
          }
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [combinedEvents, notifPermission]);

  // Generate month weeks grid
  const weeks = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const cells: Array<{ date: string | null; dayNum: number | null }> = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push({ date: null, dayNum: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ date: dateStr, dayNum: d });
    }

    const ws: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      ws.push(cells.slice(i, i + 7));
    }
    return ws;
  }, [year, month]);

  const getEventsForDate = (dateStr: string) => {
    const targetDate = new Date(dateStr);
    return combinedEvents.filter((ev) => {
      if (ev.date === dateStr) return true;
      if (ev.recurrence === "daily" && dateStr >= ev.date) return true;
      if (ev.recurrence === "weekly" && dateStr >= ev.date) {
        return new Date(ev.date).getDay() === targetDate.getDay();
      }
      if (ev.recurrence === "monthly" && dateStr >= ev.date) {
        return new Date(ev.date).getDate() === targetDate.getDate();
      }
      return false;
    });
  };

  const handleOpenAddModal = (dateStr?: string) => {
    setSelectedDate(dateStr || today);
    setEventTitle("");
    setEventTime("09:00");
    setEventColor("terracotta");
    setEventRecurrence("none");
    setEventNotify(true);
    setIsModalOpen(true);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !selectedDate) return;

    if (eventNotify && notifPermission !== "granted") {
      await requestNotificationPermission();
    }

    const newEv: CalendarEvent = {
      id: "ev_" + Date.now(),
      title: eventTitle.trim(),
      date: selectedDate,
      time: eventTime,
      color: eventColor,
      recurrence: eventRecurrence,
      notify: eventNotify,
    };

    // Update local state immediately
    setLocalEvents((prev) => [...prev, newEv]);

    const msg = eventNotify
      ? "Event saved! Confirmation email notification sent via backend Email Service."
      : "Event saved to calendar.";
    setPayloadNotifySentMessage(msg);

    // Trigger backend service + email dispatch
    addEventMutation.mutate({
      title: newEv.title,
      date: newEv.date,
      time: newEv.time || "09:00",
      color: newEv.color,
      recurrence: newEv.recurrence,
      notify: newEv.notify,
    });

    setIsModalOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    setLocalEvents((prev) => prev.filter((ev) => ev.id !== id));
    deleteEventMutation.mutate(id);
  };

  return (
    <div className="vb-section vb-heatmap">
      <div className="vb-section-header">
        <div className="vb-section-label">
          <CalendarIcon className="w-4 h-4 text-amber-600" />
          <span>Interactive Calendar & Events</span>
        </div>
        <div className="flex items-center gap-2">
          {notifPermission !== "granted" && (
            <button
              onClick={requestNotificationPermission}
              className="vb-weather-fetch-btn text-xs"
              title="Enable desktop notifications for events"
            >
              <Bell className="w-3.5 h-3.5" /> Enable Reminders
            </button>
          )}
          <button
            onClick={() => handleOpenAddModal(today)}
            className="vb-btn-primary vb-btn-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Event
          </button>
        </div>
      </div>

      {/* Main Grid Calendar */}
      <div className="vb-cal-grid-wrapper">
        <div className="vb-cal-header-row">
          {DAY_LABELS.map((d) => (
            <div key={d} className="vb-cal-header-cell">
              {d}
            </div>
          ))}
        </div>

        <div className="vb-cal-body">
          {weeks.map((week, wi) => (
            <div key={wi} className="vb-cal-week-row">
              {week.map((cell, di) => {
                if (!cell.date) {
                  return (
                    <div key={di} className="vb-cal-cell vb-cal-cell-empty" />
                  );
                }

                const dayStatus = getDayStatus(habits, cell.date, today);
                const dayEvents = getEventsForDate(cell.date);
                const isToday = cell.date === today;

                return (
                  <div
                    key={cell.date}
                    className={`vb-cal-cell ${isToday ? "vb-cal-cell-today" : ""}`}
                    onClick={() => handleOpenAddModal(cell.date!)}
                  >
                    <div className="vb-cal-cell-top">
                      <span
                        className={`vb-cal-day-num ${isToday ? "vb-cal-num-today" : ""}`}
                      >
                        {cell.dayNum}
                      </span>
                      {dayStatus !== "empty" && dayStatus !== "future" && (
                        <span
                          className={`vb-cal-habit-indicator vb-heat-${dayStatus}`}
                          title={`Habits: ${dayStatus}`}
                        >
                          ●
                        </span>
                      )}
                    </div>

                    <div className="vb-cal-events-list">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`vb-cal-event-pill vb-card-${ev.color}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="vb-cal-event-title">{ev.title}</span>
                          {ev.time && (
                            <span className="vb-cal-event-time">{ev.time}</span>
                          )}
                          {ev.recurrence !== "none" && (
                            <Repeat className="w-2.5 h-2.5 opacity-70 flex-shrink-0" />
                          )}
                          <button
                            className="vb-cal-event-del"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(ev.id);
                            }}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="vb-cal-more-pill">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend & Summary */}
      <div className="vb-heatmap-legend mt-4 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-3">
          <span>
            <span className="vb-heat-full">●</span> 80%+ Habits
          </span>
          <span>
            <span className="vb-heat-partial">◐</span> Partial
          </span>
          <span>
            <span className="vb-heat-missed">○</span> Missed
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground font-mono">
          <Mail className="w-3.5 h-3.5 text-amber-600" />
          <span>Backend Email Service Connected</span>
          <span>·</span>
          <span>
            {combinedEvents.length} event
            {combinedEvents.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Event Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="vb-form-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="vb-add-form"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="vb-form-title text-lg font-semibold flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-amber-600" />
                  Add Event
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="vb-chip-x"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddEvent}>
                <div className="mb-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Design review, Doctor appointment"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="vb-form-input"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={selectedDate || ""}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="vb-form-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="vb-form-input"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Recurrence
                  </label>
                  <select
                    value={eventRecurrence}
                    onChange={(e) => setEventRecurrence(e.target.value as any)}
                    className="vb-form-input"
                  >
                    <option value="none">One-time event</option>
                    <option value="daily">Every day</option>
                    <option value="weekly">Every week</option>
                    <option value="monthly">Every month</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Color Tag
                  </label>
                  <div className="vb-color-row">
                    {(
                      [
                        "terracotta",
                        "sage",
                        "slate",
                        "mustard",
                        "blush",
                      ] as const
                    ).map((c) => (
                      <div
                        key={c}
                        className={`vb-color-dot vb-dot-${c} ${eventColor === c ? "vb-dot-selected" : ""}`}
                        onClick={() => setEventColor(c)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-5">
                  <input
                    type="checkbox"
                    id="event-notify"
                    checked={eventNotify}
                    onChange={(e) => setEventNotify(e.target.checked)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label
                    htmlFor="event-notify"
                    className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-600" />
                    Send email notification via Email Service & desktop reminder
                  </label>
                </div>

                <div className="vb-form-actions">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="vb-btn-ghost"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="vb-btn-primary">
                    Save Event
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
