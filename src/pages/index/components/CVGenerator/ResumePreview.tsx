import styles from './styles/ResumePreview.module.scss';

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

interface ResumePreviewProps {
    data: ResumeData;
    template: string;
}

function ResumePreview({ data, template }: ResumePreviewProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const [year, month] = dateString.split('-');
        return `${year}.${month}`;
    };

    const renderModernTemplate = () => (
        <div className={`${styles.resumeTemplate} ${styles.modern}`}>
            {/* Header Section */}
            <div className={styles.header}>
                <div className={styles.personalInfo}>
                    {data.personalInfo.profileImage && (
                        <div className={styles.profileImage}>
                            <img
                                src={data.personalInfo.profileImage || '/placeholder.svg'}
                                alt="프로필"
                            />
                        </div>
                    )}
                    <div className={styles.basicInfo}>
                        <h1 className={styles.name}>{data.personalInfo.name || '이름'}</h1>
                        <div className={styles.contact}>
                            <span>{data.personalInfo.email}</span>
                            <span>{data.personalInfo.phone}</span>
                            <span>{data.personalInfo.address}</span>
                        </div>
                    </div>
                </div>
                {data.personalInfo.summary && (
                    <div className={styles.summary}>
                        <h3>자기소개</h3>
                        <p>{data.personalInfo.summary}</p>
                    </div>
                )}
            </div>

            {/* Experience Section */}
            {data.experiences.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>경력사항</h2>
                    {data.experiences.map((exp) => (
                        <div key={exp.id} className={styles.item}>
                            <div className={styles.itemHeader}>
                                <h3>{exp.company}</h3>
                                <span className={styles.period}>
                                    {formatDate(exp.startDate)} -{' '}
                                    {exp.current ? '현재' : formatDate(exp.endDate)}
                                </span>
                            </div>
                            <h4 className={styles.position}>{exp.position}</h4>
                            {exp.description && (
                                <p className={styles.description}>{exp.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Education Section */}
            {data.education.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>학력사항</h2>
                    {data.education.map((edu) => (
                        <div key={edu.id} className={styles.item}>
                            <div className={styles.itemHeader}>
                                <h3>{edu.school}</h3>
                                <span className={styles.period}>
                                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                                </span>
                            </div>
                            <h4>
                                {edu.degree} - {edu.major}
                            </h4>
                            {edu.gpa && <p className={styles.gpa}>학점: {edu.gpa}</p>}
                        </div>
                    ))}
                </div>
            )}

            {/* Skills Section */}
            {data.skills.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>기술스택</h2>
                    {data.skills.map((skillCategory) => (
                        <div key={skillCategory.id} className={styles.skillCategory}>
                            <h3 className={styles.skillCategoryTitle}>{skillCategory.category}</h3>
                            <div className={styles.skillItems}>
                                {skillCategory.items.map((skill, index) => (
                                    <span key={index} className={styles.skillTag}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Projects Section */}
            {data.projects.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>프로젝트</h2>
                    {data.projects.map((project) => (
                        <div key={project.id} className={styles.item}>
                            <div className={styles.itemHeader}>
                                <h3>{project.name}</h3>
                                <span className={styles.period}>
                                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                                </span>
                            </div>
                            {project.description && (
                                <p className={styles.description}>{project.description}</p>
                            )}
                            {project.technologies.length > 0 && (
                                <div className={styles.technologies}>
                                    <strong>사용 기술: </strong>
                                    {project.technologies.join(', ')}
                                </div>
                            )}
                            {project.url && (
                                <div className={styles.projectUrl}>
                                    <strong>URL: </strong>
                                    <a href={project.url} target="_blank" rel="noopener noreferrer">
                                        {project.url}
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className={styles.resumePreview}>
            <div className={styles.previewContent}>
                {template === 'modern' && renderModernTemplate()}
                {/* 다른 템플릿들도 여기에 추가 가능 */}
            </div>
        </div>
    );
}

export default ResumePreview;
