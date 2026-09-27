import { useViewDate } from '../store'
import { Header } from './Chrome'
import { MoodForm } from './MoodForm'

export function MoodScreen() {
  const date = useViewDate()
  return (
    <>
      <Header dayNav />
      <main className="screen">
        <MoodForm key={date} date={date} />
      </main>
    </>
  )
}
