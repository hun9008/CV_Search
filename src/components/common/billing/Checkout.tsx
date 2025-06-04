import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { useEffect, useState } from 'react';
import { billingType } from '../../../types/billing';
import useBillingStore from '../../../store/billingStore';
import { useNavigate } from 'react-router-dom';
import './Payments.css';

// TODO: 구매자의 고유 아이디를 불러와서 customerKey로 설정하세요. 이메일・전화번호와 같이 유추가 가능한 값은 안전하지 않습니다.
// @docs https://docs.tosspayments.com/sdk/v2/js#토스페이먼츠-초기화
const clientKey = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm'; // 토스에서 제공하는 개발용 key (실제로 결제되지 않음)

export function CheckoutPage() {
    const { saveAmountInfo, setAmount } = useBillingStore();
    const amount = useBillingStore((state) => state.amount);
    const planName = useBillingStore((state) => state.planName);
    const navigate = useNavigate();
    // const [setAmount] = useState({
    //     currency: 'KRW',
    //     value: 1000,
    // });
    const [ready, setReady] = useState(false);
    const [widgets, setWidgets] = useState<
        import('@tosspayments/tosspayments-sdk').TossPaymentsWidgets | null
    >(null);

    useEffect(() => {
        async function fetchPaymentWidgets() {
            try {
                // const customerKey = useUserStore.getState().id;
                const customerKey = generateRandomString();
                // ------  SDK 초기화 ------
                // @docs https://docs.tosspayments.com/sdk/v2/js#토스페이먼츠-초기화
                const tossPayments = await loadTossPayments(clientKey);

                // 회원 결제
                // @docs https://docs.tosspayments.com/sdk/v2/js#tosspaymentswidgets
                const widgets = tossPayments.widgets({
                    customerKey,
                });
                // 비회원 결제
                // const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });

                setWidgets(widgets);
            } catch (error) {
                console.error('Error fetching payment widget:', error);
            }
        }

        fetchPaymentWidgets();
    }, []);

    useEffect(() => {
        async function renderPaymentWidgets() {
            if (widgets == null) {
                return;
            }

            // ------  주문서의 결제 금액 설정 ------
            // TODO: 위젯의 결제금액을 결제하려는 금액으로 초기화하세요.
            // TODO: renderPaymentMethods, renderAgreement, requestPayment 보다 반드시 선행되어야 합니다.
            if (amount) {
                await widgets.setAmount(amount);
            } else {
                return;
            }

            // ------  결제 UI 렌더링 ------
            // @docs https://docs.tosspayments.com/sdk/v2/js#widgetsrenderpaymentmethods
            await widgets.renderPaymentMethods({
                selector: '#payment-method',
                // 렌더링하고 싶은 결제 UI의 variantKey
                // 결제 수단 및 스타일이 다른 멀티 UI를 직접 만들고 싶다면 계약이 필요해요.
                // @docs https://docs.tosspayments.com/guides/v2/payment-widget/admin#새로운-결제-ui-추가하기
                variantKey: 'DEFAULT',
            });

            // ------  이용약관 UI 렌더링 ------
            // @docs https://docs.tosspayments.com/reference/widget-sdk#renderagreement선택자-옵션
            await widgets.renderAgreement({
                selector: '#agreement',
                variantKey: 'AGREEMENT',
            });

            setReady(true);
        }

        renderPaymentWidgets();
    }, [widgets, amount]);

    const updateAmount = async (amount: billingType) => {
        setAmount(amount);
        await widgets?.setAmount(amount);
    };

    return (
        <div className="wrapper">
            <div className="box_section">
                {/* 결제 UI */}
                <div id="payment-method" />
                {/* 이용약관 UI */}
                <div id="agreement" />
                {/* 쿠폰 체크박스 */}
                <div style={{ paddingLeft: '24px' }}>
                    <div className="checkable typography--p">
                        <label
                            htmlFor="coupon-box"
                            className="checkable__label typography--regular">
                            <input
                                id="coupon-box"
                                className="checkable__input"
                                type="checkbox"
                                aria-checked="true"
                                disabled={!ready}
                                // ------  주문서의 결제 금액이 변경되었을 경우 결제 금액 업데이트 ------
                                // @docs https://docs.tosspayments.com/sdk/v2/js#widgetssetamount
                                onChange={async (event) => {
                                    if (!amount) return;
                                    await updateAmount({
                                        currency: amount.currency,
                                        value: event.target.checked
                                            ? amount.value - 5000
                                            : amount.value + 5000,
                                    });
                                }}
                            />
                            <span className="checkable__label-text">5,000원 쿠폰 적용</span>
                        </label>
                    </div>
                </div>

                {/* 결제하기 버튼 */}
                <button
                    className="button"
                    style={{ marginTop: '30px' }}
                    disabled={!ready}
                    // ------ '결제하기' 버튼 누르면 결제창 띄우기 ------
                    // @docs https://docs.tosspayments.com/sdk/v2/js#widgetsrequestpayment
                    onClick={async () => {
                        try {
                            const id = generateRandomString();
                            await saveAmountInfo({
                                orderId: id,
                                amount: amount.value,
                            });
                            // 결제를 요청하기 전에 orderId, amount를 서버에 저장하세요.
                            // 결제 과정에서 악의적으로 결제 금액이 바뀌는 것을 확인하는 용도입니다.
                            // await widgets?.requestPayment({
                            //     orderId: id,
                            //     orderName: planName,
                            //     successUrl: `${SERVER_IP}/payments/success`,
                            //     failUrl: `${SERVER_IP}/payments/fail`,
                            //     customerEmail: 'customer123@gmail.com',
                            //     customerName: '김토스',
                            //     customerMobilePhone: '01012341234',
                            // });
                            await widgets?.requestPayment({
                                orderId: id,
                                orderName: planName,
                                successUrl: 'https://localhost:5173/success',
                                failUrl: 'https://localhost:5173/fail',
                                customerEmail: 'customer123@gmail.com',
                                customerName: '김토스',
                                customerMobilePhone: '01012341234',
                            });
                        } catch (error) {
                            navigate('/');
                            console.error(error);
                        }
                    }}>
                    결제하기
                </button>
            </div>
        </div>
    );
}

function generateRandomString() {
    return window.btoa(Math.random().toString()).slice(0, 20);
}
