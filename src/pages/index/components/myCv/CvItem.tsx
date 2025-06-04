import type React from 'react';
import { useState, useEffect, useRef } from 'react'; // useEffect, useRef 추가
import style from './styles/CVViewer.module.scss';
import useCvStore, { type CvMe } from '../../../../store/cvStore';
import { Eye, FileText, Loader2, Trash2, Edit3, Check, X } from 'lucide-react';
import CVDeleteDialog from '../../../../components/common/dialog/CVDeleteDialog';
import useJobStore from '../../../../store/jobStore';

interface CvItemProps {
    cv: CvMe;
    onView: (fileName: string) => void;
    onRename: (cv: CvMe, newName: string) => void; // newName 파라미터 추가
    isViewingThis: boolean;
    isLoadingThis: boolean;
}

function CvItem({ cv, onView, onRename, isViewingThis, isLoadingThis }: CvItemProps) {
    const { setSelectedCvId } = useJobStore();
    const selctedCvId = useJobStore((state) => state.selectedCVId);
    const [deleteDialogHidden, setDeleteDialogHidden] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const userCvList = useCvStore((state) => state.userCvList);
    const inputRef = useRef<HTMLInputElement>(null); // input 참조를 위한 ref

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus(); // 이름 변경 모드 시작 시 input에 포커스
            inputRef.current.select(); // 기존 텍스트 전체 선택
        }
    }, [isRenaming]);

    const startRename = (e: React.MouseEvent) => {
        e.stopPropagation(); // 이벤트 버블링 방지
        setIsRenaming(true);
        setNewFileName(cv.fileName || '');
    };

    const handleSelectCv = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedCvId(cv.id);
    };

    useEffect(() => {}, [selctedCvId]);

    const handleConfirmRename = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation(); // 이벤트 버블링 방지
        const trimmedNewName = newFileName.trim();
        if (trimmedNewName === '' || trimmedNewName === cv.fileName) {
            // 이름이 비어있거나 변경되지 않았으면 취소
            setIsRenaming(false);
            return;
        }
        onRename(cv, trimmedNewName); // 부모 컴포넌트로 cv 객체와 새 이름 전달
        setIsRenaming(false);
    };

    const handleCancelRename = (e?: React.MouseEvent | React.KeyboardEvent) => {
        e?.stopPropagation(); // 이벤트 버블링 방지
        setIsRenaming(false);
        setNewFileName(cv.fileName || ''); // 원래 이름으로 복원
    };

    const handleDeleteCV = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteDialogHidden((prev) => !prev);
    };

    const handleView = (e: React.MouseEvent) => {
        e.stopPropagation();
        onView(cv.fileName);
    };

    return (
        <>
            {deleteDialogHidden && (
                <CVDeleteDialog
                    isOpen={deleteDialogHidden}
                    onClose={() => setDeleteDialogHidden((prev) => !prev)}
                    fileName={cv.fileName}
                />
            )}
            {userCvList.length === 1 && !isRenaming ? ( // isRenaming 아닐 때만 단일 CV 뷰어 버튼 표시
                <div className={style.container}>
                    {isViewingThis && (
                        <button className={style.viewerButton} onClick={handleView}>
                            클릭하여 등록한 CV 보기
                        </button>
                    )}
                </div>
            ) : (
                <div
                    className={`${style.cvCard} ${
                        isViewingThis && !isRenaming ? style.cvCardHidden : ''
                    } ${selctedCvId === cv.id ? style.popular : ''}`}
                    onClick={handleSelectCv}>
                    {selctedCvId === cv.id && <div className={style.popularBadge}>선택된 CV</div>}
                    <div className={style.cvCardPreview}>
                        <div className={style.cvCard__header}>
                            <FileText size={30} className={style.cvCard__header__icon} />
                            {isRenaming ? (
                                <div
                                    className={style.renameInputContainer}
                                    onClick={(e) => e.stopPropagation()}>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={newFileName}
                                        onChange={(e) => setNewFileName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleConfirmRename(e);
                                            if (e.key === 'Escape') handleCancelRename(e);
                                        }}
                                        className={style.renameInput}
                                    />
                                    <button
                                        onClick={handleConfirmRename}
                                        className={`${style.actionButton} ${style.saveButton}`}
                                        title="이름 저장">
                                        <Check size={18} />
                                    </button>
                                    <button
                                        onClick={handleCancelRename}
                                        className={`${style.actionButton} ${style.cancelButton}`}
                                        title="변경 취소">
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <h2
                                    className={style.cvCard__header__title}
                                    title={cv.fileName || '이름 없는 CV'}>
                                    {cv.fileName || '이름 없는 CV'}
                                </h2>
                            )}
                            {!isRenaming && ( // 이름 변경 중이 아닐 때만 업로드 날짜 표시
                                <p className={style.cvCard__header__subTitle}>
                                    업로드 일자:{' '}
                                    {cv.uploadedAt
                                        ? new Date(cv.uploadedAt).toLocaleDateString('ko-KR')
                                        : ''}
                                </p>
                            )}
                        </div>

                        <div className={style.cvCardActions}>
                            <button
                                className={`${style.actionButton} ${style.viewButton}`}
                                onClick={handleView}
                                disabled={isLoadingThis || isRenaming} // 이름 변경 중에는 보기 버튼 비활성화
                                title="CV 보기">
                                {isLoadingThis ? (
                                    <Loader2 size={18} className={style.animateSpin} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                            <button
                                className={`${style.actionButton} ${style.renameButton}`}
                                onClick={startRename}
                                disabled={isRenaming} // 이름 변경 중에는 이름 변경 버튼 비활성화
                                title="CV 이름 변경">
                                <Edit3 size={18} />
                            </button>
                            <button
                                className={`${style.actionButton} ${style.deleteButton}`}
                                onClick={handleDeleteCV}
                                disabled={isRenaming} // 이름 변경 중에는 삭제 버튼 비활성화
                                title="CV 삭제">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CvItem;
