'use client';

import { useState } from 'react';
import { Plus, Trash2, Briefcase, Calendar } from 'lucide-react';
import styles from './styles/ExperienceForm.module.scss';

interface Experience {
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
}

interface ExperienceFormProps {
    data: Experience[];
    onChange: (data: Experience[]) => void;
}

function ExperienceForm({ data, onChange }: ExperienceFormProps) {
    const [editingId, setEditingId] = useState<string | null>(null);

    const addExperience = () => {
        const newExperience: Experience = {
            id: Date.now().toString(),
            company: '',
            position: '',
            startDate: '',
            endDate: '',
            current: false,
            description: '',
        };
        onChange([...data, newExperience]);
        setEditingId(newExperience.id);
    };

    const updateExperience = (id: string, field: keyof Experience, value: any) => {
        const updated = data.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp));
        onChange(updated);
    };

    const deleteExperience = (id: string) => {
        onChange(data.filter((exp) => exp.id !== id));
    };

    return (
        <div className={styles.experienceForm}>
            <div className={styles.header}>
                <Briefcase size={24} />
                <h2>경력사항</h2>
                <button className={styles.addButton} onClick={addExperience}>
                    <Plus size={16} />
                    경력 추가
                </button>
            </div>

            <div className={styles.experienceList}>
                {data.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Briefcase size={48} />
                        <p>아직 추가된 경력이 없습니다.</p>
                        <button className={styles.addFirstButton} onClick={addExperience}>
                            첫 번째 경력 추가하기
                        </button>
                    </div>
                ) : (
                    data.map((experience) => (
                        <div key={experience.id} className={styles.experienceCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardTitle}>
                                    {experience.company || '회사명'} -{' '}
                                    {experience.position || '직책'}
                                </div>
                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.editButton}
                                        onClick={() =>
                                            setEditingId(
                                                editingId === experience.id ? null : experience.id
                                            )
                                        }>
                                        {editingId === experience.id ? '완료' : '편집'}
                                    </button>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => deleteExperience(experience.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {editingId === experience.id && (
                                <div className={styles.editForm}>
                                    <div className={styles.row}>
                                        <div className={styles.field}>
                                            <label>회사명 *</label>
                                            <input
                                                type="text"
                                                value={experience.company}
                                                onChange={(e) =>
                                                    updateExperience(
                                                        experience.id,
                                                        'company',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="회사명을 입력하세요"
                                            />
                                        </div>
                                        <div className={styles.field}>
                                            <label>직책 *</label>
                                            <input
                                                type="text"
                                                value={experience.position}
                                                onChange={(e) =>
                                                    updateExperience(
                                                        experience.id,
                                                        'position',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="직책을 입력하세요"
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.row}>
                                        <div className={styles.field}>
                                            <label>시작일 *</label>
                                            <input
                                                type="month"
                                                value={experience.startDate}
                                                onChange={(e) =>
                                                    updateExperience(
                                                        experience.id,
                                                        'startDate',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className={styles.field}>
                                            <label>종료일</label>
                                            <input
                                                type="month"
                                                value={experience.endDate}
                                                onChange={(e) =>
                                                    updateExperience(
                                                        experience.id,
                                                        'endDate',
                                                        e.target.value
                                                    )
                                                }
                                                disabled={experience.current}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.checkboxField}>
                                        <label className={styles.checkbox}>
                                            <input
                                                type="checkbox"
                                                checked={experience.current}
                                                onChange={(e) =>
                                                    updateExperience(
                                                        experience.id,
                                                        'current',
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                            현재 재직중
                                        </label>
                                    </div>

                                    <div className={styles.field}>
                                        <label>업무 설명</label>
                                        <textarea
                                            value={experience.description}
                                            onChange={(e) =>
                                                updateExperience(
                                                    experience.id,
                                                    'description',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="담당했던 업무나 성과를 구체적으로 작성해주세요..."
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            )}

                            {editingId !== experience.id && (
                                <div className={styles.cardContent}>
                                    <div className={styles.period}>
                                        <Calendar size={14} />
                                        {experience.startDate} -{' '}
                                        {experience.current ? '현재' : experience.endDate}
                                    </div>
                                    {experience.description && (
                                        <p className={styles.description}>
                                            {experience.description}
                                        </p>
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

export default ExperienceForm;
