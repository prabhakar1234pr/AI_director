'use client'

import ScriptPanel from './components/ScriptPanel'
import StatusBar from './components/StatusBar'
import BrandWidget from './components/widgets/BrandWidget'
import StyleWidget from './components/widgets/StyleWidget'
import ChatWidget from './components/widgets/ChatWidget'

export default function Home() {
  return (
    <>
      <StatusBar />

      <div className="relative h-screen w-screen overflow-hidden bg-surface text-white">
        {/* Playground */}
        <main className="h-full w-full">
          <ScriptPanel />
        </main>

        {/* Floating widgets */}
        <BrandWidget />
        <StyleWidget />
        <ChatWidget />
      </div>
    </>
  )
}
