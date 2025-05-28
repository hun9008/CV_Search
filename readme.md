# CV Search

## Team Member

<table>
<thead>
<tr>
<th>Name</th>
<th>Part</th>
<th>What I do</th>
</tr>
</thead>
<tfoot>
<tbody>
<tr>
<td>[팀장] 정용훈</td>
<td>BE, AI</td>
<td></td>
</tr>
<tr>
      <td>[팀원] 유진</td>
      <td>BE</td>
      <td>OAuth 회원가입, 지원이력, 피드백 생성, 공고 검색 및 필터 기능 구현</td>
</tr>
<tr>
<td>...</td>
<td>blk</td>
<td>blk</td>
</tr>
<tr>
<td>...</td>
<td>blk</td>
<td>blk</td>
</tr>
</tbody>
</table>

# Git 브랜치 및 배포 전략

## 목적

- 컴포넌트별로 나뉜 백엔드, 프론트엔드, 데이터베이스 환경에서 안전하고 명확한 CI/CD 운영
- 실수를 방지하기 위한 배포 브랜치와 개인 작업 브랜치의 분리
- `main` 브랜치는 코드 통합 및 구조 확인용으로만 사용

---

## 브랜치 구조

### 1. 배포용 브랜치 (`dev_{part}`)

| 브랜치명     | 역할                    | 배포 방식                        |
|--------------|-------------------------|----------------------------------|
| dev_front    | 프론트엔드              | GitHub Actions → S3, CloudFront |
| dev_spring   | Spring 백엔드 서버      | GitHub Actions → EC2            |
| dev_crawl    | 크롤러 서버 (Node.js)   | GitHub Actions → EC2            |
| dev_RDB      | MySQL 데이터베이스      | GitHub Actions → EC2 + Docker   |
| dev_ES       | Elasticsearch 서버      | GitHub Actions → ECS, ECR       |

- 각 브랜치는 다음 파일들을 포함합니다:
  - `Dockerfile`
  - `docker-compose.yml`
  - `.github/workflows/deploy.yml`
- CI/CD는 해당 브랜치에서만 동작하며, 다른 브랜치에 영향을 주지 않습니다.

---

### 2. 개인 작업용 브랜치 (`dev_{part}_{name}`)

| 예시                  | 설명                    |
|------------------------|-------------------------|
| dev_spring_yh   | 개인 Spring 백엔드 작업용 |
| dev_crawl_sh        | 개인 크롤러 작업용       |

- 각자의 실험 및 기능 개발은 이 브랜치에서 자유롭게 진행합니다.
- 완성 후 `dev_{part}` 브랜치로 Pull Request를 생성합니다.
- 개인 작업 브랜치에서는 GitHub Actions가 실행되지 않습니다.

---

### 3. `main` 브랜치

- 서비스 통합 구조 확인 및 문서화를 위한 브랜치입니다.
- 실제 배포는 이루어지지 않으며, `.github/workflows` 디렉토리도 존재하지 않습니다.

```
root/
├── spring/       # dev_spring에서 병합
├── crawl/        # dev_crawl에서 병합
├── front/        # dev_front에서 병합
├── rdb/          # dev_RDB에서 병합
├── es/           # dev_ES에서 병합
└── README.md     # 통합 문서
```

---

## GitHub Actions 작동 방식

- 각 `dev_{part}` 브랜치에 존재하는 `.github/workflows/deploy.yml`을 통해 자동 배포가 이루어집니다.

```yaml
on:
  push:
    branches:
      - dev_spring
    paths:
      - '**'
