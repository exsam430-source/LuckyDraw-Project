import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDrawDetails } from '../../services/userService';
import {
  getPublicPrizes,
  getLiveDrawState,
  getActivePaymentAccounts
} from '../../services/drawService';
import { createPayment } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import TokenRoller from '../../components/common/TokenRoller';
import Modal from '../../components/common/Modal';
import {
  FiAward,
  FiCreditCard,
  FiUpload,
  FiCheck,
  FiDownload,
  FiRadio
} from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/helpers';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const DrawDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [draw, setDraw] = useState(null);
  const [userTokens, setUserTokens] = useState([]);
  const [userPayments, setUserPayments] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);

  // Live draw state
  const [liveState, setLiveState] = useState(null);
  const [lastHistoryLen, setLastHistoryLen] = useState(0);
  const [latestDraw, setLatestDraw] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [wonPrize, setWonPrize] = useState(null);
  const pollRef = useRef(null);

  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    numberOfTokens: 1,
    paymentMethod: 'easypaisa',
    transactionId: '',
    useReferralPoints: false
  });
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Buy info
  const [canBuyMore, setCanBuyMore] = useState(false);
  const [maxCanBuy, setMaxCanBuy] = useState(0);

  // ─── Fetch All ───
  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [drawRes, prizeRes, accountRes] = await Promise.all([
        getDrawDetails(id),
        getPublicPrizes(id),
        getActivePaymentAccounts().catch(() => ({ data: [] }))
      ]);
      setDraw(drawRes.data.draw);
      setUserTokens(drawRes.data.userTokens || []);
      setUserPayments(drawRes.data.userPayments || []);
      setCanBuyMore(drawRes.data.canBuyMore);
      setMaxCanBuy(drawRes.data.maxCanBuy);
      setPrizes(prizeRes.data);
      setPaymentAccounts(accountRes.data || []);
    } catch (err) {
      toast.error('Failed to load draw details');
    } finally {
      setLoading(false);
    }
  };

  // ─── Polling for live draw ───
  useEffect(() => {
    if (!draw) return;
    const shouldPoll = draw.isLive || draw.status === 'active';
    if (!shouldPoll) return;

    const poll = async () => {
      try {
        const res = await getLiveDrawState(id);
        setLiveState(res.data);

        const history = res.data.drawnHistory || [];
        if (history.length > lastHistoryLen && lastHistoryLen > 0) {
          const newest = history[history.length - 1];
          setLatestDraw(newest);
          setIsAnimating(true);

          // Check if user's token won
          const userTokenNums = userTokens.map(t => t.tokenNumber);
          if (
            userTokenNums.includes(newest.tokenNumber) &&
            newest.hasPrize
          ) {
            setTimeout(() => {
              setWonPrize(newest);
              setShowCongrats(true);
            }, 4000);
          }
        }
        setLastHistoryLen(history.length);
      } catch {
        /* silent */
      }
    };

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [draw?.isLive, draw?.status, id, lastHistoryLen, userTokens]);

  // ─── Payment Submit ───
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('drawId', id);
      formData.append('numberOfTokens', paymentData.numberOfTokens);
      formData.append('paymentMethod', paymentData.paymentMethod);
      formData.append('transactionId', paymentData.transactionId);
      formData.append('useReferralPoints', paymentData.useReferralPoints);
      formData.append('screenshot', screenshot);

      await createPayment(formData);
      toast.success('Payment submitted! Waiting for admin approval.');
      setShowPaymentForm(false);
      setScreenshot(null);
      setPaymentData({
        numberOfTokens: 1,
        paymentMethod: 'easypaisa',
        transactionId: '',
        useReferralPoints: false
      });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Download PDF of results ───
  const downloadResultsPDF = () => {
    const doc = new jsPDF();
    const drawName = draw?.drawName || 'Draw';
    const now = new Date().toLocaleString();

    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Draw Results', 14, 20);

    doc.setFontSize(15);
    doc.text(drawName, 14, 30);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${now}`, 14, 37);
    doc.text(
      `Tokens Sold: ${draw?.tokensSold || 0} / ${draw?.totalTokens || 0}`,
      14,
      43
    );

    const history = drawnHistory;
    const winners = history.filter(d => d.hasPrize);
    const userTokenNums = userTokens.map(t => t.tokenNumber);

    // My tokens section
    if (userTokens.length > 0) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('My Tokens', 14, 53);

      const myResults = userTokens.map((t, i) => {
        const drawn = history.find(d => d.tokenNumber === t.tokenNumber);
        return [
          i + 1,
          `#${t.tokenNumber}`,
          t.status === 'won'
            ? 'WON!'
            : t.status === 'lost'
            ? 'Lost'
            : 'Active',
          drawn?.hasPrize ? drawn.prizeTitle : '—'
        ];
      });

      doc.autoTable({
        startY: 57,
        head: [['#', 'Token', 'Status', 'Prize']],
        body: myResults,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9, cellPadding: 3 }
      });
    }

    // Winners table
    if (winners.length > 0) {
      const startY = userTokens.length > 0
        ? (doc.lastAutoTable?.finalY || 60) + 12
        : 53;

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Prize Winners', 14, startY);

      doc.autoTable({
        startY: startY + 4,
        head: [['#', 'Token', 'Winner', 'Prize', 'Value']],
        body: winners.map((w, i) => [
          i + 1,
          `#${w.tokenNumber}`,
          w.isSold ? w.buyerName || 'Winner' : 'Not Purchased',
          w.prizeTitle || '',
          `Rs ${(w.prizeValue || 0).toLocaleString()}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [234, 179, 8] },
        styles: { fontSize: 9, cellPadding: 3 },
        didParseCell: (data) => {
          // Highlight user's winning tokens
          if (data.section === 'body' && data.column.index === 1) {
            const tokenNum = parseInt(data.cell.raw?.replace('#', ''));
            if (userTokenNums.includes(tokenNum)) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.textColor = [79, 70, 229];
            }
          }
        }
      });
    }

    // All drawn tokens
    if (history.length > 0) {
      const startY2 = doc.lastAutoTable?.finalY
        ? doc.lastAutoTable.finalY + 12
        : 53;

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`All Drawn Tokens (${history.length})`, 14, startY2);

      doc.autoTable({
        startY: startY2 + 4,
        head: [['#', 'Token', 'Buyer', 'Type', 'Prize']],
        body: history.map((d, i) => [
          i + 1,
          `#${d.tokenNumber}`,
          d.isSold ? d.buyerName || 'Unknown' : 'Not Sold',
          d.hasPrize ? 'Prize' : 'Regular',
          d.hasPrize ? d.prizeTitle || '' : '—'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [107, 114, 128] },
        styles: { fontSize: 8, cellPadding: 2 },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            const tokenNum = parseInt(data.cell.raw?.replace('#', ''));
            if (userTokenNums.includes(tokenNum)) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.textColor = [79, 70, 229];
            }
          }
        }
      });
    }

    doc.save(`${drawName.replace(/\s+/g, '_')}-Results.pdf`);
    toast.success('PDF downloaded!');
  };

  // ─── Loading / Not Found ───
  if (loading) return <Loader fullScreen />;
  if (!draw)
    return (
      <p className="text-center py-12 text-gray-500">Draw not found</p>
    );

  // ─── Computed values ───
  const isLive = liveState?.isLive || draw.isLive;
  const drawnHistory = liveState?.drawnHistory || draw.drawnHistory || [];
  const userTokenNums = userTokens.map(t => t.tokenNumber);
  const primaryAccount =
    paymentAccounts.find(a => a.isPrimary) || paymentAccounts[0];
  const winners = drawnHistory.filter(d => d.hasPrize);
  const isCompleted = draw.status === 'completed';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ════════════ HEADER ════════════ */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white relative overflow-hidden">
        {/* Live pulse background */}
        {isLive && (
          <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  draw.status === 'active'
                    ? 'bg-green-500'
                    : draw.status === 'completed'
                    ? 'bg-blue-500'
                    : 'bg-yellow-500'
                } text-white`}
              >
                {draw.status?.toUpperCase()}
              </span>

              {isLive && (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-red-600 rounded-full text-xs font-bold animate-pulse">
                  <FiRadio size={12} />
                  <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                  <span>LIVE DRAW</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold">{draw.drawName}</h1>
            <p className="text-indigo-100 mt-1">{draw.description}</p>
          </div>

          <div className="text-right space-y-1">
            <p className="text-3xl font-bold">
              {formatCurrency(draw.tokenPrice)}
            </p>
            <p className="text-indigo-200 text-sm">per token</p>
            <p className="text-indigo-200 text-sm">
              {draw.remainingTokens || 0}/{draw.totalTokens} available
            </p>
          </div>
        </div>
      </div>

      {/* ════════════ LIVE BANNER ════════════ */}
      {isLive && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500" />
            </span>
            <div>
              <p className="font-bold text-red-800 text-lg">
                🔴 Draw is LIVE!
              </p>
              <p className="text-red-600 text-sm">
                Watch the tokens being drawn in real-time below
              </p>
            </div>
          </div>
          <p className="text-red-700 font-medium text-sm hidden md:block">
            {drawnHistory.length} tokens drawn
          </p>
        </div>
      )}

      {/* ════════════ MY TOKENS ════════════ */}
      {userTokens.length > 0 && (
        <div
          className={`rounded-xl p-4 border-2 ${
            isLive
              ? 'bg-indigo-50 border-indigo-300'
              : 'bg-indigo-50 border-indigo-200'
          }`}
        >
          <h3 className="font-bold text-gray-900 mb-2">
            Your Tokens ({userTokens.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {userTokens.map(t => {
              const wasDrawn = drawnHistory.some(
                d => d.tokenNumber === t.tokenNumber
              );
              const wonEntry = drawnHistory.find(
                d =>
                  d.tokenNumber === t.tokenNumber && d.hasPrize
              );
              return (
                <span
                  key={t._id}
                  className={`px-3 py-1.5 rounded-lg font-bold text-sm transition-all ${
                    t.status === 'won' || wonEntry
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg ring-2 ring-yellow-300 animate-pulse'
                      : t.status === 'lost'
                      ? 'bg-gray-300 text-gray-600 line-through'
                      : wasDrawn
                      ? 'bg-gray-400 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  #{t.tokenNumber}
                  {wonEntry && ' 🏆'}
                </span>
              );
            })}
          </div>
          {userTokens.some(t => t.status === 'won') && (
            <p className="text-green-700 font-bold mt-2 text-sm">
              🎉 You have winning tokens! Contact support to claim.
            </p>
          )}
        </div>
      )}

      {/* ════════════ PRIZES ════════════ */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <FiAward className="text-yellow-500" />
          <span>Prizes ({prizes.length})</span>
        </h2>
        {prizes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {prizes.map(prize => {
              // Check if this prize was won (from drawn history)
              const wonEntry = drawnHistory.find(
                d => d.hasPrize && d.prizeTitle === prize.title
              );
              return (
                <div
                  key={prize._id}
                  className={`border-2 rounded-xl p-5 relative ${
                    prize.prizeType === 'grand'
                      ? 'border-yellow-400 bg-yellow-50'
                      : prize.prizeType === 'secondary'
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {wonEntry && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <FiCheck className="text-white" size={18} />
                    </div>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      prize.prizeType === 'grand'
                        ? 'bg-yellow-300 text-yellow-900'
                        : prize.prizeType === 'secondary'
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {prize.prizeType === 'grand'
                      ? '🏆 Grand Prize'
                      : prize.prizeType}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2">
                    {prize.title}
                  </h3>
                  {prize.description && (
                    <p className="text-gray-600 text-sm mt-1">
                      {prize.description}
                    </p>
                  )}
                  <p className="text-indigo-600 font-bold text-lg mt-2">
                    {formatCurrency(prize.value)}
                  </p>
                  {wonEntry && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-green-700 text-sm font-medium">
                        ✓ Won by:{' '}
                        {wonEntry.isSold
                          ? wonEntry.buyerName
                          : 'Not Purchased'}
                      </p>
                      <p className="text-gray-500 text-xs">
                        Token #{wonEntry.tokenNumber}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">No prizes listed yet</p>
        )}
      </div>

      {/* ════════════ LIVE DRAW VIEWER ════════════ */}
      {(isLive || isCompleted) && drawnHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              {isLive && (
                <span className="relative flex h-3 w-3 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
              )}
              <span>
                {isLive ? 'Live Draw' : 'Draw Results'}
              </span>
              <span className="text-sm font-normal text-gray-400 ml-2">
                ({drawnHistory.length} drawn)
              </span>
            </h2>

            {/* Download PDF button */}
            {(isCompleted || drawnHistory.length > 0) && (
              <button
                onClick={downloadResultsPDF}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow"
              >
                <FiDownload size={16} />
                <span>Download PDF</span>
              </button>
            )}
          </div>

          {/* Roller animation for latest draw */}
          {isAnimating && latestDraw && (
            <div className="mb-6">
              <TokenRoller
                isRolling={true}
                targetNumber={latestDraw.tokenNumber}
                animationPool={[]}
                onComplete={() => setIsAnimating(false)}
                prize={
                  latestDraw.hasPrize
                    ? {
                        title: latestDraw.prizeTitle,
                        value: latestDraw.prizeValue
                      }
                    : null
                }
                size="md"
              />
            </div>
          )}

          {/* Winners section (if any) */}
          {winners.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FiAward className="text-yellow-500" />
                Prize Winners ({winners.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {winners.map((entry, idx) => {
                  const isUserToken = userTokenNums.includes(
                    entry.tokenNumber
                  );
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border-2 ${
                        isUserToken
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 ring-2 ring-green-300'
                          : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-gray-900">
                          #{entry.tokenNumber}
                        </span>
                        {isUserToken && (
                          <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                            YOUR TOKEN!
                          </span>
                        )}
                      </div>
                      <p className="text-yellow-800 font-bold mt-1">
                        🏆 {entry.prizeTitle}
                      </p>
                      <p className="text-yellow-600 text-sm font-medium">
                        {formatCurrency(entry.prizeValue)}
                      </p>
                      {entry.isSold && entry.buyerName && (
                        <p className="text-gray-600 text-sm mt-1">
                          Winner: {entry.buyerName}
                        </p>
                      )}
                      {!entry.isSold && (
                        <p className="text-red-500 text-sm mt-1">
                          Token not purchased
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All drawn tokens grid */}
          <div>
            <h3 className="text-md font-bold text-gray-700 mb-3">
              All Drawn Tokens
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {[...drawnHistory].reverse().map((entry, idx) => {
                const isUserToken = userTokenNums.includes(
                  entry.tokenNumber
                );
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg text-center font-bold relative transition-all ${
                      entry.hasPrize
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                        : isUserToken
                        ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-400'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isUserToken && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs">
                        ★
                      </div>
                    )}
                    <div className="text-lg">#{entry.tokenNumber}</div>
                    {entry.hasPrize && (
                      <p className="text-xs mt-0.5 opacity-90 truncate">
                        {entry.prizeTitle}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════ BUY TOKENS ════════════ */}
      {draw.status === 'active' && canBuyMore && !isLive && user && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Buy Tokens</h2>
            <span className="text-sm text-gray-500">
              Max {maxCanBuy} more
            </span>
          </div>

          {primaryAccount && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-medium text-green-800 mb-2">
                Send payment to:
              </p>
              <p className="text-lg font-bold text-gray-900">
                {primaryAccount.accountName}
              </p>
              <p className="text-gray-700">
                {primaryAccount.accountNumber}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-green-200 text-green-800 text-xs font-bold rounded uppercase">
                {primaryAccount.accountType}
              </span>
              {primaryAccount.qrCode && (
                <img
                  src={primaryAccount.qrCode}
                  alt="QR Code"
                  className="mt-3 w-40 h-40 object-contain rounded-lg border"
                />
              )}
            </div>
          )}

          {!showPaymentForm ? (
            <button
              onClick={() => setShowPaymentForm(true)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              <FiCreditCard className="inline mr-2" /> Purchase Tokens
            </button>
          ) : (
            <form
              onSubmit={handlePaymentSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Tokens
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={maxCanBuy}
                    value={paymentData.numberOfTokens}
                    onChange={e =>
                      setPaymentData({
                        ...paymentData,
                        numberOfTokens:
                          parseInt(e.target.value) || 1
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={e =>
                      setPaymentData({
                        ...paymentData,
                        paymentMethod: e.target.value
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  >
                    <option value="easypaisa">EasyPaisa</option>
                    <option value="jazzcash">JazzCash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction ID (optional)
                </label>
                <input
                  type="text"
                  value={paymentData.transactionId}
                  onChange={e =>
                    setPaymentData({
                      ...paymentData,
                      transactionId: e.target.value
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  placeholder="TRX123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Screenshot *
                </label>
                <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors">
                  <FiUpload className="mr-2 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {screenshot
                      ? screenshot.name
                      : 'Click to upload screenshot'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e =>
                      setScreenshot(e.target.files[0])
                    }
                  />
                </label>
                {screenshot && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ File selected: {screenshot.name}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {paymentData.numberOfTokens} token(s) ×{' '}
                    {formatCurrency(draw.tokenPrice)}
                  </span>
                  <span className="font-bold text-indigo-600">
                    {formatCurrency(
                      paymentData.numberOfTokens *
                        draw.tokenPrice
                    )}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setScreenshot(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  {submitting
                    ? 'Submitting...'
                    : 'Submit Payment'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Not logged in prompt */}
      {draw.status === 'active' && !user && !isLive && (
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <p className="text-gray-600 mb-3">
            Login to purchase tokens for this draw
          </p>
          <Link
            to="/login"
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700"
          >
            Login to Buy
          </Link>
        </div>
      )}

      {/* ════════════ DRAW INFO ════════════ */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Draw Information
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 block">Token Price</span>
            <span className="font-bold text-gray-900">
              {formatCurrency(draw.tokenPrice)}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Total Tokens</span>
            <span className="font-bold text-gray-900">
              {draw.totalTokens}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Max Per User</span>
            <span className="font-bold text-gray-900">
              {draw.maxTokensPerUser}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">End Date</span>
            <span className="font-bold text-gray-900">
              {formatDate(draw.endDate)}
            </span>
          </div>
        </div>
        {draw.drawExecutedAt && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-gray-500 text-sm">
              Draw Executed:{' '}
              {new Date(draw.drawExecutedAt).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* ════════════ CONGRATS MODAL ════════════ */}
      {showCongrats && wonPrize && (
        <Modal
          isOpen={showCongrats}
          onClose={() => setShowCongrats(false)}
          title=""
          size="md"
        >
          <div className="text-center py-8">
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Congratulations!
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              Your token{' '}
              <strong>#{wonPrize.tokenNumber}</strong> won!
            </p>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl p-6 inline-block">
              <p className="text-2xl font-bold">
                {wonPrize.prizeTitle}
              </p>
              <p className="text-yellow-100">
                Worth Rs{' '}
                {wonPrize.prizeValue?.toLocaleString()}
              </p>
            </div>
            <p className="text-gray-500 mt-6 text-sm">
              Contact support to claim your prize!
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DrawDetails;