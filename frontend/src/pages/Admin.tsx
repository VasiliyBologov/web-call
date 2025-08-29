import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../config'
import { Button, IconButton, Stack } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'

type AdminPeer = {
  peerId: string
  connectedAt: number | null
}

type AdminRoom = {
  token: string
  participants: number
  maxParticipants: number | null
  status: 'waiting' | 'active' | 'unknown'
  peers: AdminPeer[]
}

export const Admin: React.FC = () => {
  const [rooms, setRooms] = useState<AdminRoom[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ts, setTs] = useState(0)

  const base = useMemo(() => window.location.origin, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(api('/api/admin/connections'))
      if (!res.ok) throw new Error('Ошибка загрузки')
      const data = await res.json()
      setRooms((data.rooms || []) as AdminRoom[])
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  async function disconnect(token: string, peerId: string) {
    if (!confirm(`Отключить peer ${peerId} из комнаты ${token}?`)) return
    try {
      const res = await fetch(api(`/api/admin/connections/${encodeURIComponent(token)}/${encodeURIComponent(peerId)}`), { method: 'DELETE' })
      if (!res.ok) throw new Error('Ошибка отключения')
      await load()
    } catch (e) {
      alert('Не удалось отключить подключение')
    }
  }

  useEffect(() => {
    load()
    const id = window.setInterval(() => setTs(x => x + 1), 5000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => { load() }, [ts])

  function fmtTime(sec: number | null) {
    if (!sec) return '-'
    try {
      const d = new Date(sec * 1000)
      return d.toLocaleString()
    } catch { return '-' }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '24px auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <h1 style={{ margin: 0 }}>Админ панель</h1>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={load} color="primary" disabled={loading} title="Обновить">
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Stack>

      {error && <div style={{ color: 'red', marginBottom: 12 }}>Ошибка: {error}</div>}

      {rooms.length === 0 && <div>Активных подключений нет.</div>}

      <div>
        {rooms.map(room => (
          <div key={room.token} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
              <div>
                <div style={{ fontWeight: 600 }}>Комната: {room.token}</div>
                <div style={{ color: '#555' }}>Статус: {room.status} · Участников: {room.participants}{room.maxParticipants ? ` / ${room.maxParticipants}` : ''}</div>
              </div>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" endIcon={<OpenInNewIcon />} onClick={() => window.open(`${base}/r/${room.token}`, '_blank')}>
                  Открыть комнату
                </Button>
              </Stack>
            </Stack>

            {room.peers?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {room.peers.map(p => (
                  <Stack key={p.peerId} direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={1} sx={{ py: 1, borderTop: '1px dashed #eee' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <div style={{ width: 128, height: 72, background: '#f6f6f6', border: '1px solid #eee', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img
                          src={api(`/api/admin/preview/${encodeURIComponent(room.token)}/${encodeURIComponent(p.peerId)}`) + `?ts=${ts}`}
                          alt="preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                      <div>
                        <div>Peer: <code>{p.peerId}</code></div>
                        <div style={{ color: '#777' }}>Подключен: {fmtTime(p.connectedAt)}</div>
                      </div>
                    </Stack>
                    <div>
                      <Button color="error" variant="outlined" startIcon={<PowerSettingsNewIcon />} onClick={() => disconnect(room.token, p.peerId)}>
                        Отключить
                      </Button>
                    </div>
                  </Stack>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
        Подсказка: Для просмотра видео откройте нужную комнату. Учтите, что максимально 2 участника на комнату.
      </div>
    </div>
  )
}
