'use server'

import { revalidatePath } from 'next/cache'
import { addDays } from 'date-fns'

// Type definitions
type Deadline = {
  id: string
  title: string
  description: string
  dueDate: Date
  completed: boolean
}

// Mock database for demonstration with initial data
// In a real app, you would connect to your database
let deadlines: Deadline[] = [
  {
    id: "1",
    title: "Project Proposal",
    description: "Submit the final project proposal to the client",
    dueDate: addDays(new Date(), 2),
    completed: false,
  },
  {
    id: "2",
    title: "Team Meeting",
    description: "Weekly team sync to discuss progress",
    dueDate: new Date(),
    completed: false,
  },
  {
    id: "3",
    title: "Past Deadline",
    description: "This is from yesterday",
    dueDate: addDays(new Date(), -1),
    completed: false,
  }
]

// Add a new deadline
export async function addDeadline(formData: FormData): Promise<Deadline> {
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const dueDateStr = formData.get('dueDate') as string
  
  // Validate inputs
  if (!title || !dueDateStr) {
    throw new Error('Title and due date are required')
  }

  // Create a new deadline
  const newDeadline: Deadline = {
    id: `deadline-${Date.now()}`,
    title,
    description,
    dueDate: new Date(dueDateStr),
    completed: false
  }

  // Add to our "database"
  deadlines.push(newDeadline)

  // Revalidate the path to update UI
  revalidatePath('/')

  return newDeadline
}

// Toggle deadline completion status
export async function toggleDeadlineComplete(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  const completedStr = formData.get('completed') as string
  
  // Validate input
  if (!id) {
    throw new Error('Deadline ID is required')
  }

  // Convert completed string to boolean
  const completed = completedStr === 'true'

  // Find and update deadline in our "database"
  deadlines = deadlines.map(deadline => 
    deadline.id === id
      ? { ...deadline, completed }
      : deadline
  )

  // Revalidate the path to update UI
  revalidatePath('/')
}

// Get all deadlines
export async function getDeadlines(): Promise<Deadline[]> {
  return deadlines
} 
