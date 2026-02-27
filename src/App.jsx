import { useState, useCallback, useEffect } from "react";
import TopBar from "./components/TopBar";
import EmptyState from "./components/EmptyState";
import DataTable from "./components/DataTable";
import Legend from "./components/Legend";
import Loading from "./components/Loading";
import { parseCSV } from "./utils/csvParser";
import { buildIndex } from "./utils/dataProcessor";

export default function App() {
  const [dark, setDark] = useState(false);
  const [rawData, setRawData] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [collapseState, setCollapseState] = useState({});
  const [dataIdx, setDataIdx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Aucun fichier chargé");

  const handleToggle = useCallback((key) => {
    setCollapseState((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleGroupChange = useCallback((g) => {
    setSelectedGroup(g);
    setCollapseState({});
    if (rawData.length > 0) setDataIdx(buildIndex(rawData, g));
  }, [rawData]);

const handleAutoLoad = useCallback(async () => {
  setLoading(true);
  try {
    // On priorise l'URL publique si elle existe et est accessible.
    // Cependant une URL de blob privée (avec `private.blob.vercel-storage.com`)
    // renvoie 403 dans le navigateur ; dans ce cas on retombe automatiquement
    // vers l'API serverless qui utilise le jeton secret.
    let response;
    if (import.meta.env.VITE_BLOB_URL) {
      response = await fetch(import.meta.env.VITE_BLOB_URL);
      if (response.status === 403) {
        console.warn(
          'VITE_BLOB_URL a renvoyé 403 (probablement un blob privé). ' +
            'Utilisation de /api/get-csv à la place.'
        );
        response = await fetch('/api/get-csv');
      }
    } else {
      response = await fetch('/api/get-csv');
    }

    if (!response.ok) {
      const errMsg = `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errMsg);
    }

    const csvText = await response.text();
    
    console.debug('Raw CSV length:', csvText.length);
    console.debug('First 200 chars:', csvText.substring(0, 200));
    
    // Ton process habituel de lecture
    const parsed = parseCSV(csvText);
    console.debug('parsed rows', parsed.length, parsed[0]);

    const groups = [...new Set(parsed.map((r) => r.groupe_suivi).filter(Boolean))].sort();
    const first = groups.length > 0 ? groups[0] : "";

    setRawData(parsed);
    setAllGroups(groups);
    setSelectedGroup(first);
    setDataIdx(buildIndex(parsed, first));
    setStatusMsg(`${parsed.length} lignes · ${groups.length} activité(s)`);
    setLoading(false);
  } catch (err) {
    console.error("Erreur privée:", err);
    setLoading(false);
  }
}, []);

// Appeler la fonction au chargement de la page
useEffect(() => {
  handleAutoLoad();
}, [handleAutoLoad]);

  const handleFileLoad = useCallback((file) => {
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTimeout(() => {
        const parsed = parseCSV(ev.target.result);
        const groups = [...new Set(parsed.map((r) => r.groupe_suivi).filter(Boolean))].sort();
        const first = groups.length > 0 ? groups[0] : "";
        setRawData(parsed);
        setAllGroups(groups);
        setSelectedGroup(first);
        setCollapseState({});
        setDataIdx(buildIndex(parsed, first));
        setStatusMsg(`${parsed.length} lignes · ${groups.length} activité(s)`);
        setLoading(false);
      }, 50);
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const bg = dark ? "bg-[#0d1117] text-slate-200" : "bg-[#f5f7fa] text-slate-800";

  return (
    <div className={`${bg} font-[Poppins,sans-serif] text-[13px] h-screen flex flex-col overflow-hidden`}>
      <TopBar
        dark={dark}
        onToggleTheme={() => setDark((v) => !v)}
        allGroups={allGroups}
        selectedGroup={selectedGroup}
        onGroupChange={handleGroupChange}
        statusMsg={statusMsg}
        onFileLoad={handleFileLoad}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {!dataIdx ? (
          <EmptyState dark={dark} />
        ) : (
          <DataTable
            dataIdx={dataIdx}
            collapseState={collapseState}
            onToggle={handleToggle}
            dark={dark}
          />
        )}
      </div>

      {dataIdx && <Legend dark={dark} />}

      {loading && <Loading dark={dark} message="Traitement des données…" />}
    </div>
  );
}
