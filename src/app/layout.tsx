import type { Metadata } from "next"
import { StackProvider, StackTheme } from "@stackframe/stack"
import { stackServerApp } from "../stack"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Header } from "./header"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Neon Auth example app",
  description: "Neon Auth example app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <div className="grid gap-[1px] bg-black/5 grid-cols-1 sm:grid-cols-[minmax(150px,_1fr)_minmax(0,_768px)_1fr] font-[family-name:var(--font-geist-sans)] ">
              <div className="bg-white" />
              <div className="bg-white">
                <Header />
              </div>
              <div className="bg-white" />

              {children}
            </div>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  )
}
