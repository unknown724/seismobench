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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl h-[650px] shadow-2xl flex flex-col overflow-hidden text-sm">
        
        {/* Terminal Header */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white tracking-wide text-sm flex items-center gap-2">
                Serial Terminal & Packet Inspector
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                  !isConnected ? 'bg-slate-800 text-slate-400' :
                  isSimulated ? 'bg-purple-950 text-purple-300 border border-purple-800/60' :
                  'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                }`}>
                  {!isConnected ? 'PORT CLOSED' : isSimulated ? 'LOOPBACK SIMULATOR' : 'PHYSICAL USB-C'}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Baud Rate Selector */}
            <select
              value={baudRate}
              onChange={(e) => onChangeBaudRate(parseInt(e.target.value))}
              disabled={isConnected}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-mono disabled:opacity-50"
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
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Usb className="w-3 h-3" />
                  Connect
                </button>
                <button
                  onClick={onStartSimulation}
                  className="px-2.5 py-1 bg-purple-900 hover:bg-purple-800 text-purple-200 border border-purple-700/60 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Cpu className="w-3 h-3" />
                  Simulate
                </button>
              </div>
            ) : (
              <button
                onClick={onDisconnect}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 rounded text-xs font-semibold transition-colors"
              >
                Disconnect
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Command Presets Bar */}
        <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">Quick Commands:</span>
            <button
              onClick={() => onSendCommand('PING')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded border border-slate-700"
            >
              PING
            </button>
            <button
              onClick={() => onSendCommand('STATUS')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded border border-slate-700"
            >
              STATUS
            </button>
            <button
              onClick={() => onSendCommand('HOME')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded border border-slate-700"
            >
              HOME
            </button>
            <button
              onClick={() => onSendCommand('ESTOP')}
              className="px-2 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded border border-rose-800"
            >
              ESTOP
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
              <input
                type="checkbox"
                checked={autoscroll}
                onChange={(e) => setAutoscroll(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
              <span className="text-[11px]">Autoscroll</span>
            </label>

            <button
              onClick={handleExportLog}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
              title="Download Log as TXT"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClearLog}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400"
              title="Clear Terminal Log"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Monospace Packet Stream Viewer */}
        <div className="flex-1 bg-slate-950 p-4 overflow-y-auto font-mono text-xs space-y-1 select-text">
          {packetLog.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600">
              No serial communication packets yet. Connect to ESP32-S3 or run simulation.
            </div>
          ) : (
            packetLog.map((pkt, idx) => (
              <div key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-600 text-[10px] select-none shrink-0">
                  {pkt.time}
                </span>
                <span className={`px-1 py-0.2 rounded text-[10px] font-bold select-none shrink-0 ${
                  pkt.type === 'TX' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/40' :
                  pkt.raw.includes('WARN') || pkt.raw.includes('ESTOP') ? 'bg-rose-950 text-rose-400 border border-rose-800/40' :
                  pkt.raw.includes('TLM') ? 'bg-emerald-950/60 text-emerald-400' :
                  'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                }`}>
                  {pkt.type}
                </span>
                <span className={`break-all ${
                  pkt.type === 'TX' ? 'text-cyan-300' :
                  pkt.raw.includes('WARN') || pkt.raw.includes('ESTOP') ? 'text-rose-400 font-semibold' :
                  pkt.raw.includes('TLM') ? 'text-emerald-400/90' :
                  'text-slate-200'
                }`}>
                  {pkt.raw}
                </span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>

        {/* Manual Command Input Form */}
        <form onSubmit={handleSubmit} className="bg-slate-950 p-3 border-t border-slate-800 flex items-center gap-2">
          <span className="text-cyan-500 font-mono font-bold">{'>'}</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type raw command (e.g. PING, STATUS, CFG:STEPS=80)..."
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </form>

      </div>
    </div>
  );
}
