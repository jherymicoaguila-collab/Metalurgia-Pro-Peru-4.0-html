
import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { askCareerAdvice, editImage, searchJobs } from './services/geminiService';
import { SalaryData, ChatMessage } from './types';

const SALARY_DATA: SalaryData[] = [
  { career: 'Minas', min: 4000, avg: 6800, max: 17500 },
  { career: 'Metalurgia', min: 3500, avg: 6400, max: 15500 },
  { career: 'Sistemas', min: 3200, avg: 6100, max: 14000 },
  { career: 'Civil', min: 2800, avg: 5200, max: 10500 },
  { career: 'Industrial', min: 2500, avg: 4800, max: 9500 },
].sort((a, b) => b.avg - a.avg);

const SUGGESTIONS = [
  { text: "¿Cuál es el impacto del Puerto de Chancay en mi carrera?", icon: "fa-ship", color: "text-blue-500" },
  { text: "Minería verde y sostenibilidad en el Perú 2026", icon: "fa-leaf", color: "text-emerald-500" },
  { text: "Proyección salarial de un Metalurgista Senior", icon: "fa-sack-dollar", color: "text-amber-500" },
  { text: "Nuevas tecnologías 4.0 en plantas de beneficio", icon: "fa-microchip", color: "text-indigo-500" },
  { text: "Demanda de expertos en extracción de Litio", icon: "fa-bolt", color: "text-cyan-500" },
  { text: "Habilidades blandas clave para líderes mineros", icon: "fa-users-gear", color: "text-purple-500" }
];

// Custom 3D-ish Bar Shape
const CustomBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  if (height < 0) return null;
  return (
    <g>
      {/* Front Face */}
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={8} ry={8} />
      {/* Side Face (Depth) */}
      <path
        d={`M ${x + width} ${y + 8} L ${x + width + 8} ${y} L ${x + width + 8} ${y + height - 8} L ${x + width} ${y + height} Z`}
        fill={fill}
        filter="brightness(0.7)"
      />
      {/* Top Face (Depth) */}
      <path
        d={`M ${x + 8} ${y - 8} L ${x + width + 8} ${y - 8} L ${x + width} ${y} L ${x} ${y} Z`}
        fill={fill}
        filter="brightness(1.2)"
      />
    </g>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Market' | 'Visual Lab'>('Dashboard');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [jobQuery, setJobQuery] = useState('');
  const [jobResults, setJobResults] = useState<{ text: string; sources: any[] } | null>(null);
  const [isSearchingJobs, setIsSearchingJobs] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory, isTyping]);

  const handleSendMessage = async (text?: string) => {
    const messageToSend = text || chatInput;
    if (!messageToSend.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: messageToSend };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    const result = await askCareerAdvice(messageToSend);
    const modelMsg: ChatMessage = { 
      role: 'model', 
      text: result.text, 
      sources: result.sources 
    };
    
    setChatHistory(prev => [...prev, modelMsg]);
    setIsTyping(false);
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleJobSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobQuery.trim()) return;
    setIsSearchingJobs(true);
    const results = await searchJobs(jobQuery);
    setJobResults(results);
    setIsSearchingJobs(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImage = async () => {
    if (!selectedImage || !editPrompt) return;
    setIsEditing(true);
    try {
      const edited = await editImage(selectedImage, editPrompt);
      setResultImage(edited);
    } catch (error) {
      alert("Error al procesar la imagen.");
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 lg:p-12 relative overflow-hidden bg-white text-slate-900">
      
      {/* Header */}
      <header className="container mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 transform hover:rotate-6 transition-all cursor-pointer">
            <i className="fas fa-layer-group text-2xl"></i>
          </div>
          <div>
            <h1 className="text-4xl font-brand tracking-tighter uppercase italic leading-none text-slate-900">
              MET<span className="text-indigo-600">LAB</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.5em] mt-1 uppercase">Engineering Ecosystem 2026</p>
          </div>
        </div>
        
        <nav className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
          {(['Dashboard', 'Market', 'Visual Lab'] as const).map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main className="container mx-auto grid grid-cols-1 xl:grid-cols-12 gap-10 flex-grow">
        
        {/* Left Column (Content) */}
        <div className="xl:col-span-7 space-y-8">
          
          {activeTab === 'Dashboard' && (
            <>
              <section className="neo-card p-10 lg:p-14 relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-indigo-600 font-black text-[10px] tracking-widest uppercase mb-4 block">Knowledge Hub</span>
                  <h2 className="text-5xl lg:text-6xl font-brand leading-[1.1] mb-8 tracking-tighter text-slate-900">
                    Domina la <br/>
                    <span className="bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent">Metalurgia 2026</span>
                  </h2>
                  <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-lg mb-10">
                    El 2026 es el año de la consolidación. Con el Puerto de Chancay operando al 100%, las oportunidades en exportación minera no tienen precedentes.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                      <i className="fas fa-microchip text-indigo-600 mb-3 text-xl"></i>
                      <h4 className="font-bold text-slate-900 text-sm mb-1 italic">Procesos 2026</h4>
                      <p className="text-xs text-slate-500">Uso masivo de sensores IoT y análisis predictivo en planta.</p>
                    </div>
                    <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100">
                      <i className="fas fa-leaf text-amber-600 mb-3 text-xl"></i>
                      <h4 className="font-bold text-slate-900 text-sm mb-1 italic">Impacto Verde</h4>
                      <p className="text-xs text-slate-500">Nuevas normativas de descarbonización para el sector.</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-10 opacity-5">
                   <i className="fas fa-atom text-[15rem]"></i>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: "Empresas Top", value: "50+", desc: "Corporaciones Activas", icon: "fa-building", color: "text-blue-500" },
                  { title: "Demanda Lab.", value: "Sólida", desc: "Proyección 2026-2030", icon: "fa-bolt", color: "text-amber-500" },
                  { title: "Región Clave", value: "Sur/Norte", desc: "Arequipa & La Libertad", icon: "fa-location-dot", color: "text-indigo-500" },
                ].map((stat, i) => (
                  <div key={i} className="neo-card p-6 flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 ${stat.color}`}>
                      <i className={`fas ${stat.icon} text-lg`}></i>
                    </div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</h5>
                    <p className="text-2xl font-brand text-slate-900">{stat.value}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1">{stat.desc}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'Market' && (
            <>
              <section className="neo-card p-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-brand italic text-slate-900">Benchmark Salarial 2026</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Compensación Mensual Estimada (PEN)</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                    <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
                  </div>
                </div>
                
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={SALARY_DATA} margin={{ top: 40, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="career" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 800}} dy={15} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                      <Bar 
                        dataKey="avg" 
                        shape={<CustomBar />} 
                        barSize={50}
                      >
                        {SALARY_DATA.map((entry, index) => (
                          <Cell key={index} fill={entry.career === 'Metalurgia' ? '#fbbf24' : '#6366f1'} />
                        ))}
                        <LabelList dataKey="avg" position="top" content={(p: any) => (
                          <text x={p.x + p.width/2} y={p.y - 25} fill="#0f172a" textAnchor="middle" fontSize={13} fontWeight={900} fontFamily="Syne">
                            S/ {p.value.toLocaleString()}
                          </text>
                        )} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="neo-card p-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <i className="fas fa-briefcase text-xl"></i>
                  </div>
                  <h3 className="text-2xl font-brand italic text-slate-900">Buscador de Empleos 2026</h3>
                </div>
                
                <form onSubmit={handleJobSearch} className="relative group">
                  <input 
                    type="text" 
                    value={jobQuery}
                    onChange={(e) => setJobQuery(e.target.value)}
                    placeholder="Ej: 'Practicante de Metalurgia' o 'Jefe de Laboratorio 2026'"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl px-8 py-5 text-sm font-semibold transition-all outline-none"
                  />
                  <button 
                    type="submit"
                    disabled={isSearchingJobs || !jobQuery.trim()}
                    className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-8 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-30"
                  >
                    {isSearchingJobs ? "Buscando..." : "Buscar Vacantes"}
                  </button>
                </form>

                {jobResults && (
                  <div className="bg-slate-50 rounded-3xl p-8 animate-in fade-in slide-in-from-top-4">
                    <div className="text-sm text-slate-800 leading-relaxed space-y-4 markdown-content">
                      {jobResults.text.split('\n').map((line, idx) => {
                         if (line.startsWith('###')) {
                           return <h4 key={idx} className="text-indigo-600 font-brand italic mt-4 mb-2">{line.replace(/###\s*/, '')}</h4>;
                         }
                         return <p key={idx}>{line}</p>;
                      })}
                    </div>
                    {jobResults.sources.length > 0 && (
                      <div className="mt-8 flex flex-wrap gap-2">
                        {jobResults.sources.map((s, idx) => (
                          <a key={idx} href={s.uri} target="_blank" className="text-[10px] font-black bg-white border border-slate-200 px-4 py-2 rounded-full hover:border-indigo-600 hover:text-indigo-600 transition-all">
                            <i className="fas fa-link mr-2"></i> {s.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === 'Visual Lab' && (
            <section className="neo-card p-10 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-brand italic text-slate-900">Visual Lab Pro 2026</h3>
                <i className="fas fa-wand-magic-sparkles text-indigo-600 text-2xl"></i>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="aspect-video bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group transition-all hover:border-indigo-400">
                    {selectedImage ? (
                      <img src={selectedImage} className="absolute inset-0 w-full h-full object-cover" alt="Original" />
                    ) : (
                      <>
                        <i className="fas fa-image text-4xl text-slate-200 mb-4"></i>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click para subir</p>
                      </>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                  </div>
                </div>
                <div className="aspect-video bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center relative overflow-hidden shadow-inner">
                  {isEditing ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Generando...</p>
                    </div>
                  ) : resultImage ? (
                    <img src={resultImage} className="absolute inset-0 w-full h-full object-cover" alt="Resultado" />
                  ) : (
                    <p className="text-[10px] text-slate-300 font-bold uppercase italic tracking-widest">Esperando instrucciones...</p>
                  )}
                </div>
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Instrucción (Ej: 'Convierte este plano en una visualización 3D')"
                  className="w-full bg-slate-100 rounded-2xl px-8 py-5 text-sm font-semibold outline-none border-2 border-transparent focus:border-indigo-200 focus:bg-white transition-all"
                />
                <button 
                  onClick={handleEditImage}
                  disabled={isEditing || !selectedImage || !editPrompt}
                  className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-8 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-20"
                >
                  Ejecutar
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Right Column (AI Advisor) */}
        <div className="xl:col-span-5 h-[85vh] flex flex-col">
          <div className="neo-card flex flex-col h-full overflow-hidden border-2 border-slate-100 bg-slate-50/30">
            
            {/* AI Advisor Header */}
            <div className="p-8 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <i className="fas fa-robot text-xl"></i>
                </div>
                <div>
                  <h4 className="font-brand tracking-tight text-xl leading-none text-slate-900 italic">IA ADVISOR 2026</h4>
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-1">Soporte Estratégico Activo</p>
                </div>
              </div>
              <button onClick={() => setChatHistory([])} className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-all">
                <i className="fas fa-rotate-left"></i>
              </button>
            </div>

            {/* Chat Messages / Suggestions */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-8 space-y-8">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center py-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                    <i className="fas fa-sparkles text-2xl text-indigo-400"></i>
                  </div>
                  <h5 className="text-xl font-brand italic text-slate-900 mb-2">Consultoría Metalúrgica</h5>
                  <p className="text-sm font-medium text-slate-500 text-center mb-8 px-4">
                    Explora el futuro de tu carrera. Selecciona una sugerencia o escribe tu propia consulta.
                  </p>
                  
                  {/* Interactive Suggestions Grid */}
                  <div className="grid grid-cols-1 gap-3 w-full">
                    {SUGGESTIONS.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(sug.text)}
                        className="bg-white border border-slate-100 p-4 rounded-2xl text-left hover:border-indigo-600 hover:shadow-md transition-all group flex items-center gap-4"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center ${sug.color} group-hover:scale-110 transition-transform`}>
                          <i className={`fas ${sug.icon} text-sm`}></i>
                        </div>
                        <span className="text-xs font-bold text-slate-700 leading-tight">{sug.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] p-6 rounded-3xl ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white font-bold rounded-br-none shadow-xl shadow-indigo-100' 
                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-sm'
                    }`}>
                      <div className="text-[14px] leading-relaxed markdown-content space-y-4">
                        {msg.text.split('\n').map((line, index) => {
                          if (line.startsWith('###')) {
                            return <h3 key={index} className="text-slate-900 mb-2 font-brand italic">{line.replace(/###\s*/, '')}</h3>;
                          }
                          if (line.startsWith('•')) {
                            return <div key={index} className="flex gap-2 text-slate-700 font-medium pl-2"><span className="text-indigo-600">▸</span> {line.replace(/•\s*/, '')}</div>;
                          }
                          return <p key={index} className="mb-2 last:mb-0">{line}</p>;
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-5 rounded-full flex gap-2 px-8 border border-slate-100 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bottom */}
            <div className="p-8 bg-white border-t border-slate-100">
              <form onSubmit={onFormSubmit} className="relative group">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Analizar mi futuro..."
                  className="w-full bg-slate-50 border-none rounded-2xl pl-8 pr-32 py-5 font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all"
                />
                <button 
                  type="submit"
                  disabled={isTyping || !chatInput.trim()}
                  className="absolute right-2 top-2 bottom-2 px-8 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-20"
                >
                  Analizar
                </button>
              </form>
            </div>
          </div>
        </div>

      </main>

      <footer className="container mx-auto mt-20 py-12 border-t border-slate-100 text-center opacity-30">
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[1em]">
          &copy; 2026 METLAB PERÚ • THE NEW AGE OF ENGINEERING
        </p>
      </footer>
    </div>
  );
};

export default App;
