'use client';

import type React from 'react';
import { type LucideIcon, CheckCircle2 } from 'lucide-react';
import style from './PricingCard.module.scss';

interface PricingCardProps {
    planName: string;
    price: string;
    billingAmount?: number;
    priceDescription: string;
    features: string[];
    ctaText: string;
    onSelect: () => void;
    isPopular?: boolean;
    IconComponent: LucideIcon;
}

const PricingCard: React.FC<PricingCardProps> = ({
    planName,
    price,
    priceDescription,
    features,
    ctaText,
    onSelect,
    isPopular = false,
    IconComponent,
}) => {
    return (
        <div className={`${style.pricingCard} ${isPopular ? style.popular : ''} `}>
            {isPopular && <div className={style.popularBadge}>추천 플랜</div>}
            <div>
                <div className={style.pricingCard__iconContainer}>
                    <IconComponent size={48} className={style.pricingCard__icon} />
                </div>
                <h3 className={style.pricingCard__planName}>{planName}</h3>
                <p className={style.pricingCard__price}>{price}</p>

                <p className={style.pricingCard__priceDescription}>{priceDescription}</p>
            </div>
            <ul className={style.pricingCard__features}>
                {features.map((feature, index) => (
                    <li key={index}>
                        <CheckCircle2 size={18} className={style.featureIcon} />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
            <button className={style.pricingCard__ctaButton} onClick={onSelect}>
                {ctaText}
            </button>
        </div>
    );
};

export default PricingCard;
