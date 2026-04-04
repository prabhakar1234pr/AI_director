'use client'

import { useState, useEffect } from 'react'

export default function ScriptEditor({ scriptJson, onValidChange, onRawChange }) {
  const [localJson, setLocalJson] = useState(scriptJson)
  const [parseError, setParseError] = useState(null)

  useEffect(() => {
    setLocalJson(scriptJson)
    setParseError(null)
  }, [scriptJson])

  function handleChange(e) {
    const val = e.target.value
    setLocalJson(val)
    onRawChange(val)

    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed) && parsed.length > 0) {
        setParseError(null)
        onValidChange(parsed)
      } else {
        setParseError('Must be a non-empty JSON array of shots')
      }
    } catch (err) {
      setParseError(err.message)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted uppercase tracking-widest font-medium">Script JSON</p>
        {parseError ? (
          <span className="text-xs text-red-400">⚠ Invalid JSON</span>
        ) : (
          <span className="text-xs text-emerald-500">✓ Valid</span>
        )}
      </div>
      <textarea
        value={localJson}
        onChange={handleChange}
        rows={8}
        spellCheck={false}
        className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-xs text-slate-300 font-mono resize-none focus:outline-none focus:border-accent"
      />
      {parseError && (
        <p className="text-xs text-red-400 pl-1">{parseError}</p>
      )}
    </div>
  )
}
