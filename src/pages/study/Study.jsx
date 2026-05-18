import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Flame, Trophy } from 'lucide-react';
import api from '../../api/axios';

const Loading = ({ text = 'Cargando...' }) => (
  <div className="py-16 text-center text-sm font-semibold text-slate-500 animate-pulse">{text}</div>
);

const ErrorBox = ({ message }) => message ? (
  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{message}</div>
) : null;

const useResource = (loader, deps = []) => {
  const [state, setState] = useState({ loading: true, error: '', data: null });
  useEffect(() => {
    let active = true;
    loader()
      .then((data) => active && setState({ loading: false, error: '', data }))
      .catch((error) => active && setState({ loading: false, error: error.response?.data?.message || error.message, data: null }));
    return () => { active = false; };
  }, deps);
  return state;
};

const normalizeCard = (card = {}) => {
  let opciones = card.opciones || [];
  if (typeof opciones === 'string') {
    try { opciones = JSON.parse(opciones); } catch { opciones = []; }
  }
  return { ...card, tipo: card.tipo || 'basica', opciones };
};

const similarity = (left = '', right = '') => {
  const a = left.trim().toLowerCase();
  const b = right.trim().toLowerCase();
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  const longer = Math.max(a.length, b.length);
  return longer ? Math.round(((longer - matrix[b.length][a.length]) / longer) * 100) : 100;
};

export const StudyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, error, data } = useResource(async () => (await api.get(`/estudiar/${id}`)).data, [id]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pass, setPass] = useState(0);
  const [fail, setFail] = useState(0);
  const [finished, setFinished] = useState(null);
  const [startTime] = useState(() => new Date());
  const [feedback, setFeedback] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [motion, setMotion] = useState('');

  const cards = data?.tarjetas || [];
  const current = normalizeCard(cards[index]);
  const progress = cards.length ? ((index + (finished ? 1 : 0)) / cards.length) * 100 : 0;

  const finish = async (nextPass, nextFail) => {
    const end = new Date();
    const { data: payload } = await api.post(`/estudiar/${id}/finalizar`, {
      aciertos: nextPass,
      fallos: nextFail,
      fechaini: startTime.toISOString().slice(0, 19).replace('T', ' '),
      fechafin: end.toISOString().slice(0, 19).replace('T', ' '),
    });
    setFinished({ ...payload, pass: nextPass, fail: nextFail });
  };

  const next = (known) => {
    const nextPass = pass + (known ? 1 : 0);
    const nextFail = fail + (known ? 0 : 1);
    setPass(nextPass);
    setFail(nextFail);
    setMotion(known ? 'study-fly-right' : 'study-shake');
    window.setTimeout(() => {
      setMotion('');
      setFeedback(null);
      setAnswerText('');
      setSelectedOption('');
      setFlipped(false);
      if (index + 1 >= cards.length) finish(nextPass, nextFail);
      else setIndex((value) => value + 1);
    }, known ? 520 : 420);
  };

  const checkOption = (option) => {
    const ok = option === current.reverso;
    setSelectedOption(option);
    setFeedback(ok ? 'pass' : 'fail');
  };

  const checkText = () => {
    const ok = similarity(answerText, current.reverso) >= 80;
    setFeedback(ok ? 'pass' : 'fail');
  };

  if (loading) return <Loading text="Preparando estudio..." />;
  if (error) return <ErrorBox message={error} />;
  if (!cards.length) return <div className="py-20 text-center"><h1 className="text-2xl font-bold">Este mazo no contiene tarjetas.</h1><Link className="mt-4 inline-block text-indigo-600" to="/dashboard">Volver al dashboard</Link></div>;

  if (finished) {
    const total = finished.pass + finished.fail;
    const accuracy = total ? Math.round((finished.pass / total) * 100) : 0;
    return (
      <div className="study-page flex min-h-[calc(100vh-150px)] items-center justify-center p-4">
        <div className="study-summary-card w-full max-w-md rounded-[2.5rem] border border-indigo-50 bg-white p-10 text-center shadow-2xl">
          <Trophy className="mx-auto mb-6 h-16 w-16 text-amber-400" />
          <h1 className="mb-2 text-3xl font-black text-gray-900">Sesion Terminada</h1>
          <p className="mb-8 text-gray-400">Has completado el estudio de este mazo</p>
          <div className="mb-8 grid grid-cols-2 gap-4">
            <ScoreBox label="Aciertos" value={finished.pass} tone="indigo" />
            <ScoreBox label="Fallos" value={finished.fail} tone="slate" />
          </div>
          <div className="mb-10 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-[2px]">
            <div className="flex items-center justify-between rounded-[14px] bg-white p-4">
              <span className="text-sm font-bold text-gray-500">Precision</span>
              <span className="text-xl font-black text-indigo-600">{accuracy}%</span>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} className="study-dark-btn w-full rounded-2xl py-4 font-bold text-white">
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  const isBasic = current.tipo === 'basica';
  const isMultiple = current.tipo === 'opcion_multiple';
  const isTyping = current.tipo === 'teclear';

  return (
    <div className="study-page flex min-h-[calc(100vh-150px)] flex-col items-center overflow-hidden px-4 py-10">
      <div className="mb-12 w-full max-w-2xl">
        <div className="mb-3 flex items-center justify-between px-2">
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-600">Mazo: {data.mazo.titulo}</span>
          <span className="text-sm font-black text-gray-400"><span className="text-lg text-indigo-600">{index + 1}</span> / {cards.length}</span>
        </div>
        <div className="progress-glass h-5 rounded-full p-1 shadow-inner">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="study-card-shell w-full max-w-2xl perspective-1000">
        <button
          type="button"
          onClick={() => isBasic && setFlipped((value) => !value)}
          className={`study-card relative min-h-[350px] w-full preserve-3d transition-all duration-700 ${flipped ? 'rotate-y-180' : ''} ${motion}`}
        >
          <div className="card-face backface-hidden bg-white">
            <span className="absolute left-6 top-6 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-500">{isMultiple ? 'Opcion multiple' : isTyping ? 'Escribe la respuesta' : 'Pregunta'}</span>
            <p className="mt-6 text-center text-2xl font-bold leading-tight text-gray-800 md:text-3xl">{current.frente}</p>
            {isBasic && <p className="mt-auto text-xs font-bold text-gray-300">Haz clic para voltear</p>}
            {isMultiple && (
              <div className="mt-auto grid w-full gap-3 md:grid-cols-2">
                {current.opciones.map((option) => (
                  <button key={option} type="button" onClick={(event) => { event.stopPropagation(); checkOption(option); }} className={`study-option ${selectedOption === option ? 'selected' : ''}`}>{option}</button>
                ))}
              </div>
            )}
            {isTyping && (
              <div className="mt-auto flex w-full gap-2">
                <input value={answerText} onClick={(event) => event.stopPropagation()} onChange={(event) => setAnswerText(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && checkText()} className="study-input flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none" placeholder="Escribe tu respuesta exacta..." />
                <button type="button" onClick={(event) => { event.stopPropagation(); checkText(); }} className="marketplace-liquid-btn rounded-xl px-5 py-3 text-sm font-black text-white">Comprobar</button>
              </div>
            )}
            {feedback && !isBasic && <Feedback result={feedback} answer={current.reverso} onContinue={() => next(feedback === 'pass')} />}
          </div>
          <div className="card-face rotate-y-180 backface-hidden bg-gradient-to-br from-indigo-600 to-purple-700">
            <span className="absolute left-6 top-6 rounded-full border border-white/20 bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">Respuesta</span>
            <p className="mt-6 text-center text-2xl font-bold leading-tight text-white md:text-3xl">{current.reverso}</p>
          </div>
        </button>
      </div>

      {isBasic && flipped && (
        <div className="mt-12 w-full max-w-md">
          <p className="mb-6 text-center text-sm font-medium italic text-gray-400">Que tal te ha ido con esta tarjeta?</p>
          <div className="flex gap-4">
            <button onClick={() => next(false)} className="study-fail-btn flex-1 rounded-2xl border-2 border-red-100 bg-white py-5 text-sm font-black uppercase tracking-widest text-red-500">No lo sabia</button>
            <button onClick={() => next(true)} className="study-pass-btn flex-1 rounded-2xl py-5 text-sm font-black uppercase tracking-widest text-white"><Flame className="mx-auto mb-1 h-5 w-5" />Lo sabia</button>
          </div>
        </div>
      )}

      <div className="mt-auto flex w-full max-w-2xl justify-around border-t border-gray-100 py-8">
        <Counter label="Aciertos" value={pass} color="text-green-500" />
        <Counter label="Fallos" value={fail} color="text-red-400" />
      </div>
    </div>
  );
};

const Feedback = ({ result, answer, onContinue }) => (
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-white/95 p-6 text-center shadow-inner backdrop-blur-md">
    <h3 className={`mb-2 text-3xl font-black ${result === 'pass' ? 'text-green-500' : 'text-red-500'}`}>{result === 'pass' ? 'Correcto' : 'Incorrecto'}</h3>
    <p className="mb-6 text-gray-500">La respuesta era:<br /><strong className="text-lg text-gray-800">{answer}</strong></p>
    <button onClick={onContinue} className="study-dark-btn w-full max-w-[200px] rounded-2xl px-10 py-3 font-bold text-white">Continuar</button>
  </div>
);

const ScoreBox = ({ label, value, tone }) => (
  <div className={`rounded-3xl border p-5 ${tone === 'indigo' ? 'border-indigo-100 bg-indigo-50/50' : 'border-slate-100 bg-slate-50'}`}>
    <div className={`text-3xl font-black ${tone === 'indigo' ? 'text-indigo-600' : 'text-slate-400'}`}>{value}</div>
    <div className={`text-[10px] font-bold uppercase ${tone === 'indigo' ? 'text-indigo-400' : 'text-slate-400'}`}>{label}</div>
  </div>
);

const Counter = ({ label, value, color }) => (
  <div className="flex flex-col items-center">
    <span className="mb-1 text-xs font-bold uppercase tracking-tighter text-gray-400">{label}</span>
    <span className={`text-2xl font-black ${color}`}>{value}</span>
  </div>
);

export default StudyPage;
