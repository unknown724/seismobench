import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  X, 
  Send, 
  Trash2, 
  Download, 
  Usb,
  Cpu
} from 'lucide-react';
import { NothingSelect } from './NothingSelect';

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

  const baudOptions = [
    { value: 115200, label: '115200 BAUD' },
    { value: 230400, label: '230400 BAUD' },
    { value: 460800, label: '460800 BAUD' },
    { value: 921600, label: '921600 BAUD (DEFAULT)' }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150 font-space"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl h-[650px] rounded-2xl overflow-hidden border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#0E0E10] shadow-2xl flex flex-col text-xs"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Terminal Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-[#121214]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D71921]" />
            <div>
              <h3 className="font-ndot font-bold text-sm tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                SERIAL TERMINAL // PACKET INSPECTOR
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  !isConnected ? 'border border-neutral-300 dark:border-neutral-700 text-neutral-400' :
                  isSimulated ? 'border border-purple-500/40 text-purple-400' :
                  'border border-[#D71921]/40 text-[#D71921]'
                }`}>
                  {!isConnected ? 'OFFLINE' : isSimulated ? 'LOOPBACK SIMULATOR' : 'USB-C LIVE'}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-48">
              <NothingSelect
                value={baudRate}
                onChange={(val) => onChangeBaudRate(parseInt(val))}
                options={baudOptions}
              />
            </div>

            {!isConnected ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onConnectPhysical}
                  className="px-3 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Usb className="w-3.5 h-3.5" />
                  <span>CONNECT</span>
                </button>
                <button
                  onClick={onStartSimulation}
                  className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:border-neutral-500 text-xs font-bold transition-all cursor-pointer"
                >
                  SIMULATE
                </button>
              </div>
            ) : (
              <button
                onClick={onDisconnect}
                className="px-3 py-2 rounded-xl border border-rose-500/40 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                DISCONNECT
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Packets Bar */}
        <div className="px-5 py-2 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-[11px] bg-neutral-100 dark:bg-[#141416]">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-mono">QUICK:</span>
            {['PING', 'STATUS', 'HOME', 'ESTOP'].map(cmd => (
              <button
                key={cmd}
                onClick={() => onSendCommand(`{"cmd":"${cmd}"}`)}
                className={`px-2.5 py-0.5 rounded-md font-mono border transition-all cursor-pointer ${
                  cmd === 'ESTOP'
                    ? 'border-rose-500/40 text-rose-500 hover:bg-rose-500 hover:text-white font-bold'
                    : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {cmd}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-neutral-500 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoscroll}
                onChange={(e) => setAutoscroll(e.target.checked)}
                className="accent-[#D71921] rounded"
              />
              <span>AUTOSCROLL</span>
            </label>

            <button
              onClick={handleExportLog}
              className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT</span>
            </button>

            <button
              onClick={onClearLog}
              className="text-neutral-500 hover:text-[#D71921] flex items-center gap-1 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>CLEAR</span>
            </button>
          </div>
        </div>

        {/* Terminal Log Console */}
        <div className="flex-1 bg-[#060608] p-4 overflow-y-auto font-mono text-xs text-neutral-300 space-y-1 select-text">
          {packetLog.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-2">
              <Terminal className="w-8 h-8 opacity-40" />
              <p>NO PACKET ACTIVITY RECORDED</p>
              <p className="text-[10px] opacity-75">Connect physical USB-C port or launch Simulator to stream telemetry.</p>
            </div>
          ) : (
            packetLog.map((pkt, index) => {
              const isTx = pkt.type === 'TX';
              const isRx = pkt.type === 'RX';
              const isTelemetry = pkt.type === 'TELEMETRY';

              let badgeColor = 'text-blue-400 border-blue-500/40';
              if (isRx) badgeColor = 'text-emerald-400 border-emerald-500/40';
              if (isTelemetry) badgeColor = 'text-neutral-400 border-neutral-700';

              return (
                <div key={index} className="flex items-start gap-2 py-0.5 px-1 hover:bg-white/[0.03] rounded">
                  <span className="text-neutral-600 text-[10px]">{pkt.time}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${badgeColor}`}>
                    {pkt.type}
                  </span>
                  <span className={`break-all ${
                    isTx ? 'text-blue-300' :
                    isRx ? 'text-emerald-300' :
                    isTelemetry ? 'text-neutral-400 text-[10px]' :
                    'text-rose-400'
                  }`}>
                    {pkt.raw}
                  </span>
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>

        {/* Command Input Form */}
        <form onSubmit={handleSubmit} className="p-3 bg-neutral-100 dark:bg-[#121214] border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
          <span className="text-[#D71921] font-mono font-bold pl-2">&gt;</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type JSON command or ASCII (e.g. {'cmd':'SHAKE'})..."
            className="flex-1 bg-white dark:bg-[#060608] border border-neutral-300 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-[#D71921]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#D71921] hover:bg-[#b5141b] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-3 h-3" />
            <span>SEND</span>
          </button>
        </form>

      </div>
    </div>
  );
}
