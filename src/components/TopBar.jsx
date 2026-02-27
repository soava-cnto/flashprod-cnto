import { useRef } from "react";
import { Sun, Moon, Upload } from 'lucide-react';
import logo from "../assets/logo.png";

export default function TopBar({ dark, onToggleTheme, allGroups, selectedGroup, onGroupChange, statusMsg, onFileLoad }) {
  const fileRef = useRef();
  const bg2    = dark ? "bg-[#161b22]" : "bg-white";
  const border = dark ? "border-[#30363d]" : "border-slate-200";
  const text   = dark ? "text-slate-200" : "text-slate-800";
  const muted  = dark ? "text-slate-500" : "text-slate-400";

  return (
    <div className={`h-14 ${bg2} border-b-2 ${border} flex items-center px-5 gap-3.5 flex-shrink-0 z-[100] shadow-sm`}>
      <div className="w-[110px] h-[34px] rounded-[9px] mt-2 flex items-center justify-center overflow-hidden flex-shrink-0 select-none">
        <img 
          src={logo} 
          alt="Logo" 
          className="w-full h-full object-cover"
        />
      </div>
      <span className={`font-bold text-[18px] tracking-tight ${text}`}>Flash Production</span>
      <div className={`w-px h-[22px] ${dark ? "bg-slate-700" : "bg-slate-200"}`} />
      <span className={`text-[12 px] font-medium ${muted}`}>Activité :</span>
      <select
        className={`${dark ? "bg-[#21262d] border-[#30363d] text-slate-200" : "bg-slate-100 border-slate-200 text-slate-800"} border rounded-lg px-3 py-1.5 text-[12px] font-medium cursor-pointer outline-none min-w-[150px] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all`}
        value={selectedGroup}
        onChange={(e) => onGroupChange(e.target.value)}
      >
        <option value="">— Tous —</option>
        {allGroups.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
      <span className={`text-[11px] font-normal ${muted}`}>{statusMsg}</span>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          className={`w-9 h-9 rounded-lg border cursor-pointer flex items-center justify-center text-[16px] transition-all ${dark ? "bg-[#21262d] border-[#096475] hover:border-[#096475] hover:bg-[#00afa9]" : "bg-slate-100 border-[#cce1e1] hover:border-[#096475] hover:bg-[#00afa9]"}`}
        >
          {dark ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
        </button>
        <button
          onClick={() => fileRef.current.click()}
          className="bg-[#00afa9] hover:bg-[#096475] text-white border-[#808284] px-4 py-2 rounded-lg text-[12px] cursor-pointer font-semibold flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
        >
          <Upload size={14} strokeWidth={2.5} />
          Charger CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => { onFileLoad(e.target.files[0]); e.target.value = ""; }} />
      </div>
    </div>
  );
}
