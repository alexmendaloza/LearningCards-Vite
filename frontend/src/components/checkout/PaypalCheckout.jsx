import React, { useEffect, useRef, useState } from 'react';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
export const PAYPAL_MODE = import.meta.env.VITE_PAYPAL_MODE || 'sandbox';
const PAYPAL_CURRENCY = 'USD';
const PAYPAL_SCRIPT_ID = 'paypal-js-sdk';

const Loading = ({ text = 'Cargando...' }) => (
  <div className="py-16 text-center text-sm font-semibold text-slate-500 animate-pulse">{text}</div>
);

const loadPayPalSdk = () => new Promise((resolve, reject) => {
  if (window.paypal) {
    resolve(window.paypal);
    return;
  }

  const existingScript = document.getElementById(PAYPAL_SCRIPT_ID);
  if (existingScript) {
    existingScript.addEventListener('load', () => resolve(window.paypal), { once: true });
    existingScript.addEventListener('error', reject, { once: true });
    return;
  }

  const script = document.createElement('script');
  script.id = PAYPAL_SCRIPT_ID;
  script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&currency=${PAYPAL_CURRENCY}&intent=capture`;
  script.async = true;
  script.onload = () => resolve(window.paypal);
  script.onerror = () => reject(new Error('No fue posible cargar PayPal.'));
  document.body.appendChild(script);
});

const PaypalCheckout = ({ amount, publicationId, deckTitle, onApprovePayment, onCancel, onError }) => {
  const containerRef = useRef(null);
  const renderedRef = useRef(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!PAYPAL_CLIENT_ID) {
      setLoading(false);
      onError('Falta configurar VITE_PAYPAL_CLIENT_ID en el archivo .env.');
      return undefined;
    }

    loadPayPalSdk()
      .then((paypal) => {
        if (!active || !containerRef.current || renderedRef.current) return;
        renderedRef.current = true;
        setLoading(false);
        paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
          },
          createOrder: (paypalData, actions) => actions.order.create({
            purchase_units: [{
              reference_id: String(publicationId),
              description: deckTitle || 'Mazo LearningCards',
              amount: {
                currency_code: PAYPAL_CURRENCY,
                value: Number(amount || 0).toFixed(2),
              },
            }],
          }),
          onApprove: async (paypalData, actions) => {
            try {
              const details = await actions.order.capture();
              const captureId = details?.purchase_units?.[0]?.payments?.captures?.[0]?.id || '';
              await onApprovePayment({
                orderId: paypalData.orderID,
                payerId: paypalData.payerID,
                captureId,
              });
            } catch (err) {
              onError(err.response?.data?.message || err.message || 'PayPal aprobo el pago, pero no fue posible registrar la compra.');
            }
          },
          onCancel,
          onError: () => onError('PayPal no pudo procesar la simulacion. Revisa tu cuenta Sandbox e intenta de nuevo.'),
        }).render(containerRef.current);
      })
      .catch((err) => {
        setLoading(false);
        onError(err.message || 'No fue posible cargar PayPal.');
      });

    return () => {
      active = false;
    };
  }, [amount, deckTitle, onApprovePayment, onCancel, onError, publicationId]);

  return (
    <div>
      {loading && <Loading text="Cargando PayPal Sandbox..." />}
      <div ref={containerRef} />
    </div>
  );
};

export default PaypalCheckout;
