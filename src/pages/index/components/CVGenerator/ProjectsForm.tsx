'use client';

import type React from 'react';

import { useState } from 'react';
import { Plus, Trash2, Award, Calendar, ExternalLink } from 'lucide-react';
import styles from './styles/ProjectsForm.module.scss';

interface Project {
    id: string;
    name: string;
    description: string;
    technologies: string[];
    startDate: string;
    endDate: string;
    url?: string;
}

interface ProjectsFormProps {
    data: Project[];
    onChange: (data: Project[]) => void;
}

function ProjectsForm({ data, onChange }: ProjectsFormProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [techInput, setTechInput] = useState<{ [key: string]: string }>({});

    const addProject = () => {
        const newProject: Project = {
            id: Date.now().toString(),
            name: '',
            description: '',
            technologies: [],
            startDate: '',
            endDate: '',
            url: '',
        };
        onChange([...data, newProject]);
        setEditingId(newProject.id);
    };

    const updateProject = (id: string, field: keyof Project, value: any) => {
        const updated = data.map((project) =>
            project.id === id ? { ...project, [field]: value } : project
        );
        onChange(updated);
    };

    const deleteProject = (id: string) => {
        onChange(data.filter((project) => project.id !== id));
    };

    const addTechnology = (projectId: string) => {
        const tech = techInput[projectId]?.trim();
        if (!tech) return;

        const updated = data.map((project) =>
            project.id === projectId
                ? { ...project, technologies: [...project.technologies, tech] }
                : project
        );
        onChange(updated);
        setTechInput((prev) => ({ ...prev, [projectId]: '' }));
    };

    const removeTechnology = (projectId: string, techIndex: number) => {
        const updated = data.map((project) =>
            project.id === projectId
                ? {
                      ...project,
                      technologies: project.technologies.filter((_, index) => index !== techIndex),
                  }
                : project
        );
        onChange(updated);
    };

    const handleTechKeyPress = (e: React.KeyboardEvent, projectId: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTechnology(projectId);
        }
    };

    return (
        <div className={styles.projectsForm}>
            <div className={styles.header}>
                <Award size={24} />
                <h2>프로젝트</h2>
                <button className={styles.addButton} onClick={addProject}>
                    <Plus size={16} />
                    프로젝트 추가
                </button>
            </div>

            <div className={styles.projectsList}>
                {data.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Award size={48} />
                        <p>아직 추가된 프로젝트가 없습니다.</p>
                        <button className={styles.addFirstButton} onClick={addProject}>
                            첫 번째 프로젝트 추가하기
                        </button>
                    </div>
                ) : (
                    data.map((project) => (
                        <div key={project.id} className={styles.projectCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardTitle}>
                                    {project.name || '프로젝트명'}
                                    {project.url && editingId !== project.id && (
                                        <a
                                            href={project.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.projectLink}>
                                            <ExternalLink size={16} />
                                        </a>
                                    )}
                                </div>
                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.editButton}
                                        onClick={() =>
                                            setEditingId(
                                                editingId === project.id ? null : project.id
                                            )
                                        }>
                                        {editingId === project.id ? '완료' : '편집'}
                                    </button>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => deleteProject(project.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {editingId === project.id && (
                                <div className={styles.editForm}>
                                    <div className={styles.field}>
                                        <label>프로젝트명 *</label>
                                        <input
                                            type="text"
                                            value={project.name}
                                            onChange={(e) =>
                                                updateProject(project.id, 'name', e.target.value)
                                            }
                                            placeholder="프로젝트명을 입력하세요"
                                        />
                                    </div>

                                    <div className={styles.row}>
                                        <div className={styles.field}>
                                            <label>시작일 *</label>
                                            <input
                                                type="month"
                                                value={project.startDate}
                                                onChange={(e) =>
                                                    updateProject(
                                                        project.id,
                                                        'startDate',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className={styles.field}>
                                            <label>종료일 *</label>
                                            <input
                                                type="month"
                                                value={project.endDate}
                                                onChange={(e) =>
                                                    updateProject(
                                                        project.id,
                                                        'endDate',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.field}>
                                        <label>프로젝트 URL (선택)</label>
                                        <input
                                            type="url"
                                            value={project.url || ''}
                                            onChange={(e) =>
                                                updateProject(project.id, 'url', e.target.value)
                                            }
                                            placeholder="https://github.com/username/project"
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label>프로젝트 설명 *</label>
                                        <textarea
                                            value={project.description}
                                            onChange={(e) =>
                                                updateProject(
                                                    project.id,
                                                    'description',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="프로젝트에 대한 상세한 설명을 작성해주세요..."
                                            rows={4}
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label>사용 기술</label>
                                        <div className={styles.technologies}>
                                            {project.technologies.map((tech, index) => (
                                                <div key={index} className={styles.techTag}>
                                                    <span>{tech}</span>
                                                    <button
                                                        className={styles.removeTech}
                                                        onClick={() =>
                                                            removeTechnology(project.id, index)
                                                        }>
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className={styles.addTechInput}>
                                            <input
                                                type="text"
                                                value={techInput[project.id] || ''}
                                                onChange={(e) =>
                                                    setTechInput((prev) => ({
                                                        ...prev,
                                                        [project.id]: e.target.value,
                                                    }))
                                                }
                                                onKeyPress={(e) =>
                                                    handleTechKeyPress(e, project.id)
                                                }
                                                placeholder="기술명을 입력하고 Enter를 누르세요"
                                            />
                                            <button
                                                className={styles.addTechButton}
                                                onClick={() => addTechnology(project.id)}>
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {editingId !== project.id && (
                                <div className={styles.cardContent}>
                                    <div className={styles.period}>
                                        <Calendar size={14} />
                                        {project.startDate} - {project.endDate}
                                    </div>
                                    {project.description && (
                                        <p className={styles.description}>{project.description}</p>
                                    )}
                                    {project.technologies.length > 0 && (
                                        <div className={styles.technologies}>
                                            {project.technologies.map((tech, index) => (
                                                <span key={index} className={styles.techTag}>
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
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

export default ProjectsForm;
