# goodJob

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> 🇰🇷 **한국어** | [🇺🇸 English](#english-version)

## 개요

**goodJob**은 사용자의 이력서(CV)를 기반으로 맞춤형 채용 공고 추천, AI 피드백, 지원 현황 관리 등 다양한 채용 관련 기능을 제공하는 종합적인 구직 플랫폼입니다. 구직자들이 보다 효율적이고 체계적으로 취업 활동을 할 수 있도록 도와줍니다.

## 주요 기능

### 📄 이력서 관리
- **PDF 이력서 업로드**: 간편한 드래그&드롭 업로드
- **이력서 관리**: 별명 지정, 이름 변경, 삭제 기능
- **다중 이력서 지원**: 여러 버전의 이력서 관리 가능

### 🎯 맞춤형 채용 공고 추천
- **AI 기반 추천**: 업로드한 CV를 분석하여 적합한 공고 추천
- **개인화된 매칭**: 사용자의 경험과 스킬에 맞는 정확한 매칭
- **실시간 업데이트**: 새로운 공고 자동 알림

### 💡 AI 피드백 시스템
- **공고별 상세 분석**: 각 채용 공고에 대한 상세한 분석 제공
- **맞춤형 피드백**: AI가 제공하는 개인화된 지원 가이드
- **개선 제안**: 이력서 및 지원서 개선 방안 제시

### 📊 지원 현황 관리
- **상태 추적**: 지원 단계별 상태 변경 및 관리
- **메모 기능**: 각 지원 건에 대한 개인 메모 추가
- **정렬 및 필터**: 다양한 조건으로 지원 현황 정리
- **지원 이력**: 전체 지원 기록 조회 가능

### 🔖 북마크 기능
- **관심 공고 저장**: 나중에 지원할 공고 북마크
- **카테고리 관리**: 북마크한 공고들을 체계적으로 분류
- **빠른 접근**: 저장된 공고들에 빠르게 접근

### 👨‍💼 관리자 대시보드
- **통계 분석**: 플랫폼 사용 현황 및 트렌드 분석
- **서버 상태 모니터링**: 실시간 시스템 상태 확인
- **키워드 분석**: 인기 검색어 및 트렌드 키워드 분석
- **사용자 관리**: 사용자 계정 및 활동 관리

### 📱 반응형 디자인
- **데스크탑 지원**: PC 환경에 최적화된 인터페이스

## 기술 스택

### Frontend
- **React 18**: 최신 React 기반 사용자 인터페이스
- **TypeScript**: 타입 안전성을 위한 TypeScript 적용
- **Create React App**: 빠른 개발 환경 구성
- **Zustand**: 간단하고 효율적인 상태 관리
- **SCSS Modules**: 모듈화된 스타일링
- **React Router**: SPA 라우팅 관리
- **Axios**: HTTP 클라이언트 라이브러리
- **Lucide React**: 모던한 아이콘 라이브러리

## 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 UI 컴포넌트
│   ├── common/         # 공통 컴포넌트
│   └── pages/          # 페이지별 특화 컴포넌트
├── pages/              # 라우트별 페이지 컴포넌트
├── store/              # Zustand 상태 관리 스토어
├── types/              # TypeScript 타입 정의
├── utils/              # 유틸리티 함수들
├── constants/          # 상수 및 환경 변수
│   └── env.ts         # 환경 설정
└── styles/             # 전역 스타일 및 SCSS 모듈
```

## 설치 및 실행

### 필요 조건
- Node.js 16.x 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/hun9008/CV_Search.git
cd CV_Search

# dev_front 브랜치로 전환
git checkout dev_front

# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
# 개발 서버 시작
npm start
```

개발 서버가 시작되면 `http://localhost:3000`에서 애플리케이션을 확인할 수 있습니다.

### 빌드

```bash
# 프로덕션 빌드
npm run build
```

빌드된 파일들은 `build/` 디렉토리에 생성됩니다.

## 환경 설정

`/src/constants/env.ts` 파일에서 다음 환경 변수들을 설정할 수 있습니다:

- API 서버 주소
- 인증 관련 설정
- 기타 환경별 설정

## 브라우저 지원

- Chrome (최신 버전)
- Safari (최신 버전)

## 기여하기

1. 이 저장소를 Fork 합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push 합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

## 문의 및 지원

- 버그 리포트나 기능 요청은 [Issues](https://github.com/hun9008/CV_Search/issues)에 등록해주세요
- 관리자 기능 사용을 위해서는 별도의 권한이 필요합니다

---

## English Version

## Overview

**goodJob** is a comprehensive job search platform that provides personalized job recommendations, AI feedback, application status management, and various other recruitment-related features based on users' CVs. It helps job seekers conduct their job search activities more efficiently and systematically.

## Key Features

### 📄 Resume Management
- **PDF Resume Upload**: Easy drag & drop upload functionality
- **Resume Management**: Nickname assignment, name changes, and deletion features
- **Multiple Resume Support**: Manage multiple versions of resumes

### 🎯 Personalized Job Recommendations
- **AI-based Recommendations**: Analyze uploaded CVs to recommend suitable job postings
- **Personalized Matching**: Accurate matching based on user experience and skills
- **Real-time Updates**: Automatic notifications for new job postings

### 💡 AI Feedback System
- **Detailed Job Analysis**: Provide detailed analysis for each job posting
- **Personalized Feedback**: AI-generated personalized application guides
- **Improvement Suggestions**: Recommendations for resume and application improvements

### 📊 Application Status Management
- **Status Tracking**: Change and manage application stages
- **Note Feature**: Add personal notes for each application
- **Sort and Filter**: Organize application status with various conditions
- **Application History**: View complete application records

### 🔖 Bookmark Feature
- **Save Interesting Jobs**: Bookmark jobs to apply for later
- **Category Management**: Systematically categorize bookmarked jobs
- **Quick Access**: Quickly access saved job postings

### 👨‍💼 Admin Dashboard
- **Statistical Analysis**: Platform usage statistics and trend analysis
- **Server Status Monitoring**: Real-time system status monitoring
- **Keyword Analysis**: Popular search terms and trending keyword analysis
- **User Management**: User account and activity management

### 📱 Responsive Design
- **Desktop Support**: Interface optimized for PC environments


## Tech Stack

### Frontend
- **React 18**: Latest React-based user interface
- **TypeScript**: TypeScript for type safety
- **Create React App**: Quick development environment setup
- **Zustand**: Simple and efficient state management
- **SCSS Modules**: Modularized styling
- **React Router**: SPA routing management
- **Axios**: HTTP client library
- **Lucide React**: Modern icon library

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components
│   └── pages/          # Page-specific components
├── pages/              # Route-based page components
├── store/              # Zustand state management stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── constants/          # Constants and environment variables
│   └── env.ts         # Environment configuration
└── styles/             # Global styles and SCSS modules
```

## Installation and Setup

### Prerequisites
- Node.js 16.x or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/hun9008/CV_Search.git
cd CV_Search

# Switch to dev_front branch
git checkout dev_front

# Install dependencies
npm install
```

### Development Server

```bash
# Start development server
npm start
```

Once the development server starts, you can view the application at `http://localhost:3000`.

### Build

```bash
# Production build
npm run build
```

Built files will be generated in the `build/` directory.

## Environment Configuration

Configure the following environment variables in `/src/constants/env.ts`:

- API server address
- Authentication settings
- Other environment-specific configurations

## Browser Support

- Chrome (latest version)
- Safari (latest version)

## Contributing

1. Fork this repository
2. Create a new feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

## Support and Contact

- Please report bugs or request features in [Issues](https://github.com/hun9008/CV_Search/issues)
- Separate permissions are required to use admin features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
