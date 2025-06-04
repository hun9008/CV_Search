'use client';

import type React from 'react';
import { useEffect, useRef } from 'react';
import { X, Rocket, TrendingUp, Building2 } from 'lucide-react';
import PricingCard from './PricingCard';
import style from './PricingDialog.module.scss';
import useBillingStore from '../../../store/billingStore';
import { useNavigate } from 'react-router-dom';

interface PricingDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const PricingDialog: React.FC<PricingDialogProps> = ({ isOpen, onClose }) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const { setAmount, setPlanName } = useBillingStore();
    const navigate = useNavigate();

    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    const handlePurchaceButtonClick = (planName: string, purchaceAmount?: number) => {
        if (purchaceAmount) {
            setAmount({ currency: 'KRW', value: purchaceAmount });
            setPlanName(planName);
        }
        onClose();
        navigate('/payments');
    };

    const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
            onClose();
        }
    };

    const handlePlanSelect = (planName: string) => {
        console.log(`${planName} 플랜 선택됨`);
        // 실제 결제 처리 로직 또는 다음 단계로 이동하는 로직을 여기에 추가합니다.
        // 예: navigateToCheckout(planName);
        onClose(); // 선택 후 다이얼로그 닫기 (선택 사항)
    };

    if (!isOpen) {
        return null;
    }

    const plans = [
        {
            planName: '스타터',
            price: '무료',
            priceDescription: '/월',
            features: [
                '기본 CV 분석 (월 2회)',
                '제한된 추천 공고',
                '기본 지원 관리',
                '최대 1개의 CV 업로드 가능',
            ],
            ctaText: '스타터 플랜 시작',
            IconComponent: TrendingUp,
            onSelect: () => handlePlanSelect('스타터'),
        },
        {
            planName: '베이직',
            price: '10,900원',
            billingAmount: 10900,
            priceDescription: '/월',
            features: [
                '상세 CV 분석 (월 20회)',
                'AI 기반 맞춤 추천',
                '모든 추천 공고 접근',
                '최대 6개의 CV 업로드 가능',
            ],
            ctaText: '베이직 플랜 시작',
            isPopular: true,
            IconComponent: Rocket,
            onSelect: () => handlePlanSelect('베이직'),
        },
        {
            planName: '엔터프라이즈',
            price: '별도 문의',
            priceDescription: '/월',
            features: [
                '헤드헌팅 기능 지원',
                '자체 공고 업로드 지원',
                '협의에 따라 광고 기능',
                '우선 고객 지원',
            ],
            ctaText: '문의',
            IconComponent: Building2,
            onSelect: () => handlePlanSelect('엔터프라이즈'),
        },
    ];

    return (
        <div
            className={style.dialogOverlay}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialogTitle">
            <div className={style.dialogContent} ref={dialogRef}>
                <div className={style.dialogContent__header}>
                    <h2 id="dialogTitle" className={style.dialogContent__title}>
                        요금제 업그레이드
                    </h2>
                    <button
                        className={style.dialogContent__closeButton}
                        onClick={onClose}
                        aria-label="닫기">
                        <X size={24} />
                    </button>
                </div>
                <p className={style.dialogContent__description}>
                    goodJob의 모든 기능을 활용하여 커리어 목표를 달성하세요.
                </p>
                <div className={style.dialogContent__plansContainer}>
                    {plans.map((plan) => (
                        <PricingCard
                            key={plan.planName}
                            {...plan}
                            onSelect={() =>
                                handlePurchaceButtonClick(plan.planName, plan.billingAmount)
                            }
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PricingDialog;
