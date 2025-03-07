import { Button } from "@/components/ui/button"
import { getDeadlines } from "../actions/deadline-actions"
import { HistoricalDeadlines } from "./historical-deadlines"
import Link from "next/link"

export default async function HistoryPage() {
  const deadlines = await getDeadlines()

  return (
    <>
      <div className="bg-white" />
      <div className="flex justify-between items-center bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Deadlines</h1>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/">View Current</Link>
          </Button>
        </div>
      </div>
      <div className="bg-white" />
      <HistoricalDeadlines deadlines={deadlines} />
    </>
  )
}
