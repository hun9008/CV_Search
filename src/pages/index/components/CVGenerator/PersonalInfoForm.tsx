'use client';

import type React from 'react';

import { useState } from 'react';
import { Upload, User } from 'lucide-react';
import styles from './styles/PersonalInfoForm.module.scss';

interface PersonalInfo {
    name: string;
    email: string;
    phone: string;
    address: string;
    summary: string;
    profileImage?: string;
}

interface PersonalInfoFormProps {
    data: PersonalInfo;
    onChange: (data: PersonalInfo) => void;
}

function PersonalInfoForm({ data, onChange }: PersonalInfoFormProps) {
    const [imagePreview, setImagePreview] = useState<string | null>(data.profileImage || null);

    const handleInputChange = (field: keyof PersonalInfo, value: string) => {
        onChange({
            ...data,
            [field]: value,
        });
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setImagePreview(result);
                handleInputChange('profileImage', result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={styles.personalInfoForm}>
            <div className={styles.header}>
                <User size={24} />
                <h2>개인정보</h2>
            </div>

            <div className={styles.formContent}>
                <div className={styles.profileSection}>
                    <div className={styles.profileImageUpload}>
                        <div className={styles.imagePreview}>
                            {imagePreview ? (
                                <img src={imagePreview || '/placeholder.svg'} alt="프로필" />
                            ) : (
                                <div className={styles.placeholder}>
                                    <User size={40} />
                                </div>
                            )}
                        </div>
                        <label className={styles.uploadButton}>
                            <Upload size={16} />
                            프로필 사진 업로드
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                hidden
                            />
                        </label>
                    </div>
                </div>

                <div className={styles.formFields}>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>이름 *</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="홍길동"
                                required
                            />
                        </div>
                        <div className={styles.field}>
                            <label>이메일 *</label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="hong@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>전화번호 *</label>
                            <input
                                type="tel"
                                value={data.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="010-1234-5678"
                                required
                            />
                        </div>
                        <div className={styles.field}>
                            <label>주소</label>
                            <input
                                type="text"
                                value={data.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                placeholder="서울시 강남구"
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>자기소개</label>
                        <textarea
                            value={data.summary}
                            onChange={(e) => handleInputChange('summary', e.target.value)}
                            placeholder="간단한 자기소개를 작성해주세요..."
                            rows={4}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PersonalInfoForm;
