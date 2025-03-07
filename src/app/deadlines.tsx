"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Clock, PlusIcon } from "lucide-react"
import {
  format,
  isToday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  isPast,
} from "date-fns"
import { cn } from "@/lib/utils"

type Deadline = {
  id: string
  title: string
  description: string
  dueDate: Date
  completed: boolean
}

export function Deadlines({
  deadlines,
  handleToggleComplete,
}: {
  deadlines: Deadline[]
  handleToggleComplete?: (id: string) => void
}) {
  // Group deadlines by date (inlined from TodoList)
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
    <div>
      {Object.entries(groupedDeadlines).map(([date, deadlines]) => (
        <div
          key={date}
          className="grid gap-x-[1px] grid-cols-1 sm:grid-cols-[minmax(150px,_1fr)_minmax(0,_768px)_1fr] mt-[1px]"
        >
          {/* Header */}
          <div
            className={cn(
              "px-4 pt-1 sm:py-4 text-muted-foreground font-medium",
              isPast(new Date(date))
                ? isToday(new Date(date))
                  ? "text-accent font-bold bg-white"
                  : "text-destructive font-bold  bg-linear-to-l from-white/50 to-white"
                : "bg-linear-to-l from-white/50 to-white",
            )}
          >
            <h2 className="sm:text-lg sticky top-4 sm:text-right">
              {getDateHeading(new Date(date))}
            </h2>
          </div>
          <div
            className={cn(
              "relative bg-white",
              // if date is in the past, red
            )}
          >
            <div className="-space-y-2">
              {deadlines.map((deadline) => (
                <div key={deadline.id} className="px-4 py-4 hover:bg-black/5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      {handleToggleComplete && (
                        <input
                          type="checkbox"
                          checked={!!deadline.completed}
                          onChange={() => handleToggleComplete(deadline.id)}
                          className="mt-1.5"
                        />
                      )}
                      <div>
                        <h3
                          className={cn(
                            "font-medium flex items-center",
                            !!deadline.completed &&
                              "line-through text-muted-foreground",
                          )}
                        >
                          {deadline.title}
                        </h3>
                        <p
                          className={cn(
                            "text-gray-600 text-sm",
                            !!deadline.completed &&
                              "line-through text-muted-foreground",
                          )}
                        >
                          {deadline.description}
                        </p>
                      </div>
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

            <div className="absolute left-0 right-0 -bottom-4 py-4 z-10 opacity-0 hover:opacity-100 focus-within:opacity-100">
              <hr className="relative top-[2.5px] border-2 border-accent" />
              <div className="absolute left-0 right-0 h-6 flex justify-center">
                <Button
                  type="button"
                  className={cn(
                    "-mt-3",
                    `border border-ring ring-ring/50 ring-[3px] bg-white `,
                  )}
                  size="icon"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className={cn("bg-linear-to-r from-white/70 to-white")} />
        </div>
      ))}
    </div>
  )
}
