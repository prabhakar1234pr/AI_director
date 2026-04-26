'use client'

import { useEffect } from 'react'
import ScriptPanel from './components/ScriptPanel'
import StatusBar from './components/StatusBar'
import BrandWidget from './components/widgets/BrandWidget'
import StyleWidget from './components/widgets/StyleWidget'
import ChatWidget from './components/widgets/ChatWidget'
import { useDirectorStore } from './stores/useDirectorStore'

export default function Home() {
  // Pull saved state out of localStorage after the client has mounted so we
  // don't risk a hydration mismatch with the server-rendered initial state.
  useEffect(() => {
    useDirectorStore.persist.rehydrate()
  }, [])

  return (
    <>
      <StatusBar />

      <div className="relative h-screen w-screen overflow-hidden bg-surface text-white">
        <main className="h-full w-full">
          <ScriptPanel />
        </main>

        <BrandWidget />
        <StyleWidget />
        <ChatWidget />
      </div>
    </>
  )
}
