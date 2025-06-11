// src/pages/admin/dashboard/job/JobCreateModal.tsx
import React, { useState } from 'react';
import style from './JobCreateModal.module.scss';
import { SERVER_IP } from '../../../../../constants/env';

interface JobCreateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const JobCreateModal: React.FC<JobCreateModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    title: '',
    department: '',
    requireExperience: '',
    jobType: '',
    requirements: '',
    preferredQualifications: '',
    idealCandidate: '',
    jobDescription: '',
    jobRegions: '',
    applyStartDate: '',
    applyEndDate: '',
    isPublic: true,
    rawJobsText: '',
    url: '',
    favicon: '',
    regionText: '',
    jobValidType: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
  const raw = localStorage.getItem('user-token');
  let accessToken = null;

  try {
    if (raw) {
      const parsed = JSON.parse(raw);
      accessToken = parsed?.state?.accessToken;
    }
  } catch (e) {
    console.error('토큰 파싱 실패:', e);
  }

  if (!accessToken) {
    alert('로그인이 필요합니다.');
    return;
  }

  // ✨ rawJobsText 생성
  const composedRawText = [
    formData.department,
    formData.requireExperience,
    formData.jobType,
    formData.requirements,
    formData.idealCandidate,
    formData.jobDescription,
    formData.regionText,
  ]
    .filter((v) => v && v.trim() !== '')
    .join(' / ');

  const cleanFormData = Object.fromEntries(
    Object.entries(formData).map(([key, value]) => [
      key,
      value === '' ? null : value,
    ])
  );

  const payload = {
    ...cleanFormData,
    jobRegions: [1],            
    rawJobsText: composedRawText,  
    jobValidType: 1,               
  };

  try {
    const res = await fetch(`${SERVER_IP}/admin/dashboard/job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert('공고 등록 완료');
      onSuccess();
      onClose();
    } else {
      const err = await res.json();
      alert(`등록 실패: ${err.error || '알 수 없는 오류'}`);
    }
  } catch (e) {
    console.error(e);
    alert('등록 중 오류가 발생했습니다.');
  }
};

  return (
    <div className={style.modalOverlay}>
    <div className={style.modal}>
  <h2>공고 등록</h2>
  <div className={style.modalForm}>
    <label>
      회사명
      <input name="companyName" onChange={handleChange} />
    </label>
    <label>
      공고명
      <input name="title" onChange={handleChange} />
    </label>

    <label>
      부서명
      <input name="department" onChange={handleChange} />
    </label>
    <label>
      경력
      <input name="requireExperience" onChange={handleChange} />
    </label>

    <label>
      직무 유형
      <input name="jobType" onChange={handleChange} />
    </label>
    <label>
      지역
      <input name="regionText" onChange={handleChange} />
    </label>

    <label>
      요구 조건
      <textarea name="requirements" onChange={handleChange} />
    </label>
    <label>
      이상적인 지원자
      <textarea name="idealCandidate" onChange={handleChange} />
    </label>

    <label>
      우대 사항
      <textarea name="preferredQualifications" onChange={handleChange} />
    </label>
    <label>
      공고 설명
      <textarea name="jobDescription" onChange={handleChange} />
    </label>

    <label>
      시작일 (YYYY-MM-DD)
      <input name="applyStartDate" type="date" onChange={handleChange} />
    </label>
    <label>
      마감일 (YYYY-MM-DD)
      <input name="applyEndDate" type="date" onChange={handleChange} />
    </label>

    <label>
      공고 URL
      <input name="url" onChange={handleChange} />
    </label>
    <label>
      Favicon URL
      <input name="favicon" onChange={handleChange} />
    </label>
  </div>

<div className={style.actions}>
  <button className={style.blueButton} onClick={onClose}>취소</button>
  <button className={style.blueButton} onClick={handleSubmit}>등록</button>
</div>
</div>
</div>
  );
};

export default JobCreateModal;