'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Check } from 'lucide-react'

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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted uppercase tracking-[0.18em] font-medium">
          Script JSON
        </p>
        {parseError ? (
          <span className="text-xs text-red-300 flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Invalid
          </span>
        ) : (
          <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
            <Check className="w-3.5 h-3.5" /> Valid
          </span>
        )}
      </div>
      <textarea
        value={localJson}
        onChange={handleChange}
        rows={12}
        spellCheck={false}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-xs text-slate-100 font-mono resize-none focus:outline-none focus:border-accent leading-relaxed"
      />
      {parseError && (
        <p className="text-xs text-red-300 pl-1 leading-relaxed">{parseError}</p>
      )}
    </div>
  )
}
