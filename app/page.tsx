import { redirect } from "next/navigation"

/**
 * Root page redirects to the translate page
 */
export default function Home() {
  redirect("/translate")
}
