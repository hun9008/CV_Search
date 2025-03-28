'use client'

import { useEffect, useState } from 'react'

export default function HomePage() {
  const [token, setToken] = useState(null)

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    setToken(accessToken)
  }, [])

  return (
    <div>
      <h1>홈페이지</h1>
      {token ? (
        <p>Access Token: {token}</p>
      ) : (
        <p>로그인되지 않았습니다.</p>
      )}
      <button onClick={() => {
        window.location.href = "http://localhost:8080/oauth2/authorization/google"
      }}>
        구글 로그인
      </button>
    </div>
  )
}