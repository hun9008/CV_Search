import useApplyStore from '../../../store/applyStore';
import style from './styles/StatusDialog.module.scss';

interface StatusDialogProps {
    jobId: number;
    onClose: () => void;
}
function StatusDialog({ jobId, onClose }: StatusDialogProps) {
    const applyStatus = ['준비중', '지원', '서류전형', '코테', '최종합격', '불합격'];
    const { editApplications, getApplications } = useApplyStore();

    const handleStatusButtonClick = async (status: string) => {
        const res = await editApplications(jobId, status, '');
        if (res === 204) {
            onClose();
            await getApplications();
        }
    };

    const StatusButton = ({ status }: { status: string }) => {
        return (
            <button className={style.statusButton} onClick={() => handleStatusButtonClick(status)}>
                {status}
            </button>
        );
    };
    return (
        <div className={style.container}>
            {applyStatus.map((status) => (
                <StatusButton status={status} />
            ))}
        </div>
    );
}

export default StatusDialog;
