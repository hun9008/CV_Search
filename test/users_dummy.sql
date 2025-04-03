INSERT INTO users (
  email,
  oauth_provider,
  oauth_id,
  oauth_access_token,
  oauth_refresh_token,
  token_expiry,
  name,
  address,
  role,
  created_at,
  updated_at
) VALUES
(
  'alice@example.com',
  'google',
  'google_123456',
  'access_token_1',
  'refresh_token_1',
  NOW() + INTERVAL 1 DAY,
  'Alice Kim',
  '서울 강남구',
  'user',
  NOW(),
  NOW()
),
(
  'bob@example.com',
  'kakao',
  'kakao_abcdef',
  'access_token_2',
  'refresh_token_2',
  NOW() + INTERVAL 2 DAY,
  'Bob Lee',
  '경기 수원시',
  'user',
  NOW(),
  NOW()
),
(
  'charlie@example.com',
  'google',
  'google_7891011',
  'access_token_3',
  'refresh_token_3',
  NOW() + INTERVAL 3 DAY,
  'Charlie Park',
  '부산 해운대구',
  'admin',
  NOW(),
  NOW()
);