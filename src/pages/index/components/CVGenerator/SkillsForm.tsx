'use client';

import type React from 'react';

import { useState } from 'react';
import { Plus, Trash2, Code, X } from 'lucide-react';
import styles from './styles/SkillsForm.module.scss';

interface Skill {
    id: string;
    category: string;
    items: string[];
}

interface SkillsFormProps {
    data: Skill[];
    onChange: (data: Skill[]) => void;
}

function SkillsForm({ data, onChange }: SkillsFormProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newSkillInput, setNewSkillInput] = useState<{ [key: string]: string }>({});

    const predefinedCategories = [
        '프로그래밍 언어',
        '프레임워크/라이브러리',
        '데이터베이스',
        '도구/기술',
        '언어',
        '기타',
    ];

    const addSkillCategory = () => {
        const newSkill: Skill = {
            id: Date.now().toString(),
            category: '',
            items: [],
        };
        onChange([...data, newSkill]);
        setEditingId(newSkill.id);
    };

    const updateSkillCategory = (id: string, category: string) => {
        const updated = data.map((skill) => (skill.id === id ? { ...skill, category } : skill));
        onChange(updated);
    };

    const addSkillItem = (categoryId: string) => {
        const skillText = newSkillInput[categoryId]?.trim();
        if (!skillText) return;

        const updated = data.map((skill) =>
            skill.id === categoryId ? { ...skill, items: [...skill.items, skillText] } : skill
        );
        onChange(updated);
        setNewSkillInput((prev) => ({ ...prev, [categoryId]: '' }));
    };

    const removeSkillItem = (categoryId: string, itemIndex: number) => {
        const updated = data.map((skill) =>
            skill.id === categoryId
                ? { ...skill, items: skill.items.filter((_, index) => index !== itemIndex) }
                : skill
        );
        onChange(updated);
    };

    const deleteSkillCategory = (id: string) => {
        onChange(data.filter((skill) => skill.id !== id));
    };

    const handleKeyPress = (e: React.KeyboardEvent, categoryId: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkillItem(categoryId);
        }
    };

    return (
        <div className={styles.skillsForm}>
            <div className={styles.header}>
                <Code size={24} />
                <h2>기술스택</h2>
                <button className={styles.addButton} onClick={addSkillCategory}>
                    <Plus size={16} />
                    카테고리 추가
                </button>
            </div>

            <div className={styles.skillsList}>
                {data.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Code size={48} />
                        <p>아직 추가된 기술스택이 없습니다.</p>
                        <button className={styles.addFirstButton} onClick={addSkillCategory}>
                            첫 번째 기술스택 추가하기
                        </button>
                    </div>
                ) : (
                    data.map((skillCategory) => (
                        <div key={skillCategory.id} className={styles.skillCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardTitle}>
                                    {editingId === skillCategory.id ? (
                                        <select
                                            value={skillCategory.category}
                                            onChange={(e) =>
                                                updateSkillCategory(
                                                    skillCategory.id,
                                                    e.target.value
                                                )
                                            }
                                            className={styles.categorySelect}>
                                            <option value="">카테고리 선택</option>
                                            {predefinedCategories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        skillCategory.category || '카테고리 미설정'
                                    )}
                                </div>
                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.editButton}
                                        onClick={() =>
                                            setEditingId(
                                                editingId === skillCategory.id
                                                    ? null
                                                    : skillCategory.id
                                            )
                                        }>
                                        {editingId === skillCategory.id ? '완료' : '편집'}
                                    </button>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => deleteSkillCategory(skillCategory.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className={styles.cardContent}>
                                <div className={styles.skillItems}>
                                    {skillCategory.items.map((item, index) => (
                                        <div key={index} className={styles.skillTag}>
                                            <span>{item}</span>
                                            {editingId === skillCategory.id && (
                                                <button
                                                    className={styles.removeSkill}
                                                    onClick={() =>
                                                        removeSkillItem(skillCategory.id, index)
                                                    }>
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {editingId === skillCategory.id && (
                                    <div className={styles.addSkillInput}>
                                        <input
                                            type="text"
                                            value={newSkillInput[skillCategory.id] || ''}
                                            onChange={(e) =>
                                                setNewSkillInput((prev) => ({
                                                    ...prev,
                                                    [skillCategory.id]: e.target.value,
                                                }))
                                            }
                                            onKeyPress={(e) => handleKeyPress(e, skillCategory.id)}
                                            placeholder="기술명을 입력하고 Enter를 누르세요"
                                        />
                                        <button
                                            className={styles.addSkillButton}
                                            onClick={() => addSkillItem(skillCategory.id)}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default SkillsForm;
