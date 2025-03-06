"use client"

import { Clock } from "lucide-react"
import { useMemo } from "react"
import { format, isToday, isTomorrow, isThisWeek, isThisMonth } from "date-fns"

type Deadline = {
  id: string
  title: string
  description: string
  dueDate: Date
}

export function TodoList({ deadlines }: { deadlines: Deadline[] }) {
  const groupedDeadlines = useMemo(() => {
    const sorted = [...deadlines].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
    )
    const groups: { [key: string]: Deadline[] } = {}

    sorted.forEach((deadline) => {
      const key = format(deadline.dueDate, "yyyy-MM-dd")
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(deadline)
    })

    return groups
  }, [deadlines])

  const getDateHeading = (date: Date) => {
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    if (isThisWeek(date)) return format(date, "EEEE")
    if (isThisMonth(date)) return format(date, "MMMM d")
    return format(date, "MMMM d, yyyy")
  }

  return (
    <main className="row-start-2 relative z-10">
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Deadlines</h1>
            </div>
          </div>

          {/* Deadlines section */}
          <div className="flex flex-col space-y-4">
            {Object.entries(groupedDeadlines).map(
              ([date, deadlines], groupIndex) => (
                <div key={date} className="flex">
                  <div className="w-1/4 pr-4">
                    <h2 className="text-xl font-semibold sticky top-4">
                      {getDateHeading(new Date(date))}
                    </h2>
                  </div>
                  <div className="w-3/4 space-y-4">
                    {deadlines.map((deadline, index) => (
                      <div
                        key={deadline.id}
                        className={
                          groupIndex === 0 && index === 0
                            ? "bg-blue-50 border-blue-200"
                            : ""
                        }
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold flex items-center">
                              {groupIndex === 0 && index === 0 && (
                                <span className="inline-block bg-blue-500 w-2 h-2 rounded-full mr-2"></span>
                              )}
                              {deadline.title}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {deadline.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-2 text-gray-500 text-sm">
                              <Clock className="h-4 w-4" />
                              {format(deadline.dueDate, "h:mm a")}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
