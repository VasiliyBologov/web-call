import React, { useMemo, useState } from 'react'
import { api } from '../config'
import QRCode from 'qrcode'

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

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 16, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 28 }}>Видеозвонок по одной ссылке</h1>
      <p>Нажмите кнопку ниже, чтобы создать ссылку на комнату. Отправьте её собеседнику.</p>
      <button onClick={createRoom} style={btnStyle}>Создать ссылку</button>

      {roomUrl && (
        <div style={{ marginTop: 24 }}>
          <h2>Ссылка на комнату</h2>
          <p>
            <a href={roomUrl} target="_blank" rel="noreferrer" style={{ fontSize: 18 }}>{roomUrl}</a>
          </p>
          <button style={btnStyle} onClick={() => navigator.clipboard.writeText(roomUrl!)}>Скопировать</button>
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

const btnStyle: React.CSSProperties = {
  fontSize: 18,
  padding: '12px 18px',
  cursor: 'pointer',
}
