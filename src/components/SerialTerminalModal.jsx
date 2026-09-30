import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  X, 
  Send, 
  Trash2, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Play,
  RotateCcw,
  Usb,
  Cpu
} from 'lucide-react';

export function SerialTerminalModal({
  isOpen,
  onClose,
  packetLog = [],
  onClearLog,
  onSendCommand,
  isConnected,
  isSimulated,
  baudRate,
  onChangeBaudRate,
  onConnectPhysical,
  onStartSimulation,
  onDisconnect
}) {
  const [commandInput, setCommandInput] = useState('');
  const [autoscroll, setAutoscroll] = useState(true);
  const logEndRef = useRef(null);

  useEffect(() => {
    if (autoscroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [packetLog, autoscroll]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    onSendCommand(commandInput.trim());
    setCommandInput('');
  };

  const handleExportLog = () => {
    const text = packetLog.map(p => `[${p.time}] [${p.type}] ${p.raw}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seismobench_serial_${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl h-[650px] rounded-3xl overflow-hidden backdrop-blur-3xl bg-white/95 dark:bg-[#161B22]/95 border border-black/10 dark:border-white/10 shadow-2xl flex flex-col text-sm"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Terminal Header */}
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-neutral-100/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight text-sm flex items-center gap-2">
                Serial Terminal & Packet Inspector
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-medium ${
                  !isConnected ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500' :
                  isSimulated ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30' :
                  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                }`}>
                  {!isConnected ? 'PORT CLOSED' : isSimulated ? 'LOOPBACK SIMULATOR' : 'PHYSICAL USB-C'}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Baud Rate Selector */}
            <select
              value={baudRate}
              onChange={(e) => onChangeBaudRate(parseInt(e.target.value))}
              disabled={isConnected}
              className="bg-neutral-200/60 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 font-mono disabled:opacity-50 focus:outline-none"
            >
              <option value="115200">115200 baud</option>
              <option value="230400">230400 baud</option>
              <option value="460800">460800 baud</option>
              <option value="921600">921600 baud (Default)</option>
            </select>

            {/* Connect / Disconnect Buttons */}
            {!isConnected ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onConnectPhysical}
                  className="px-3 py-1.5 bg-[#0071E3] dark:bg-[#0A84FF] hover:brightness-110 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Usb className="w-3.5 h-3.5" />
                  Connect
                </button>
                <button
                  onClick={onStartSimulation}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  Simulate
                </button>
              </div>
            ) : (
              <button
                onClick={onDisconnect}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Disconnect
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-neutral-200 dark:hover:bg-white/[0.08] text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Command Shortcuts Bar */}
        <div className="bg-neutral-100/70 dark:bg-white/[0.02] px-6 py-2 border-b border-black/[0.04] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-neutral-400 font-mono">Quick Packets:</span>
            <button
              onClick={() => onSendCommand('{"cmd":"PING"}')}
              className="px-2.5 py-1 rounded-lg bg-neutral-200/60 dark:bg-white/[0.04] hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 font-mono text-[11px] transition-colors"
            >
              PING
            </button>
            <button
              onClick={() => onSendCommand('{"cmd":"STATUS"}')}
              className="px-2.5 py-1 rounded-lg bg-neutral-200/60 dark:bg-white/[0.04] hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 font-mono text-[11px] transition-colors"
            >
              STATUS
            </button>
            <button
              onClick={() => onSendCommand('{"cmd":"HOME"}')}
              className="px-2.5 py-1 rounded-lg bg-neutral-200/60 dark:bg-white/[0.04] hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 font-mono text-[11px] transition-colors"
            >
              HOME
            </button>
            <button
              onClick={() => onSendCommand('{"cmd":"ESTOP"}')}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-mono text-[11px] font-bold transition-colors"
            >
              ESTOP
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoscroll}
                onChange={(e) => setAutoscroll(e.target.checked)}
                className="accent-blue-500 rounded"
              />
              <span>Autoscroll</span>
            </label>

            <button
              onClick={handleExportLog}
              className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 text-xs transition-colors"
              title="Export Log to .log file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={onClearLog}
              className="text-neutral-500 dark:text-neutral-400 hover:text-rose-500 flex items-center gap-1 text-xs transition-colors"
              title="Clear packet history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Packet Feed Window */}
        <div className="flex-1 bg-neutral-900 dark:bg-[#0B0E14] p-4 overflow-y-auto font-mono text-xs text-neutral-200 space-y-1 select-text">
          {packetLog.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-2">
              <Terminal className="w-8 h-8 opacity-40" />
              <p>No packet activity recorded yet.</p>
              <p className="text-[11px] opacity-75">Connect physical USB-C port or launch Simulator to start telemetry stream.</p>
            </div>
          ) : (
            packetLog.map((pkt, index) => {
              const isTx = pkt.type === 'TX';
              const isRx = pkt.type === 'RX';
              const isTelemetry = pkt.type === 'TELEMETRY';
              const isErr = pkt.type === 'ERR';

              let badgeColor = 'text-blue-400 bg-blue-950/60 border-blue-800/40';
              if (isRx) badgeColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40';
              if (isTelemetry) badgeColor = 'text-cyan-400 bg-cyan-950/40 border-cyan-800/30';
              if (isErr) badgeColor = 'text-rose-400 bg-rose-950/60 border-rose-800/40';

              return (
                <div key={index} className="flex items-start gap-2 hover:bg-white/[0.02] py-0.5 px-1 rounded transition-colors">
                  <span className="text-neutral-500 shrink-0 text-[10px]">{pkt.time}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0 ${badgeColor}`}>
                    {pkt.type}
                  </span>
                  <span className={`break-all ${
                    isTx ? 'text-blue-300' :
                    isRx ? 'text-emerald-300' :
                    isTelemetry ? 'text-neutral-400 text-[11px]' :
                    'text-rose-300'
                  }`}>
                    {pkt.raw}
                  </span>
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>

        {/* Input Command Field */}
        <form onSubmit={handleSubmit} className="p-3.5 bg-neutral-100/70 dark:bg-white/[0.02] border-t border-black/[0.04] dark:border-white/[0.06] flex items-center gap-2">
          <span className="text-neutral-400 font-mono text-sm pl-2">&gt;</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type JSON command or raw ASCII (e.g., {'cmd':'SHAKE'})..."
            className="flex-1 bg-white dark:bg-neutral-900 border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#0071E3] dark:bg-[#0A84FF] hover:brightness-110 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>

      </div>
    </div>
  );
}
