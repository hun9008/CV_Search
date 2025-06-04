'use client';

import { useState } from 'react';
import { Plus, Trash2, GraduationCap, Calendar } from 'lucide-react';
import styles from './styles/EducationForm.module.scss';

interface Education {
    id: string;
    school: string;
    degree: string;
    major: string;
    startDate: string;
    endDate: string;
    gpa?: string;
}

interface EducationFormProps {
    data: Education[];
    onChange: (data: Education[]) => void;
}

function EducationForm({ data, onChange }: EducationFormProps) {
    const [editingId, setEditingId] = useState<string | null>(null);

    const addEducation = () => {
        const newEducation: Education = {
            id: Date.now().toString(),
            school: '',
            degree: '',
            major: '',
            startDate: '',
            endDate: '',
            gpa: '',
        };
        onChange([...data, newEducation]);
        setEditingId(newEducation.id);
    };

    const updateEducation = (id: string, field: keyof Education, value: string) => {
        const updated = data.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu));
        onChange(updated);
    };

    const deleteEducation = (id: string) => {
        onChange(data.filter((edu) => edu.id !== id));
    };

    return (
        <div className={styles.educationForm}>
            <div className={styles.header}>
                <GraduationCap size={24} />
                <h2>학력사항</h2>
                <button className={styles.addButton} onClick={addEducation}>
                    <Plus size={16} />
                    학력 추가
                </button>
            </div>

            <div className={styles.educationList}>
                {data.length === 0 ? (
                    <div className={styles.emptyState}>
                        <GraduationCap size={48} />
                        <p>아직 추가된 학력이 없습니다.</p>
                        <button className={styles.addFirstButton} onClick={addEducation}>
                            첫 번째 학력 추가하기
                        </button>
                    </div>
                ) : (
                    data.map((education) => (
                        <div key={education.id} className={styles.educationCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardTitle}>
                                    {education.school || '학교명'} - {education.major || '전공'}
                                </div>
                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.editButton}
                                        onClick={() =>
                                            setEditingId(
                                                editingId === education.id ? null : education.id
                                            )
                                        }>
                                        {editingId === education.id ? '완료' : '편집'}
                                    </button>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => deleteEducation(education.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {editingId === education.id && (
                                <div className={styles.editForm}>
                                    <div className={styles.row}>
                                        <div className={styles.field}>
                                            <label>학교명 *</label>
                                            <input
                                                type="text"
                                                value={education.school}
                                                onChange={(e) =>
                                                    updateEducation(
                                                        education.id,
                                                        'school',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="학교명을 입력하세요"
                                            />
                                        </div>
                                        <div className={styles.field}>
                                            <label>학위 *</label>
                                            <select
                                                value={education.degree}
                                                onChange={(e) =>
                                                    updateEducation(
                                                        education.id,
                                                        'degree',
                                                        e.target.value
                                                    )
                                                }>
                                                <option value="">학위 선택</option>
                                                <option value="고등학교">고등학교</option>
                                                <option value="전문학사">전문학사</option>
                                                <option value="학사">학사</option>
                                                <option value="석사">석사</option>
                                                <option value="박사">박사</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className={styles.field}>
                                        <label>전공</label>
                                        <input
                                            type="text"
                                            value={education.major}
                                            onChange={(e) =>
                                                updateEducation(
                                                    education.id,
                                                    'major',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="전공을 입력하세요"
                                        />
                                    </div>

                                    <div className={styles.row}>
                                        <div className={styles.field}>
                                            <label>입학일 *</label>
                                            <input
                                                type="month"
                                                value={education.startDate}
                                                onChange={(e) =>
                                                    updateEducation(
                                                        education.id,
                                                        'startDate',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className={styles.field}>
                                            <label>졸업일 *</label>
                                            <input
                                                type="month"
                                                value={education.endDate}
                                                onChange={(e) =>
                                                    updateEducation(
                                                        education.id,
                                                        'endDate',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.field}>
                                        <label>학점 (선택)</label>
                                        <input
                                            type="text"
                                            value={education.gpa || ''}
                                            onChange={(e) =>
                                                updateEducation(education.id, 'gpa', e.target.value)
                                            }
                                            placeholder="예: 3.8/4.5"
                                        />
                                    </div>
                                </div>
                            )}

                            {editingId !== education.id && (
                                <div className={styles.cardContent}>
                                    <div className={styles.degree}>{education.degree}</div>
                                    <div className={styles.period}>
                                        <Calendar size={14} />
                                        {education.startDate} - {education.endDate}
                                    </div>
                                    {education.gpa && (
                                        <div className={styles.gpa}>학점: {education.gpa}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default EducationForm;
