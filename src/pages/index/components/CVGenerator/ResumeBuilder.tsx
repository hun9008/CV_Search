'use client';

import { useState } from 'react';
import {
    Download,
    Eye,
    Save,
    FileText,
    User,
    Briefcase,
    GraduationCap,
    Code,
    Award,
} from 'lucide-react';
import styles from './styles/ResumeBuilder.module.scss';
import PersonalInfoForm from './PersonalInfoForm';
import ExperienceForm from './ExperienceForm';
import EducationForm from './EducationForm';
import SkillsForm from './SkillsForm';
import ProjectsForm from './ProjectsForm';
import ResumePreview from './ResumePreview';

interface ResumeData {
    personalInfo: {
        name: string;
        email: string;
        phone: string;
        address: string;
        summary: string;
        profileImage?: string;
    };
    experiences: Array<{
        id: string;
        company: string;
        position: string;
        startDate: string;
        endDate: string;
        current: boolean;
        description: string;
    }>;
    education: Array<{
        id: string;
        school: string;
        degree: string;
        major: string;
        startDate: string;
        endDate: string;
        gpa?: string;
    }>;
    skills: Array<{
        id: string;
        category: string;
        items: string[];
    }>;
    projects: Array<{
        id: string;
        name: string;
        description: string;
        technologies: string[];
        startDate: string;
        endDate: string;
        url?: string;
    }>;
}

const initialResumeData: ResumeData = {
    personalInfo: {
        name: '',
        email: '',
        phone: '',
        address: '',
        summary: '',
    },
    experiences: [],
    education: [],
    skills: [],
    projects: [],
};

function ResumeBuilder() {
    const [activeSection, setActiveSection] = useState<string>('personal');
    const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
    const [showPreview, setShowPreview] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('modern');

    const sections = [
        { id: 'personal', label: '개인정보', icon: User },
        { id: 'experience', label: '경력사항', icon: Briefcase },
        { id: 'education', label: '학력사항', icon: GraduationCap },
        { id: 'skills', label: '기술스택', icon: Code },
        { id: 'projects', label: '프로젝트', icon: Award },
    ];

    const templates = [
        { id: 'modern', name: '모던' },
        { id: 'classic', name: '클래식' },
        { id: 'creative', name: '크리에이티브' },
        { id: 'minimal', name: '미니멀' },
    ];

    const updateResumeData = (section: keyof ResumeData, data: any) => {
        setResumeData((prev) => ({
            ...prev,
            [section]: data,
        }));
    };

    const handleSave = () => {
        console.log('이력서 저장:', resumeData);
    };

    const handleDownload = () => {
        console.log('PDF 다운로드');
    };

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'personal':
                return (
                    <PersonalInfoForm
                        data={resumeData.personalInfo}
                        onChange={(data) => updateResumeData('personalInfo', data)}
                    />
                );
            case 'experience':
                return (
                    <ExperienceForm
                        data={resumeData.experiences}
                        onChange={(data) => updateResumeData('experiences', data)}
                    />
                );
            case 'education':
                return (
                    <EducationForm
                        data={resumeData.education}
                        onChange={(data) => updateResumeData('education', data)}
                    />
                );
            case 'skills':
                return (
                    <SkillsForm
                        data={resumeData.skills}
                        onChange={(data) => updateResumeData('skills', data)}
                    />
                );
            case 'projects':
                return (
                    <ProjectsForm
                        data={resumeData.projects}
                        onChange={(data) => updateResumeData('projects', data)}
                    />
                );
            default:
                return null;
        }
    };

    if (showPreview) {
        return (
            <div className={styles.resumeBuilder}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <button className={styles.backButton} onClick={() => setShowPreview(false)}>
                            ← 편집으로 돌아가기
                        </button>
                    </div>
                    <div className={styles.headerActions}>
                        <button className={styles.actionButton} onClick={handleSave}>
                            <Save size={16} />
                            저장
                        </button>
                        <button className={styles.actionButton} onClick={handleDownload}>
                            <Download size={16} />
                            PDF 다운로드
                        </button>
                    </div>
                </div>
                <div className={styles.previewContent}>
                    <ResumePreview data={resumeData} template={selectedTemplate} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.resumeBuilder}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <FileText size={20} />
                    <h1>이력서 빌더</h1>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.actionButton} onClick={handleSave}>
                        <Save size={16} />
                        저장
                    </button>
                    <button className={styles.actionButton} onClick={() => setShowPreview(true)}>
                        <Eye size={16} />
                        미리보기
                    </button>
                </div>
            </div>

            <div className={styles.templateSelector}>
                <span className={styles.templateLabel}>템플릿:</span>
                <div className={styles.templateOptions}>
                    {templates.map((template) => (
                        <button
                            key={template.id}
                            className={`${styles.templateButton} ${
                                selectedTemplate === template.id ? styles.active : ''
                            }`}
                            onClick={() => setSelectedTemplate(template.id)}>
                            {template.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.sectionTabs}>
                {sections.map((section) => (
                    <button
                        key={section.id}
                        className={`${styles.tabButton} ${
                            activeSection === section.id ? styles.active : ''
                        }`}
                        onClick={() => setActiveSection(section.id)}>
                        <section.icon size={16} />
                        {section.label}
                    </button>
                ))}
            </div>

            <div className={styles.content}>{renderSectionContent()}</div>
        </div>
    );
}

export default ResumeBuilder;
