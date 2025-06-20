import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useBillingStore from '../../../store/billingStore';
import './Payments.css';
// import { verifyResponse } from '../../../types/billing';
import usePageStore from '../../../store/pageStore';

export function SuccessPage() {
    const navigate = useNavigate();
    const previousPage = usePageStore((state) => state.previousPage);
    const { verifyAmountInfo, confirmPayments } = useBillingStore();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        async function confirm() {
            const requestData = {
                orderId: searchParams.get('orderId') ?? '',
                amount: Number(searchParams.get('amount')) || 0,
            };

            const confirmData = {
                orderId: searchParams.get('orderId') ?? '',
                amount: Number(searchParams.get('amount')) || 0,
                paymentKey: searchParams.get('paymentKey') ?? '',
            };

            try {
                await verifyAmountInfo(requestData);
                await confirmPayments(confirmData);
                navigate(previousPage);
            } catch (error) {
                const err = error as { code?: string; message?: string };
                navigate(
                    `/fail?code=${err.code ?? ''}&message=${encodeURIComponent(
                        err.message ?? 'Unknown error'
                    )}`
                );
            }
        }

        confirm();
    }, [searchParams, navigate]);

    return (
        <div className="result wrapper">
            <div className="box_section" style={{ width: '600px' }}>
                <img
                    width="100px"
                    src="https://static.toss.im/illusts/check-blue-spot-ending-frame.png"
                    alt="성공 이미지"
                />
                <h2>결제를 완료했어요</h2>
                <div className="p-grid typography--p" style={{ marginTop: '50px' }}>
                    <div className="p-grid-col text--left">
                        <b>결제금액</b>
                    </div>
                    <div className="p-grid-col text--right" id="amount">
                        {`${Number(searchParams.get('amount')).toLocaleString()}원`}
                    </div>
                </div>
                <div className="p-grid typography--p" style={{ marginTop: '10px' }}>
                    <div className="p-grid-col text--left">
                        <b>주문번호</b>
                    </div>
                    <div className="p-grid-col text--right" id="orderId">
                        {searchParams.get('orderId')}
                    </div>
                </div>

                <div className="p-grid-col">
                    <Link to="https://docs.tosspayments.com/guides/v2/payment-widget/integration">
                        <button className="button p-grid-col5">연동 문서</button>
                    </Link>
                    <Link to="https://discord.gg/A4fRFXQhRu">
                        <button
                            className="button p-grid-col5"
                            style={{ backgroundColor: '#e8f3ff', color: '#1b64da' }}>
                            실시간 문의
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
