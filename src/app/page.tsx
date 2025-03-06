import { Header } from "@/app/header"
import { addDays } from "date-fns"
import { TodoList } from "./todo-list"

export default async function Home() {
  const deadlines = [
    {
      id: "1",
      title: "Project Proposal",
      description: "Submit the final project proposal to the client",
      dueDate: addDays(new Date(), 2),
    },
    {
      id: "2",
      title: "Team Meeting",
      description: "Weekly team sync to discuss progress",
      dueDate: new Date(),
    },
    {
      id: "3",
      title: "Budget Report",
      description: "Complete the Q1 budget report",
      dueDate: new Date(2025, 2, 1),
    },
    {
      id: "4",
      title: "Client Presentation",
      description: "Present the final designs to the client",
      dueDate: new Date(2025, 2, 4),
    },
  ]

  return (
    // 1px gap in the grid to reveal the background below, makes it look like visible grid lines
    <div className="grid gap-[1px] bg-black/5 grid-cols-[1fr_minmax(0,_800px)_1fr] min-h-screen  font-[family-name:var(--font-geist-sans)] ">
      {/* Header row */}
      <div className="bg-white" />
      <div className="bg-white">
        <Header />
      </div>
      <div className="bg-white" />

      {/* Content row  */}
      <div className="bg-white" />
      <div className="bg-white">
        <TodoList deadlines={deadlines} />
      </div>
      <div className="bg-white" />

      {/* Footer row */}
      <div className="bg-white" />
      <div className="bg-white">
        <footer> Template </footer>
      </div>
      <div className="bg-white" />
    </div>
  )
}
