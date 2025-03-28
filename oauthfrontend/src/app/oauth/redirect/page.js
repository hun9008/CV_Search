'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function OAuthRedirectPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      localStorage.setItem('accessToken', token)
      router.push('/')  // 홈으로 이동
    }
  }, [token, router])

  return <div>로그인 처리 중입니다...</div>
}