// src/pages/admin/ExecuteDraw.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  getAllDrawsAdmin, getPrizesByDraw, executeDraw,
  rollDraw, confirmDrawnToken, toggleLiveDraw
} from '../../services/adminService';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import TokenRoller from '../../components/common/TokenRoller';
import Modal from '../../components/common/Modal';
import {
  FiAward, FiCheck, FiRadio, FiStopCircle,
  FiDownload, FiHash, FiXCircle
} from 'react-icons/fi';
import { formatCurrency } from '../../utils/helpers';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ExecuteDraw = () => {
  /* ─── state ─── */
  const [loading, setLoading] = useState(true);
  const [draws, setDraws] = useState([]);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [selectedPrize, setSelectedPrize] = useState(null);

  const [isRolling, setIsRolling] = useState(false);
  const [rollData, setRollData] = useState(null);
  const [saving, setSaving] = useState(false);

  const [drawnHistory, setDrawnHistory] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [rightTab, setRightTab] = useState('drawn');

  /* ─── derived ─── */
  const winners = drawnHistory.filter(d => d.hasPrize);
  const regularDrawn = drawnHistory.filter(d => !d.hasPrize);

  /* ─── data fetching ─── */
  useEffect(() => { fetchDraws(); }, []);

  useEffect(() => {
    if (selectedDraw) {
      fetchPrizes();
      setDrawnHistory(selectedDraw.drawnHistory || []);
      setIsLive(selectedDraw.isLive || false);
    }
  }, [selectedDraw]);

  const fetchDraws = async () => {
    try {
      const res = await getAllDrawsAdmin({ status: 'active', limit: 50 });
      setDraws(res.data);
    } catch { toast.error('Failed to load draws'); }
    finally { setLoading(false); }
  };

  const fetchPrizes = async () => {
    try {
      const res = await getPrizesByDraw(selectedDraw._id);
      setPrizes(res.data);
    } catch { toast.error('Failed to load prizes'); }
  };

  /* ─── live toggle ─── */
  const handleToggleLive = async () => {
    try {
      const res = await toggleLiveDraw(selectedDraw._id, !isLive);
      setIsLive(res.data.isLive);
      toast.success(res.data.isLive ? '🔴 Draw is LIVE!' : 'Draw is offline');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  /* ─── roll (prize OR random) ─── */
  const handleRoll = async () => {
    try {
      const res = await rollDraw(selectedDraw._id, selectedPrize?._id || null);
      setRollData(res.data);
      setIsRolling(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Roll failed');
    }
  };

  /* ─── auto-confirm after animation completes ─── */
  const handleRollComplete = useCallback(async (tokenNumber) => {
    setIsRolling(false);

    if (!rollData) return;

    const result = {
      tokenNumber,
      isSold: rollData.isSold,
      buyerName: rollData.buyerName,
      prize: rollData.prize,
      isPrizeRoll: rollData.isPrizeRoll
    };

    // Auto-confirm immediately
    setSaving(true);
    try {
      const res = await confirmDrawnToken(selectedDraw._id, {
        tokenNumber: result.tokenNumber,
        prizeId: result.prize?.id || null,
        isPrizeRoll: result.isPrizeRoll,
        isSold: result.isSold,
        buyerName: result.buyerName || ''
      });

      setDrawnHistory(res.data.drawnHistory);

      // Show appropriate toast
      if (result.isPrizeRoll) {
        if (result.isSold) {
          toast.success(`🏆 Winner: ${result.buyerName} - ${result.prize?.title}!`, {
            autoClose: 5000
          });
        } else {
          toast.warning(`Token #${tokenNumber} not purchased - Prize not awarded`, {
            autoClose: 4000
          });
        }
        setSelectedPrize(null);
        fetchPrizes();
      } else {
        toast.success(`✓ Token #${tokenNumber} recorded`, { autoClose: 2000 });
      }

      setRollData(null);

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [rollData, selectedDraw]);

  /* ─── finalize ─── */
  const handleFinalize = async () => {
    setExecuting(true);
    try {
      await executeDraw(selectedDraw._id);
      toast.success('🎉 Draw finalized!');
      setShowFinalizeModal(false);
      setShowResults(true);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setExecuting(false); }
  };

  /* ─── PDF download ─── */
  const downloadPDF = () => {
    const doc = new jsPDF();
    const drawName = selectedDraw?.drawName || 'Draw';
    const now = new Date().toLocaleString();

    // header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`Draw Results`, 14, 20);
    doc.setFontSize(14);
    doc.text(drawName, 14, 28);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${now}`, 14, 34);
    doc.text(
      `Tokens Sold: ${selectedDraw?.tokensSold || 0} / ${selectedDraw?.totalTokens || 0}  |  Drawn: ${drawnHistory.length}  |  Winners: ${winners.filter(w => w.isSold).length}`,
      14, 40
    );

    // ──── Winners Table ────
    if (winners.length > 0) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Prize Winners', 14, 52);

      doc.autoTable({
        startY: 56,
        head: [['#', 'Token', 'Winner', 'Prize', 'Value (Rs)', 'Status']],
        body: winners.map((w, i) => [
          i + 1,
          `#${w.tokenNumber}`,
          w.isSold ? (w.buyerName || 'Unknown') : '—',
          w.prizeTitle || '',
          (w.prizeValue || 0).toLocaleString(),
          w.isSold ? 'Awarded' : 'Not Purchased'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [234, 179, 8] },   // yellow-500
        styles: { fontSize: 9, cellPadding: 3 }
      });
    }

    // ──── All Drawn Tokens Table ────
    const startY2 = winners.length > 0
      ? (doc.lastAutoTable?.finalY || 60) + 14
      : 52;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('All Drawn Tokens', 14, startY2);

    doc.autoTable({
      startY: startY2 + 4,
      head: [['#', 'Token', 'Buyer', 'Type', 'Prize']],
      body: drawnHistory.map((d, i) => [
        i + 1,
        `#${d.tokenNumber}`,
        d.isSold ? (d.buyerName || 'Unknown') : 'Not Sold',
        d.hasPrize ? 'Prize Roll' : 'Regular',
        d.hasPrize ? (d.prizeTitle || '') : '—'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },     // indigo-600
      styles: { fontSize: 9, cellPadding: 3 }
    });

    doc.save(`${drawName.replace(/\s+/g, '_')}-Results.pdf`);
    toast.success('PDF downloaded!');
  };

  /* ─── loading ─── */
  if (loading) return <Loader fullScreen />;

  /* ════════════════════════════════════════
     RESULTS SCREEN (after finalization)
     ════════════════════════════════════════ */
  if (showResults) {
    return (
      <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
        <div className="text-center py-8">
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Draw Finalized!</h1>
          <p className="text-gray-500">{selectedDraw?.drawName}</p>
        </div>

        {/* summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-3xl font-bold text-indigo-600">{drawnHistory.length}</p>
            <p className="text-gray-500 text-sm">Tokens Drawn</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-3xl font-bold text-yellow-600">{winners.length}</p>
            <p className="text-gray-500 text-sm">Prizes Rolled</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-3xl font-bold text-green-600">{winners.filter(w => w.isSold).length}</p>
            <p className="text-gray-500 text-sm">Awarded Winners</p>
          </div>
        </div>

        {/* winners table */}
        {winners.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiAward className="text-yellow-500" /> Prize Winners
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Token</th>
                    <th className="px-4 py-3 text-left">Winner</th>
                    <th className="px-4 py-3 text-left">Prize</th>
                    <th className="px-4 py-3 text-left">Value</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {winners.map((w, i) => (
                    <tr key={i} className="hover:bg-yellow-50/40">
                      <td className="px-4 py-3">{i + 1}</td>
                      <td className="px-4 py-3 font-bold">#{w.tokenNumber}</td>
                      <td className="px-4 py-3">{w.isSold ? w.buyerName : <span className="text-red-500">Not Purchased</span>}</td>
                      <td className="px-4 py-3 font-medium">{w.prizeTitle}</td>
                      <td className="px-4 py-3 text-indigo-600 font-medium">{formatCurrency(w.prizeValue || 0)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${w.isSold ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {w.isSold ? 'Awarded' : 'No Buyer'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* all drawn tokens */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            All Drawn Tokens ({drawnHistory.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {drawnHistory.map((d, i) => (
              <span key={i} className={`px-3 py-1.5 rounded-lg font-bold text-sm ${d.hasPrize
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                  : 'bg-gray-100 text-gray-700'
                }`}>
                #{d.tokenNumber}
                {d.hasPrize && <span className="ml-1">🏆</span>}
              </span>
            ))}
          </div>
        </div>

        {/* actions */}
        <div className="flex justify-center space-x-4 pb-8">
          <button onClick={downloadPDF}
            className="flex items-center space-x-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-lg">
            <FiDownload size={20} /><span>Download PDF</span>
          </button>
          <button
            onClick={() => { setShowResults(false); setSelectedDraw(null); setDrawnHistory([]); fetchDraws(); }}
            className="px-8 py-3 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50">
            Back to Draws
          </button>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     MAIN EXECUTION SCREEN
     ════════════════════════════════════════ */
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Execute Draw</h1>
          <p className="text-gray-600">Roll tokens, award prizes, finalize draw</p>
        </div>
        {selectedDraw && (
          <div className="flex items-center space-x-3">
            {drawnHistory.length > 0 && (
              <button onClick={downloadPDF}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium text-indigo-600 border-2 border-indigo-200 hover:bg-indigo-50">
                <FiDownload size={16} /><span>PDF</span>
              </button>
            )}
            <button onClick={handleToggleLive}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg font-medium text-white transition-colors ${isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}>
              {isLive ? <><FiStopCircle /><span>Stop Live</span></> : <><FiRadio /><span>Go Live</span></>}
            </button>
          </div>
        )}
      </div>

      {/* ──── DRAW SELECTION ──── */}
      {!selectedDraw ? (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Select a Draw to Execute</h2>
          {draws.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {draws.map(draw => (
                <button key={draw._id} onClick={() => setSelectedDraw(draw)}
                  className="p-5 border-2 border-gray-200 rounded-xl text-left hover:border-indigo-500 hover:shadow-lg transition-all">
                  <p className="font-bold text-lg text-gray-900">{draw.drawName}</p>
                  <p className="text-sm text-gray-500 mt-1">{draw.tokensSold}/{draw.totalTokens} tokens sold</p>
                  <p className="text-sm text-indigo-600 font-medium mt-1">🏆 {draw.grandPrize?.title}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No active draws available</p>
          )}
        </div>
      ) : (

        /* ──── 3-COLUMN LAYOUT ──── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ════ LEFT — PRIZES ════ */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">Prizes</h2>
                <button
                  onClick={() => { setSelectedDraw(null); setDrawnHistory([]); setIsLive(false); setSelectedPrize(null); }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline">
                  Change Draw
                </button>
              </div>

              <p className="text-sm text-indigo-700 font-semibold mb-3 truncate">
                {selectedDraw.drawName}
              </p>

              {/* clear prize selection */}
              {selectedPrize && (
                <button onClick={() => setSelectedPrize(null)}
                  className="w-full mb-2 p-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg
                             hover:bg-indigo-100 font-medium flex items-center justify-center gap-1">
                  <FiXCircle size={14} /> Clear Prize (Random Mode)
                </button>
              )}

              <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
                {prizes.map(prize => (
                  <button key={prize._id}
                    disabled={prize.isAwarded || isRolling || saving}
                    onClick={() => setSelectedPrize(
                      selectedPrize?._id === prize._id ? null : prize
                    )}
                    className={`w-full p-3 rounded-lg text-left text-sm transition-all border-2 ${prize.isAwarded
                        ? 'bg-green-50 border-green-300 cursor-default'
                        : selectedPrize?._id === prize._id
                          ? 'border-indigo-600 bg-indigo-50 shadow'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}>

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${prize.prizeType === 'grand' ? 'bg-yellow-200 text-yellow-800' :
                          prize.prizeType === 'secondary' ? 'bg-blue-200 text-blue-800' :
                            'bg-gray-200 text-gray-700'
                        }`}>{prize.prizeType}</span>
                      {prize.isAwarded && <FiCheck className="text-green-600" size={16} />}
                    </div>

                    <p className="font-semibold mt-1 text-gray-900">{prize.title}</p>
                    <p className="text-indigo-600 font-medium">{formatCurrency(prize.value)}</p>

                    {/* show winner info after award */}
                    {prize.isAwarded && prize.winningToken && (
                      <p className="text-xs text-green-700 mt-1 truncate">
                        🏆 #{prize.winningToken.tokenNumber} — {prize.winner?.fullName || 'Unknown'}
                      </p>
                    )}
                    {prize.isAwarded && !prize.winningToken && (
                      <p className="text-xs text-red-500 mt-1">Token not purchased</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* finalize button */}
            <button onClick={() => setShowFinalizeModal(true)}
              disabled={executing || isRolling || saving}
              className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 rounded-xl
                         font-bold hover:shadow-xl disabled:opacity-50 transition-all">
              🏁 Finalize Draw
            </button>
          </div>

          {/* ════ CENTER — ROLLER ════ */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl shadow-lg p-6">

              {/* live badge */}
              {isLive && (
                <div className="flex items-center space-x-2 mb-4 text-red-600">
                  <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                  <span className="font-bold text-sm tracking-wide">LIVE</span>
                </div>
              )}

              {/* mode indicator */}
              <div className={`mb-5 p-4 rounded-xl text-center border ${selectedPrize
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-blue-50 border-blue-200'
                }`}>
                {selectedPrize ? (
                  <>
                    <p className="text-xs font-bold text-yellow-600 uppercase tracking-wide">
                      🎯 Prize Mode
                    </p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{selectedPrize.title}</p>
                    <p className="text-yellow-700 font-medium">{formatCurrency(selectedPrize.value)}</p>
                    <p className="text-xs text-yellow-600 mt-1">
                      ⏱️ {selectedPrize.prizeType === 'grand' ? '15 sec roll' : '10 sec roll'} • Auto-save
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-blue-700 font-bold">🎲 Random Token Mode</p>
                    <p className="text-xs text-blue-500 mt-1">⏱️ 3 sec quick roll • Auto-save</p>
                  </>
                )}
              </div>

              {/* roller */}
              <div className="py-6">
                <TokenRoller
                  isRolling={isRolling}
                  targetNumber={rollData?.targetToken}
                  animationPool={rollData?.animationPool || []}
                  onComplete={handleRollComplete}
                  prize={rollData?.prize}
                  prizeType={selectedPrize?.prizeType || null}
                  size="lg"
                />
              </div>

              {/* roll button - always visible, disabled when rolling/saving */}
              <div className="text-center mt-4">
                <button onClick={handleRoll}
                  disabled={isRolling || saving}
                  className={`px-14 py-4 font-bold text-lg rounded-xl shadow-lg
                    hover:shadow-2xl transition-all disabled:opacity-40
                    disabled:cursor-not-allowed text-white ${selectedPrize
                      ? selectedPrize.prizeType === 'grand'
                        ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600'
                        : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                      : 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
                    }`}>
                  {isRolling
                    ? '🎰 Rolling...'
                    : saving
                      ? '💾 Saving...'
                      : selectedPrize
                        ? selectedPrize.prizeType === 'grand'
                          ? '🏆 ROLL GRAND PRIZE'
                          : '🎯 ROLL FOR PRIZE'
                        : '🎰 ROLL TOKEN'}
                </button>
              </div>
            </div>
          </div>

          {/* ════ RIGHT — HISTORY TABS ════ */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-lg p-4">

              {/* tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                <button onClick={() => setRightTab('drawn')}
                  className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-1 ${rightTab === 'drawn'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}>
                  <FiHash size={14} /> Drawn ({drawnHistory.length})
                </button>
                <button onClick={() => setRightTab('winners')}
                  className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-1 ${rightTab === 'winners'
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}>
                  <FiAward size={14} /> Winners ({winners.length})
                </button>
              </div>

              {/* tab content */}
              <div className="max-h-[68vh] overflow-y-auto space-y-2 pr-1">

                {/* ── DRAWN tab ── */}
                {rightTab === 'drawn' && (
                  drawnHistory.length > 0 ? (
                    [...drawnHistory].reverse().map((entry, idx) => (
                      <div key={idx} className={`p-3 rounded-lg text-sm border ${entry.hasPrize
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-gray-50 border-gray-100'
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 text-base">
                            #{entry.tokenNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${entry.hasPrize
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-gray-200 text-gray-600'
                            }`}>
                            {entry.hasPrize ? 'Prize' : 'Regular'}
                          </span>
                        </div>
                        {entry.isSold && entry.buyerName && (
                          <p className="text-gray-600 text-xs mt-1">👤 {entry.buyerName}</p>
                        )}
                        {entry.hasPrize && (
                          <p className="text-yellow-700 text-xs mt-0.5 font-medium">
                            🏆 {entry.prizeTitle} — {formatCurrency(entry.prizeValue)}
                          </p>
                        )}
                        {!entry.isSold && (
                          <p className="text-gray-400 text-xs mt-0.5">Not purchased</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <FiHash className="mx-auto mb-2 text-3xl" />
                      <p>No tokens drawn yet</p>
                      <p className="text-xs mt-1">Click ROLL to start</p>
                    </div>
                  )
                )}

                {/* ── WINNERS tab ── */}
                {rightTab === 'winners' && (
                  winners.length > 0 ? (
                    [...winners].reverse().map((entry, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50
                                                border border-yellow-300">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 text-base">
                            #{entry.tokenNumber}
                          </span>
                          <FiAward className="text-yellow-600" size={18} />
                        </div>
                        <p className="text-yellow-800 font-semibold text-sm mt-1">
                          🏆 {entry.prizeTitle}
                        </p>
                        <p className="text-yellow-600 text-xs font-medium">
                          {formatCurrency(entry.prizeValue)}
                        </p>
                        {entry.isSold ? (
                          <p className="text-green-700 text-xs mt-1 font-medium">
                            ✓ Winner: {entry.buyerName}
                          </p>
                        ) : (
                          <p className="text-red-500 text-xs mt-1">
                            ✗ Not purchased — No winner
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <FiAward className="mx-auto mb-2 text-3xl" />
                      <p>No winners yet</p>
                      <p className="text-xs mt-1">Select a prize and roll</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──── FINALIZE MODAL ──── */}
      {showFinalizeModal && (
        <Modal isOpen={showFinalizeModal} onClose={() => setShowFinalizeModal(false)} title="Finalize Draw">
          <div className="space-y-4">
            <p className="text-gray-700">Are you sure you want to finalize <strong>{selectedDraw?.drawName}</strong>?</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-1 text-sm">
              <li>Mark all non-winning tokens as <strong>lost</strong></li>
              <li>Set draw status to <strong>completed</strong></li>
              <li>Delete payment screenshots (cleanup)</li>
              <li>Stop live mode</li>
            </ul>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm font-medium">⚠️ This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setShowFinalizeModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleFinalize} disabled={executing}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700
                           disabled:opacity-50 font-medium">
                {executing ? 'Finalizing...' : '🏁 Finalize'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExecuteDraw;