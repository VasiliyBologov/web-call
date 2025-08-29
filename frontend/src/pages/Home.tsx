import React, { useMemo, useState } from 'react'
import { api } from '../config'
import QRCode from 'qrcode'
import { Button, Stack } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ShareIcon from '@mui/icons-material/Share'

export const Home: React.FC = () => {
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const base = useMemo(() => window.location.origin, [])

  async function createRoom() {
    setRoomUrl(null)
    setQrDataUrl(null)
    const res = await fetch(api('/api/rooms'), { method: 'POST' })
    if (!res.ok) {
      alert('Ошибка создания комнаты')
      return
    }
    const data = await res.json()
    const url = data.url.startsWith('http') ? data.url : `${base}${data.url}`
    setRoomUrl(url)
    const qr = await QRCode.toDataURL(url, { margin: 1, scale: 6 })
    setQrDataUrl(qr)
  }

  async function shareLink(url: string) {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Приглашение в видеозвонок', text: 'Присоединяйся к звонку', url })
      } else {
        await navigator.clipboard.writeText(url)
        alert('Ссылка скопирована. Отправьте её в мессенджере.')
      }
    } catch (e) {
      console.warn('Share failed', e)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 16, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 28 }}>Видеозвонок по одной ссылке</h1>
      <p>Нажмите кнопку ниже, чтобы создать ссылку на комнату. Отправьте её собеседнику.</p>
      <Button variant="contained" color="primary" onClick={createRoom} sx={{ borderRadius: 999, px: 2.5, py: 1.5, fontSize: 18 }}>Создать ссылку</Button>

      {roomUrl && (
        <div style={{ marginTop: 24 }}>
          <h2>Ссылка на комнату</h2>
          <p>
            <a href={roomUrl} target="_blank" rel="noreferrer" style={{ fontSize: 18 }}>{roomUrl}</a>
          </p>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={() => navigator.clipboard.writeText(roomUrl!)} sx={{ borderRadius: 999 }}>Скопировать</Button>
            <Button variant="outlined" startIcon={<OpenInNewIcon />} onClick={() => window.open(roomUrl!, '_blank')} sx={{ borderRadius: 999 }}>Перейти по ссылке</Button>
            <Button variant="outlined" startIcon={<ShareIcon />} onClick={() => shareLink(roomUrl!)} sx={{ borderRadius: 999 }}>Поделиться</Button>
          </Stack>
          {qrDataUrl && (
            <div style={{ marginTop: 16 }}>
              <img src={qrDataUrl} alt="QR" style={{ width: 240, height: 240 }} />
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 40, color: '#555' }}>
        <h3>Как это работает</h3>
        <ul>
          <li>Откройте ссылку на двух устройствах</li>
          <li>Разрешите доступ к камере и микрофону</li>
          <li>Связь устанавливается автоматически</li>
        </ul>
      </div>
    </div>
  )
}
