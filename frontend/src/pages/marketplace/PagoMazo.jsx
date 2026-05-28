import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CreditCard } from 'lucide-react';
import api from '../../api/axios';
import PaypalCheckout, { PAYPAL_MODE } from '../../components/checkout/PaypalCheckout';
import { ErrorBox, Loading, useResource } from '../admin/AdminShared';
import { AcquisitionSuccessModal, money } from './MarketplaceShared';

/**
 * Componente que simula la pasarela de pago para mazos de costo superior a $0.
 * Registra la transaccion y anade el mazo al dashboard tras un exito simulado.
 */
export const PaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, error, data } = useResource(async () => (await api.get(`/user/marketplace/${id}`)).data, [id]);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(null);
  const redirected = useRef(false);

  useEffect(() => {
    if (!data || redirected.current) return;
    if (data.yaAdquirido) {
      redirected.current = true;
      navigate('/user/dashboard');
      return;
    }
    if (!Number(data.publicacion.pago)) {
      redirected.current = true;
      api.post(`/user/marketplace/${id}/adquirir`)
        .then(() => setSuccess({
          mode: 'gratis',
          deckTitle: data.mazo?.titulo || 'Mazo',
          creatorName: data.creador?.NombreCompleto || data.creador?.UserName || 'Desconocido',
          cardCount: data.tarjetas?.length || 0,
        }))
        .catch((err) => setSubmitError(err.response?.data?.message || 'No fue posible adquirir el mazo.'));
    }
  }, [data, id, navigate]);

  const confirmPaypalPayment = async ({ orderId, payerId, captureId }) => {
    setSubmitError('');
    await api.post(`/user/marketplace/${id}/confirmar`, {
      paypal_order_id: orderId,
      paypal_payer_id: payerId,
      paypal_capture_id: captureId,
      provider: 'paypal',
    });
    setSuccess({
      mode: 'pago',
      deckTitle: data?.mazo?.titulo || 'Mazo',
      creatorName: data?.creador?.NombreCompleto || data?.creador?.UserName || 'Desconocido',
      cardCount: data?.tarjetas?.length || 0,
      message: '¡Pago procesado con éxito! El mazo se ha añadido a tu colección.',
    });
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;

  const { publicacion, creador, mazo, tarjetas } = data;
  const creatorName = creador?.NombreCompleto || creador?.UserName || mazo.NombreCompleto || 'Desconocido';
  return (
    <div className="flex min-h-screen items-start justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 px-4 py-12">
      {success && (
        <AcquisitionSuccessModal
          {...success}
          onDashboard={() => navigate('/user/dashboard')}
          onMarketplace={() => navigate('/user/marketplace')}
        />
      )}
      <div className="w-full max-w-2xl">
        <ErrorBox message={submitError} />
        <div className="mb-6 mt-4 flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 text-white">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="flex-1"><h2 className="text-lg font-bold text-gray-900">{mazo.titulo}</h2><p className="text-sm text-gray-500">por {creatorName} · {tarjetas.length} tarjetas</p></div>
          <div className="text-right"><div className="text-2xl font-bold text-indigo-600">{money(publicacion.precio)}</div><div className="text-xs text-gray-400">Pago unico</div></div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Datos de pago</h1>
                <p className="text-sm text-indigo-200">Entorno de demostracion, no se cobraran cargos reales</p>
              </div>
            </div>
          </div>
          <div className="space-y-5 p-6">
            <div className="border-t border-gray-100 pt-4"><div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>{money(publicacion.precio)}</span></div><div className="flex justify-between text-base font-bold text-gray-900"><span>Total</span><span className="text-indigo-600">{money(publicacion.precio)} USD</span></div></div>
            {!success && (
              <>
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700">
                  Modo {PAYPAL_MODE}. Inicia sesion con una cuenta personal Sandbox de PayPal para simular el pago.
                </div>
                <PaypalCheckout
                  amount={publicacion.precio}
                  publicationId={publicacion.id_Publ}
                  deckTitle={mazo.titulo}
                  onApprovePayment={confirmPaypalPayment}
                  onCancel={() => setSubmitError('El pago fue cancelado. Puedes intentarlo de nuevo cuando quieras.')}
                  onError={(message) => setSubmitError(message)}
                />
                <p className="text-center text-xs text-gray-400">Pago seguro con PayPal Sandbox. Al aprobarse, el mazo se agregara a tu coleccion.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
