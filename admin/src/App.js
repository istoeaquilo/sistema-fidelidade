import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    doc, 
    getDoc, 
    updateDoc,
    setDoc,
    addDoc,
    query,
    where,
    getDocs,
    Timestamp
} from 'firebase/firestore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Configuração do Firebase ---
// Esta é a forma correta e segura de ler a configuração do ambiente.
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-fidelidade-app';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let db;

// --- Cores da Marca ---
const COR_VINHO = '#9A3324';
const COR_AMARELO = '#D59A1D';
const LOGO_URL = 'https://i.imgur.com/83uVBmy.png';

// --- Componentes de Ícones ---
const IconNPS = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconPrint = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-8V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;
const IconDownload = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const IconBuildingStore = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const IconDashboard = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const IconCampaign = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const IconUserGroup = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const IconCog = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconChartBar = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const IconSearch = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconClose = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const Loader = () => <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-vinho"></div>;

// --- Funções Helper ---
const formatarData = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('pt-BR');
};

const exportToCsv = (filename, rows) => {
    if (!rows || rows.length === 0) { alert("Não há dados para exportar."); return; }
    const headers = Object.keys(rows[0]);
    const csvContent = [
        headers.join(','),
        ...rows.map(row => headers.map(header => {
            const val = row[header];
            const str = String(val === null || val === undefined ? '' : val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(','))
    ].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const StatCard = ({ title, value, isLoading }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-gray-500 text-sm font-medium uppercase">{title}</h3>
        {isLoading ? <div className="h-10 mt-1 flex items-center"><Loader /></div> : <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>}
    </div>
);

// --- Componente para Selecionar Unidade ---
const RestaurantSelector = ({ restaurants, selectedId, onSelect, loading }) => {
    if (loading) return <div className="p-4 text-sm text-gray-500">A carregar unidades...</div>;
    return (
        <div className="p-4 bg-gray-50 print:hidden">
            <label htmlFor="restaurant-selector" className="block text-sm font-medium text-gray-700">A trabalhar na unidade:</label>
            <select
                id="restaurant-selector"
                value={selectedId}
                onChange={e => onSelect(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-vinho focus:border-vinho sm:text-sm rounded-md"
            >
                {restaurants.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
        </div>
    );
};

// --- Ecrã Dashboard ---
function TelaDashboard({ restaurantId }) {
    const [stats, setStats] = useState({ totalClientes: 0, checkinsHoje: 0, recompensasMes: 0, novosClientesMes: 0 });
    const [chartData, setChartData] = useState({ gender: [], age: [] });
    const [loading, setLoading] = useState(true);
    const GENDER_COLORS = { 'masculino': '#3b82f6', 'feminino': '#ec4899', 'outro': '#a855f7', 'não informado': '#6b7280'};
    useEffect(() => {
        if (!restaurantId) { setLoading(false); return; }
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const basePath = `artifacts/${appId}/public/data/restaurants/${restaurantId}`;
                const clientesSnapshot = await getDocs(collection(db, `${basePath}/clientes`));
                const totalClientes = clientesSnapshot.size;
                const clientesList = clientesSnapshot.docs.map(doc => doc.data());
                const genderCounts = clientesList.reduce((acc, cliente) => { const gender = cliente.sexo || 'não informado'; acc[gender] = (acc[gender] || 0) + 1; return acc; }, {});
                const genderData = Object.keys(genderCounts).map(name => ({ name, value: genderCounts[name] }));
                const ageRanges = { "18-25": 0, "26-35": 0, "36-45": 0, "46-60": 0, "60+": 0, "N/A": 0 };
                clientesList.forEach(cliente => {
                    if (cliente.dataNascimento && cliente.dataNascimento.seconds) {
                        const birthDate = new Date(cliente.dataNascimento.seconds * 1000);
                        const age = new Date().getFullYear() - birthDate.getFullYear();
                        if (age >= 18 && age <= 25) ageRanges["18-25"]++;
                        else if (age >= 26 && age <= 35) ageRanges["26-35"]++;
                        else if (age >= 36 && age <= 45) ageRanges["36-45"]++;
                        else if (age >= 46 && age <= 60) ageRanges["46-60"]++;
                        else if (age > 60) ageRanges["60+"]++;
                        else ageRanges["N/A"]++;
                    } else { ageRanges["N/A"]++; }
                });
                const ageData = Object.keys(ageRanges).map(name => ({ name, Clientes: ageRanges[name] }));
                setChartData({ gender: genderData, age: ageData });
                const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
                const trintaDiasAtras = new Date(); trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
                const qCheckins = query(collection(db, `${basePath}/checkins`), where("dataCheckin", ">=", hoje));
                const qRecompensas = query(collection(db, `${basePath}/recompensas`), where("dataResgate", ">=", trintaDiasAtras));
                const qNovosClientes = query(collection(db, `${basePath}/clientes`), where("dataCadastro", ">=", trintaDiasAtras));
                const [checkinsSnapshot, recompensasSnapshot, novosClientesSnapshot] = await Promise.all([ getDocs(qCheckins), getDocs(qRecompensas), getDocs(qNovosClientes) ]);
                setStats({ totalClientes, checkinsHoje: checkinsSnapshot.size, recompensasMes: recompensasSnapshot.size, novosClientesMes: novosClientesSnapshot.size });
            } catch (error) { console.error("Erro ao carregar dados do dashboard:", error); }
            setLoading(false);
        };
        fetchDashboardData();
    }, [restaurantId]);
    if (!restaurantId) return <div className="p-8 text-center text-gray-500">Por favor, crie e/ou selecione uma unidade para começar.</div>;
    return (
        <div className="p-8"><h2 className="text-3xl font-bold mb-8 text-gray-800">Dashboard</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><StatCard title="Total de Clientes" value={stats.totalClientes} isLoading={loading} /><StatCard title="Check-ins Hoje" value={stats.checkinsHoje} isLoading={loading} /><StatCard title="Recompensas (Últimos 30d)" value={stats.recompensasMes} isLoading={loading} /><StatCard title="Novos Clientes (Últimos 30d)" value={stats.novosClientesMes} isLoading={loading} /></div><div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8"><div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-xl font-bold mb-4 text-gray-700">Distribuição por Gênero</h3>{loading ? <div className="h-64 flex items-center justify-center"><Loader /></div> :<ResponsiveContainer width="100%" height={300}><PieChart><Pie data={chartData.gender} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>{chartData.gender.map((entry, index) => (<Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.name.toLowerCase()]} />))}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>}</div><div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-xl font-bold mb-4 text-gray-700">Distribuição por Faixa Etária</h3>{loading ? <div className="h-64 flex items-center justify-center"><Loader /></div> :<ResponsiveContainer width="100%" height={300}><BarChart data={chartData.age}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Clientes" fill={COR_AMARELO} /></BarChart></ResponsiveContainer>}</div></div></div>
    );
}

// --- Ecrã de Unidades ---
function TelaUnidades({ restaurants, loading, onAddRestaurant, onUpdateRestaurant }) {
    const [newRestaurantName, setNewRestaurantName] = useState("");
    const [editingRestaurant, setEditingRestaurant] = useState(null);

    const handleAddRestaurant = async (e) => {
        e.preventDefault();
        if (newRestaurantName.trim() === "") return;
        onAddRestaurant(newRestaurantName.trim());
        setNewRestaurantName("");
    };

    const handleSaveEdit = () => {
        if (!editingRestaurant) return;
        onUpdateRestaurant(editingRestaurant.id, {
            nome: editingRestaurant.nome,
            googleReviewLink: editingRestaurant.googleReviewLink || ""
        });
        setEditingRestaurant(null);
    };

    return (
        <div className="p-8"><h2 className="text-3xl font-bold mb-6 text-gray-800">Gerir Unidades</h2><div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto"><form onSubmit={handleAddRestaurant}><label htmlFor="new-restaurant" className="block text-sm font-medium text-gray-700">Nome da nova unidade</label><div className="mt-1 flex"><input type="text" id="new-restaurant" value={newRestaurantName} onChange={(e) => setNewRestaurantName(e.target.value)} className="form-input rounded-r-none" placeholder="Ex: Unidade Centro" /><button type="submit" className="btn-primary rounded-l-none">Adicionar</button></div></form></div><div className="mt-8 bg-white rounded-lg shadow-md"><h3 className="text-xl font-bold p-6">Unidades Existentes</h3><ul className="divide-y divide-gray-200">{loading ? <li className="p-4 text-center">A carregar...</li> : restaurants.map(r => <li key={r.id} className="p-4 flex justify-between items-center"><span>{r.nome}</span><button onClick={() => setEditingRestaurant({...r})} className="btn-secondary">Editar</button></li>)}</ul></div>
            {editingRestaurant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
                        <h3 className="text-2xl font-bold mb-4">Editar Unidade</h3>
                        <div className="space-y-4">
                            <div><label className="form-label">Nome da Unidade</label><input type="text" value={editingRestaurant.nome} onChange={e => setEditingRestaurant({...editingRestaurant, nome: e.target.value})} className="form-input"/></div>
                            <div><label className="form-label">Link de Avaliação do Google</label><input type="url" value={editingRestaurant.googleReviewLink || ""} onChange={e => setEditingRestaurant({...editingRestaurant, googleReviewLink: e.target.value})} className="form-input" placeholder="https://g.page/r/..." /></div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button onClick={() => setEditingRestaurant(null)} className="btn-secondary">Cancelar</button>
                            <button onClick={handleSaveEdit} className="btn-primary">Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


// --- Ecrã Campanhas ---
function TelaCampanhas({ restaurantId }) {
    const [aniversario, setAniversario] = useState({ ativa: false, diasAntes: 7, tituloEmail: '', corpoEmail: '' });
    const [sumidos, setSumidos] = useState({ ativa: false, diasSemCheckin: 30, tituloEmail: '', corpoEmail: '' });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const aniversarioRef = useMemo(() => restaurantId ? doc(db, `artifacts/${appId}/public/data/restaurants/${restaurantId}/campanhas/aniversario`) : null, [restaurantId]);
    const sumidosRef = useMemo(() => restaurantId ? doc(db, `artifacts/${appId}/public/data/restaurants/${restaurantId}/campanhas/sumidos`) : null, [restaurantId]);
    useEffect(() => {
        if (!restaurantId) { setLoading(false); return; }
        const fetchCampanhas = async () => {
            setLoading(true);
            try {
                const [aniversarioDoc, sumidosDoc] = await Promise.all([getDoc(aniversarioRef), getDoc(sumidosRef)]);
                if (aniversarioDoc.exists()) setAniversario(aniversarioDoc.data());
                if (sumidosDoc.exists()) setSumidos(sumidosDoc.data());
            } catch (error) { console.error("Erro ao buscar campanhas:", error); }
            setLoading(false);
        };
        fetchCampanhas();
    }, [restaurantId, aniversarioRef, sumidosRef]);
    const handleSave = async (campanhaRef, data) => { setLoading(true); setMessage(''); try { await setDoc(campanhaRef, data, { merge: true }); setMessage('Campanha salva com sucesso!'); setTimeout(() => setMessage(''), 3000); } catch (error) { setMessage('Erro ao salvar campanha.'); console.error(error); } setLoading(false); };
    if (!restaurantId) return <div className="p-8 text-center text-gray-500">Selecione uma unidade para gerir as campanhas.</div>;
    return (
        <div className="p-8"><h2 className="text-3xl font-bold mb-8 text-gray-800">Gestão de Campanhas</h2>{message && <p className={`mb-4 text-center p-2 rounded-md ${message.includes('Erro') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</p>}<div className="space-y-8"><div className="bg-white p-6 rounded-lg shadow-md"><div className="flex justify-between items-center"><h3 className="text-xl font-bold text-gray-700">Campanha de Aniversário</h3><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={aniversario.ativa} onChange={(e) => setAniversario({...aniversario, ativa: e.target.checked})} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-amarelo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vinho"></div><span className="ml-3 text-sm font-medium text-gray-900">{aniversario.ativa ? 'Ativa' : 'Inativa'}</span></label></div><div className={`mt-4 space-y-4 ${!aniversario.ativa && 'opacity-50 pointer-events-none'}`}><p className="text-sm text-gray-500">Enviar e-mail para o cliente X dias antes do seu aniversário.</p><div><label className="form-label">Enviar com quantos dias de antecedência?</label><input type="number" value={aniversario.diasAntes} onChange={e => setAniversario({...aniversario, diasAntes: Number(e.target.value)})} className="form-input w-48" /></div><div><label className="form-label">Título do E-mail</label><input type="text" value={aniversario.tituloEmail} onChange={e => setAniversario({...aniversario, tituloEmail: e.target.value})} className="form-input" /></div><div><label className="form-label">Corpo do E-mail</label><textarea rows="6" className="form-input" value={aniversario.corpoEmail} onChange={(e) => setAniversario({...aniversario, corpoEmail: e.target.value})} /></div></div><button onClick={() => handleSave(aniversarioRef, aniversario)} disabled={loading} className="mt-4 btn-primary">{loading ? 'A salvar...' : 'Salvar Campanha'}</button></div><div className="bg-white p-6 rounded-lg shadow-md"><div className="flex justify-between items-center"><h3 className="text-xl font-bold text-gray-700">Campanha "Estamos com Saudades"</h3><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={sumidos.ativa} onChange={(e) => setSumidos({...sumidos, ativa: e.target.checked})} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-amarelo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vinho"></div><span className="ml-3 text-sm font-medium text-gray-900">{sumidos.ativa ? 'Ativa' : 'Inativa'}</span></label></div><div className={`mt-4 space-y-4 ${!sumidos.ativa && 'opacity-50 pointer-events-none'}`}><p className="text-sm text-gray-500">Enviar e-mail para clientes que não fazem check-in há X dias.</p><div><label className="form-label">Enviar após quantos dias sem check-in?</label><input type="number" value={sumidos.diasSemCheckin} onChange={e => setSumidos({...sumidos, diasSemCheckin: Number(e.target.value)})} className="form-input w-48" /></div><div><label className="form-label">Título do E-mail</label><input type="text" value={sumidos.tituloEmail} onChange={e => setSumidos({...sumidos, tituloEmail: e.target.value})} className="form-input" /></div><div><label className="form-label">Corpo do E-mail</label><textarea rows="6" className="form-input" value={sumidos.corpoEmail} onChange={(e) => setSumidos({...sumidos, corpoEmail: e.target.value})} /></div></div><button onClick={() => handleSave(sumidosRef, sumidos)} disabled={loading} className="mt-4 btn-primary">{loading ? 'A salvar...' : 'Salvar Campanha'}</button></div></div></div>
    );
}

// --- Ecrã de Relatórios ---
function TelaRelatorios({ restaurantId }) {
    const [activeReport, setActiveReport] = useState('resumo');
    const [loading, setLoading] = useState(false);
    const reportContentRef = useRef(null);
    const [resumoData, setResumoData] = useState({ frequencia: [], recompensas: [] });
    const [clientesData, setClientesData] = useState([]);
    const [checkinsData, setCheckinsData] = useState([]);
    const [checkinFilters, setCheckinFilters] = useState({ nome: '', dataInicio: '', dataFim: '' });

    const fetchAllDataForReports = async () => {
        if (!restaurantId) return;
        setLoading(true);
        try {
            const basePath = `artifacts/${appId}/public/data/restaurants/${restaurantId}`;
            const clientesSnapshot = await getDocs(collection(db, `${basePath}/clientes`));
            const clientesList = clientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const clientesMap = new Map(clientesList.map(c => [c.id, c]));
            setClientesData(clientesList.map(c => ({...c, dataNascimento: formatarData(c.dataNascimento), dataCadastro: formatarData(c.dataCadastro) })));
            const checkinsSnapshot = await getDocs(collection(db, `${basePath}/checkins`));
            const frequenciaMap = new Map();
            checkinsSnapshot.forEach(doc => { const { clienteId } = doc.data(); frequenciaMap.set(clienteId, (frequenciaMap.get(clienteId) || 0) + 1); });
            const frequenciaData = Array.from(frequenciaMap.entries()).map(([id, count]) => ({ nome: clientesMap.get(id)?.nome || 'Desconhecido', checkins: count })).sort((a, b) => b.checkins - a.checkins);
            const recompensasQuery = query(collection(db, `${basePath}/recompensas`), where("status", "==", "utilizada"));
            const recompensasSnapshot = await getDocs(recompensasQuery);
            const recompensasData = recompensasSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, nomeCliente: clientesMap.get(doc.data().clienteId)?.nome || 'Desconhecido', dataResgate: formatarData(doc.data().dataResgate) }));
            setResumoData({ frequencia: frequenciaData, recompensas: recompensasData });
        } catch (error) { console.error("Erro ao gerar relatórios:", error); }
        setLoading(false);
    };

    const handleGenerateCheckinReport = async () => {
        if (!restaurantId) return;
        setLoading(true);
        try {
            const basePath = `artifacts/${appId}/public/data/restaurants/${restaurantId}`;
            let q = query(collection(db, `${basePath}/checkins`));
            if (checkinFilters.dataInicio) q = query(q, where('dataCheckin', '>=', new Date(checkinFilters.dataInicio)));
            if (checkinFilters.dataFim) q = query(q, where('dataCheckin', '<=', new Date(checkinFilters.dataFim)));
            const checkinsSnapshot = await getDocs(q);
            if (checkinsSnapshot.empty) { setCheckinsData([]); setLoading(false); return; }
            const clientesMap = new Map();
            const clienteIds = [...new Set(checkinsSnapshot.docs.map(d => d.data().clienteId))];
            if(clienteIds.length > 0) {
              const clientesQuery = query(collection(db, `${basePath}/clientes`), where('celular', 'in', clienteIds));
              const clientesSnapshot = await getDocs(clientesQuery);
              clientesSnapshot.forEach(doc => clientesMap.set(doc.id, doc.data()));
            }
            let reportData = checkinsSnapshot.docs.map(doc => {
                const data = doc.data(); const cliente = clientesMap.get(data.clienteId);
                return { nome: cliente?.nome || 'Desconhecido', cpf: cliente?.cpf || 'N/A', celular: cliente?.celular || 'N/A', dataCheckin: formatarData(data.dataCheckin) };
            });
            if (checkinFilters.nome) reportData = reportData.filter(item => item.nome.toLowerCase().includes(checkinFilters.nome.toLowerCase()));
            setCheckinsData(reportData);
        } catch (error) { console.error("Erro ao gerar relatório de check-ins:", error); setCheckinsData([]); }
        setLoading(false);
    };

    useEffect(() => { if (activeReport === 'resumo' && restaurantId) fetchAllDataForReports(); }, [activeReport, restaurantId]);
    const handlePrint = () => { window.print(); };

    if (!restaurantId) return <div className="p-8 text-center text-gray-500">Selecione uma unidade para ver os relatórios.</div>;
    const renderReport = () => {
        switch (activeReport) {
            case 'resumo': return <><div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div id="report-frequencia"><h3 className="text-xl font-bold mb-4 text-gray-700">Clientes Mais Frequentes</h3><div className="overflow-y-auto max-h-96"><table className="w-full table-auto"><thead className="bg-gray-50 sticky top-0"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total de Check-ins</th></tr></thead><tbody className="divide-y divide-gray-200">{resumoData.frequencia.map((item, index) => (<tr key={index}><td className="px-4 py-2 whitespace-nowrap">{item.nome}</td><td className="px-4 py-2 whitespace-nowrap font-bold">{item.checkins}</td></tr>))}</tbody></table></div><button onClick={() => exportToCsv('clientes_frequentes', resumoData.frequencia)} className="mt-4 btn-secondary"><IconDownload /> Exportar CSV</button></div><div id="report-recompensas"><h3 className="text-xl font-bold mb-4 text-gray-700">Recompensas Resgatadas</h3><div className="overflow-y-auto max-h-96"><table className="w-full table-auto"><thead className="bg-gray-50 sticky top-0"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data do Resgate</th></tr></thead><tbody className="divide-y divide-gray-200">{resumoData.recompensas.map(item => (<tr key={item.id}><td className="px-4 py-2 whitespace-nowrap">{item.nomeCliente}</td><td className="px-4 py-2 whitespace-nowrap">{item.dataResgate}</td></tr>))}</tbody></table></div><button onClick={() => exportToCsv('recompensas_resgatadas', resumoData.recompensas.map(({nomeCliente, dataResgate}) => ({nomeCliente, dataResgate})))} className="mt-4 btn-secondary"><IconDownload /> Exportar CSV</button></div></div></>;
            case 'clientes': return <div id="report-clientes"><h3 className="text-xl font-bold mb-4 text-gray-700">Relatório Completo de Clientes</h3><div className="overflow-auto max-h-[60vh]"><table className="w-full table-auto"><thead className="bg-gray-50 sticky top-0"><tr><th className="th-report">Nome</th><th className="th-report">Celular</th><th className="th-report">Email</th><th className="th-report">CPF</th><th className="th-report">Nascimento</th><th className="th-report">Cadastro</th></tr></thead><tbody className="divide-y divide-gray-200">{clientesData.map(c => (<tr key={c.id}><td className="td-report">{c.nome}</td><td className="td-report">{c.celular}</td><td className="td-report">{c.email}</td><td className="td-report">{c.cpf}</td><td className="td-report">{c.dataNascimento}</td><td className="td-report">{c.dataCadastro}</td></tr>))}</tbody></table></div><button onClick={() => exportToCsv('dados_clientes', clientesData.map(({nome, celular, email, cpf, dataNascimento, dataCadastro})=>({nome, celular, email, cpf, dataNascimento, dataCadastro})))} className="mt-4 btn-secondary"><IconDownload /> Exportar CSV</button></div>;
            case 'checkins': return <><h3 className="text-xl font-bold mb-4 text-gray-700">Histórico de Check-ins</h3><div className="bg-gray-50 p-4 rounded-md mb-4 flex items-end space-x-4"><div className="flex-1"><label className="form-label">Nome do Cliente</label><input type="text" className="form-input" value={checkinFilters.nome} onChange={e => setCheckinFilters({...checkinFilters, nome: e.target.value})} /></div><div><label className="form-label">De:</label><input type="date" className="form-input" value={checkinFilters.dataInicio} onChange={e => setCheckinFilters({...checkinFilters, dataInicio: e.target.value})} /></div><div><label className="form-label">Até:</label><input type="date" className="form-input" value={checkinFilters.dataFim} onChange={e => setCheckinFilters({...checkinFilters, dataFim: e.target.value})} /></div><button onClick={handleGenerateCheckinReport} className="btn-primary" disabled={loading}>{loading ? 'A gerar...' : 'Gerar'}</button></div><div id="report-checkins" className="overflow-auto max-h-[50vh]"><table className="w-full table-auto"><thead className="bg-gray-50 sticky top-0"><tr><th className="th-report">Nome</th><th className="th-report">CPF</th><th className="th-report">Celular</th><th className="th-report">Data do Check-in</th></tr></thead><tbody className="divide-y divide-gray-200">{checkinsData.map((item, index) => (<tr key={index}><td className="td-report">{item.nome}</td><td className="td-report">{item.cpf}</td><td className="td-report">{item.celular}</td><td className="td-report">{item.dataCheckin}</td></tr>))}</tbody></table>{checkinsData.length === 0 && <p className="text-center p-4 text-gray-500">Nenhum check-in encontrado para os filtros selecionados.</p>}</div>{checkinsData.length > 0 && <button onClick={() => exportToCsv('historico_checkins', checkinsData)} className="mt-4 btn-secondary"><IconDownload /> Exportar CSV</button>}</>;
            default: return null;
        }
    };
    return (<div className="p-8"><div className="flex justify-between items-center mb-8 print:hidden"><h2 className="text-3xl font-bold text-gray-800">Relatórios</h2><button onClick={handlePrint} className="btn-secondary"><IconPrint />Imprimir Relatório</button></div><div className="mb-6 border-b border-gray-200 print:hidden"><nav className="-mb-px flex space-x-8" aria-label="Tabs"><button onClick={() => setActiveReport('resumo')} className={`tab-btn ${activeReport === 'resumo' && 'tab-btn-active'}`}>Resumo</button><button onClick={() => setActiveReport('clientes')} className={`tab-btn ${activeReport === 'clientes' && 'tab-btn-active'}`}>Dados de Clientes</button><button onClick={() => setActiveReport('checkins')} className={`tab-btn ${activeReport === 'checkins' && 'tab-btn-active'}`}>Histórico de Check-ins</button></nav></div><div ref={reportContentRef} className="bg-white p-6 rounded-lg shadow-md printable-area">{loading ? <div className="flex justify-center items-center h-64"><Loader /></div> : renderReport()}</div></div>);
}

// --- Ecrã de Configurações ---
function TelaConfiguracoes({ restaurantId }) {
    const [selos, setSelos] = useState(12);
    const [validade, setValidade] = useState(30);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const configRef = useMemo(() => restaurantId ? doc(db, `artifacts/${appId}/public/data/restaurants/${restaurantId}/configuracoes/main`) : null, [restaurantId]);
    useEffect(() => {
        if (!configRef) { setLoading(false); return; }
        setLoading(true);
        const fetchConfig = async () => {
            try {
                const docSnap = await getDoc(configRef);
                if (docSnap.exists()) { setSelos(docSnap.data().selosParaRecompensa || 12); setValidade(docSnap.data().diasValidadeSelo || 30); } 
                else { setSelos(12); setValidade(30); }
            } catch (error) { console.error("Erro ao buscar configurações:", error); setMessage('Erro ao carregar dados.'); } finally { setLoading(false); }
        };
        fetchConfig();
    }, [configRef]);
    const handleSave = async () => {
        if (!configRef) return;
        setLoading(true); setMessage('');
        try { await setDoc(configRef, { selosParaRecompensa: Number(selos), diasValidadeSelo: Number(validade) }, { merge: true }); setMessage('Configurações salvas com sucesso!'); setTimeout(() => setMessage(''), 3000); } catch (error) { console.error("Erro ao salvar configurações:", error); setMessage('Erro ao salvar. Tente novamente.'); } finally { setLoading(false); }
    };
    if (!restaurantId) return <div className="p-8 text-center text-gray-500">Selecione uma unidade para definir as configurações.</div>;
    return (
        <div className="p-8"><h2 className="text-3xl font-bold mb-6 text-gray-800">Configurações do Programa</h2><div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto space-y-6"><div><label htmlFor="selos" className="block text-sm font-medium text-gray-700 mb-1">Selos para ganhar recompensa</label><input type="number" id="selos" value={selos} onChange={e => setSelos(e.target.value)} className="w-full p-3 border rounded-md focus:ring-2 focus:ring-vinho"/></div><div><label htmlFor="validade" className="block text-sm font-medium text-gray-700 mb-1">Validade de cada selo (em dias)</label><input type="number" id="validade" value={validade} onChange={e => setValidade(e.target.value)} className="w-full p-3 border rounded-md focus:ring-2 focus:ring-vinho"/></div><button onClick={handleSave} disabled={loading} className="w-full btn-primary">{loading ? 'A salvar...' : 'Salvar Configurações'}</button>{message && <p className={`mt-4 text-center ${message.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}</div></div>
    );
}

// --- Ecrã de Clientes ---
function TelaClientes({ restaurantId }) {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCliente, setSelectedCliente] = useState(null);

    const handleToggleComunicacao = async (clienteId, currentValue) => {
        const clienteRef = doc(db, `artifacts/${appId}/public/data/restaurants/${restaurantId}/clientes`, clienteId);
        try {
            await updateDoc(clienteRef, { aceitaComunicacao: !currentValue });
            setSelectedCliente(prev => ({...prev, aceitaComunicacao: !currentValue}));
        } catch (error) {
            console.error("Erro ao atualizar status de comunicação:", error);
            alert("Não foi possível atualizar o status. Tente novamente.");
        }
    };
    
    useEffect(() => {
        if (!restaurantId) { setLoading(false); return; }
        setLoading(true);
        const q = collection(db, `artifacts/${appId}/public/data/restaurants/${restaurantId}/clientes`);
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const clientesData = []; querySnapshot.forEach((doc) => { clientesData.push({ id: doc.id, ...doc.data() }); });
            setClientes(clientesData); setLoading(false);
        }, (error) => { console.error("Erro ao buscar clientes: ", error); setLoading(false); });
        return () => unsubscribe();
    }, [restaurantId]);
    const filteredClientes = useMemo(() => { return clientes.filter(cliente => cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) || cliente.celular.includes(searchTerm)); }, [clientes, searchTerm]);
    if (!restaurantId) return <div className="p-8 text-center text-gray-500">Selecione uma unidade para ver os clientes.</div>;
    return (
        <div className="p-8"><h2 className="text-3xl font-bold mb-6 text-gray-800">Gestão de Clientes</h2><div className="mb-4 relative"><input type="text" placeholder="Buscar por nome ou celular..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 border rounded-md focus:ring-2 focus:ring-vinho"/><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><IconSearch /></div></div><div className="bg-white rounded-lg shadow-md overflow-hidden">{loading ? <div className="flex justify-center items-center h-64"><Loader /></div> : <table className="w-full table-auto"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Celular</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selos Válidos</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Cadastro</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{filteredClientes.map(cliente => (<tr key={cliente.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedCliente(cliente)}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cliente.nome}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.celular}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{cliente.selosValidos || 0}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatarData(cliente.dataCadastro)}</td></tr>))}</tbody></table>}{filteredClientes.length === 0 && !loading && <p className="text-center p-8 text-gray-500">Nenhum cliente encontrado.</p>}</div>{selectedCliente && (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"><div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-full overflow-y-auto"><div className="flex justify-between items-center mb-4"><h3 className="text-2xl font-bold">{selectedCliente.nome}</h3><button onClick={() => setSelectedCliente(null)}><IconClose /></button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700"><p><strong>Celular:</strong> {selectedCliente.celular}</p><p><strong>Email:</strong> {selectedCliente.email}</p><p><strong>CPF:</strong> {selectedCliente.cpf}</p><p><strong>Data de Nascimento:</strong> {formatarData(selectedCliente.dataNascimento)}</p><p><strong>Sexo:</strong> {selectedCliente.sexo}</p><p><strong>Cadastro em:</strong> {formatarData(selectedCliente.dataCadastro)}</p><p className="md:col-span-2"><strong>Selos Válidos:</strong> <span className="font-bold text-lg text-vinho">{selectedCliente.selosValidos || 0}</span></p><div className="md:col-span-2 flex items-center justify-between bg-gray-50 p-3 rounded-lg"><span className="font-medium text-gray-700">Aceita receber comunicações?</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={selectedCliente.aceitaComunicacao} onChange={() => handleToggleComunicacao(selectedCliente.id, selectedCliente.aceitaComunicacao)} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-amarelo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vinho"></div></label></div></div><button onClick={() => setSelectedCliente(null)} className="mt-6 w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300">Fechar</button></div></div>)}</div>
    );
}

// --- Ecrã NPS ---
function TelaNPS({ restaurantId }) {
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('todos');

    useEffect(() => {
        if (!restaurantId) { setLoading(false); return; }
        const fetchNPSData = async () => {
            setLoading(true);
            try {
                const basePath = `artifacts/${appId}/public/data/restaurants/${restaurantId}`;
                const npsSnapshot = await getDocs(collection(db, `${basePath}/nps`));
                const npsResponses = npsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const clientesMap = new Map();
                if (npsResponses.length > 0) {
                    const clienteIds = [...new Set(npsResponses.map(res => res.clienteId))];
                    const clientesQuery = query(collection(db, `${basePath}/clientes`), where('celular', 'in', clienteIds));
                    const clientesSnapshot = await getDocs(clientesQuery);
                    clientesSnapshot.forEach(doc => clientesMap.set(doc.id, doc.data().nome));
                }
                
                const populatedResponses = npsResponses.map(res => ({ ...res, nomeCliente: clientesMap.get(res.clienteId) || 'Desconhecido' }));
                setResponses(populatedResponses);
            } catch (error) { console.error("Erro ao carregar dados de NPS:", error); }
            setLoading(false);
        };
        fetchNPSData();
    }, [restaurantId]);

    const { npsScore, promoters, passives, detractors } = useMemo(() => {
        const total = responses.length;
        if (total === 0) return { npsScore: 0, promoters: 0, passives: 0, detractors: 0 };
        const promotersCount = responses.filter(r => r.score >= 9).length;
        const detractorsCount = responses.filter(r => r.score <= 6).length;
        const passivesCount = total - promotersCount - detractorsCount;
        const npsScore = Math.round(((promotersCount / total) - (detractorsCount / total)) * 100);
        return { npsScore, promoters: promotersCount, passives: passivesCount, detractors: detractorsCount };
    }, [responses]);

    const filteredResponses = useMemo(() => {
        if (filter === 'todos') return responses;
        if (filter === 'promotores') return responses.filter(r => r.score >= 9);
        if (filter === 'passivos') return responses.filter(r => r.score >= 7 && r.score <= 8);
        if (filter === 'detratores') return responses.filter(r => r.score <= 6);
        return [];
    }, [responses, filter]);
    
    if (!restaurantId) return <div className="p-8 text-center text-gray-500">Selecione uma unidade para ver o NPS.</div>;
    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Pesquisa de Satisfação (NPS)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">NPS Score</h3>
                    <p className={`text-5xl font-bold mt-1 ${npsScore > 50 ? 'text-green-500' : npsScore > 0 ? 'text-yellow-500' : 'text-red-500'}`}>{loading ? '...' : npsScore}</p>
                </div>
                <StatCard title="Promotores (9-10)" value={promoters} isLoading={loading} />
                <StatCard title="Passivos (7-8)" value={passives} isLoading={loading} />
                <StatCard title="Detratores (0-6)" value={detractors} isLoading={loading} />
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4 text-gray-700">Respostas Recebidas</h3>
                <div className="flex space-x-2 border-b mb-4">
                    <button onClick={() => setFilter('todos')} className={`tab-btn ${filter === 'todos' && 'tab-btn-active'}`}>Todos</button>
                    <button onClick={() => setFilter('promotores')} className={`tab-btn ${filter === 'promotores' && 'tab-btn-active'}`}>Promotores</button>
                    <button onClick={() => setFilter('passivos')} className={`tab-btn ${filter === 'passivos' && 'tab-btn-active'}`}>Passivos</button>
                    <button onClick={() => setFilter('detratores')} className={`tab-btn ${filter === 'detratores' && 'tab-btn-active'}`}>Detratores</button>
                </div>
                 <div className="overflow-auto max-h-[60vh]">
                    <table className="w-full table-auto">
                        <thead className="bg-gray-50 sticky top-0"><tr><th className="th-report">Cliente</th><th className="th-report">Nota</th><th className="th-report">Comentário</th><th className="th-report">Data</th></tr></thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? <tr><td colSpan="4" className="text-center p-8"><Loader/></td></tr> :
                             filteredResponses.map(res => (
                                <tr key={res.id}>
                                    <td className="td-report">{res.nomeCliente}</td>
                                    <td className="td-report text-center"><span className={`font-bold px-3 py-1 rounded-full text-white ${res.score >= 9 ? 'bg-green-500' : res.score >= 7 ? 'bg-yellow-500' : 'bg-red-500'}`}>{res.score}</span></td>
                                    <td className="td-report">{res.comment}</td>
                                    <td className="td-report">{formatarData(res.dataResposta)}</td>
                                </tr>
                            ))}
                             {filteredResponses.length === 0 && !loading && <tr><td colSpan="4" className="text-center p-8 text-gray-500">Nenhuma resposta encontrada.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}


// --- Componente Principal ---
export default function App() {
    const [currentView, setCurrentView] = useState('dashboard');
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
    const [loadingRestaurants, setLoadingRestaurants] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            if (Object.keys(firebaseConfig).length === 0) {
                throw new Error("Configuração do Firebase não foi encontrada. Verifique as variáveis de ambiente na Netlify ou o ficheiro de configuração local.");
            }
            const app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            const auth = getAuth(app);
            const performAuth = async () => {
                if (initialAuthToken) { await signInWithCustomToken(auth, initialAuthToken); } else { await signInAnonymously(auth); }
                setIsAuthReady(true);
            };
            performAuth();
        } catch (e) { 
            console.error("Erro na inicialização do Firebase no Admin:", e);
            setError(e.message);
        }
    }, []);

    useEffect(() => {
        if (!isAuthReady) return;
        setLoadingRestaurants(true);
        const restaurantsColRef = collection(db, `artifacts/${appId}/public/data/restaurants`);
        const unsubscribe = onSnapshot(restaurantsColRef, (snapshot) => {
            const restList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRestaurants(restList);
            if (restList.length > 0 && !selectedRestaurantId) {
                setSelectedRestaurantId(restList[0].id);
            }
            if (restList.length === 0 && currentView !== 'unidades') {
                setCurrentView('unidades');
            }
            setLoadingRestaurants(false);
        }, (err) => {
            console.error("Erro ao buscar unidades:", err);
            setError("Não foi possível carregar os dados das unidades.");
            setLoadingRestaurants(false);
        });
        return () => unsubscribe();
    }, [isAuthReady]);
    
    const handleSelectRestaurant = (id) => { setSelectedRestaurantId(id); };
    const handleAddRestaurant = async (restaurantName) => { await addDoc(collection(db, `artifacts/${appId}/public/data/restaurants`), { nome: restaurantName, googleReviewLink: '' }); };
    const handleUpdateRestaurant = async (id, data) => { const restRef = doc(db, `artifacts/${appId}/public/data/restaurants`, id); await updateDoc(restRef, data); };
    
    if (error) {
        return <div className="p-8 text-center text-red-500 font-bold">Erro: {error}</div>;
    }

    if (!isAuthReady) {
        return (<div className="flex justify-center items-center h-screen bg-gray-100"><div className="text-center"><Loader /><p className="mt-4 text-gray-600">A autenticar e carregar dados...</p></div></div>);
    }
    
    const views = {
        dashboard: <TelaDashboard restaurantId={selectedRestaurantId} />,
        unidades: <TelaUnidades restaurants={restaurants} loading={loadingRestaurants} onAddRestaurant={handleAddRestaurant} onUpdateRestaurant={handleUpdateRestaurant} />,
        clientes: <TelaClientes restaurantId={selectedRestaurantId} />,
        configuracoes: <TelaConfiguracoes restaurantId={selectedRestaurantId} />,
        relatorios: <TelaRelatorios restaurantId={selectedRestaurantId} />,
        campanhas: <TelaCampanhas restaurantId={selectedRestaurantId} />,
        nps: <TelaNPS restaurantId={selectedRestaurantId} />,
    };
    
    const NavItem = ({ view, label, icon, currentView, setCurrentView }) => (
        <li className={`p-4 cursor-pointer flex items-center space-x-3 print:hidden ${currentView === view ? 'bg-amarelo/20 border-l-4 border-vinho text-vinho font-bold' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setCurrentView(view)}>
            {icon}
            <span>{label}</span>
        </li>
    );

    return (
        <>
            <style>{`
                :root {
                    --cor-vinho: ${COR_VINHO};
                    --cor-amarelo: ${COR_AMARELO};
                }
                .bg-vinho { background-color: var(--cor-vinho); }
                .text-vinho { color: var(--cor-vinho); }
                .border-vinho { border-color: var(--cor-vinho); }
                .ring-vinho:focus { --tw-ring-color: var(--cor-vinho); }
                .peer-checked\\:bg-vinho:checked { background-color: var(--cor-vinho); }

                .bg-amarelo { background-color: var(--cor-amarelo); }
                .text-amarelo { color: var(--cor-amarelo); }
                .border-amarelo { border-color: var(--cor-amarelo); }
                .ring-amarelo-300:focus { --tw-ring-color: #FBBF24; }
                .bg-amarelo\\/20 { background-color: #D59A1D33; }
                
                @media print {
                  body * { visibility: hidden; }
                  .printable-area, .printable-area * { visibility: visible; }
                  .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
                }
                .form-input { @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinho; }
                .form-label { @apply block text-sm font-medium text-gray-700 mb-1; }
                .btn-primary { @apply px-4 py-2 bg-vinho text-white font-semibold rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vinho disabled:opacity-50; }
                .btn-secondary { @apply inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400; }
                .tab-btn { @apply whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300; }
                .tab-btn-active { @apply border-vinho text-vinho; }
                .th-report { @apply px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase; }
                .td-report { @apply px-4 py-2 whitespace-nowrap text-sm text-gray-700; }
            `}</style>
            <div className="min-h-screen bg-gray-100 flex">
                <nav className="w-64 bg-white shadow-md flex flex-col print:hidden">
                    <div className="p-4 flex justify-center">
                        <img src={LOGO_URL} alt="Logomarca Isto e aQuilo" className="h-20" />
                    </div>
                    <RestaurantSelector restaurants={restaurants} selectedId={selectedRestaurantId} onSelect={handleSelectRestaurant} loading={loadingRestaurants} />
                    <ul className="flex-grow">
                        <NavItem view="dashboard" label="Dashboard" icon={<IconDashboard />} currentView={currentView} setCurrentView={setCurrentView} />
                        <NavItem view="unidades" label="Unidades" icon={<IconBuildingStore />} currentView={currentView} setCurrentView={setCurrentView} />
                        <NavItem view="clientes" label="Clientes" icon={<IconUserGroup />} currentView={currentView} setCurrentView={setCurrentView} />
                        <NavItem view="nps" label="NPS" icon={<IconNPS />} currentView={currentView} setCurrentView={setCurrentView} />
                        <NavItem view="campanhas" label="Campanhas" icon={<IconCampaign />} currentView={currentView} setCurrentView={setCurrentView} />
                        <NavItem view="relatorios" label="Relatórios" icon={<IconChartBar />} currentView={currentView} setCurrentView={setCurrentView} />
                        <NavItem view="configuracoes" label="Configurações" icon={<IconCog />} currentView={currentView} setCurrentView={setCurrentView} />
                    </ul>
                </nav>
                <main className="flex-1 overflow-y-auto">
                    {loadingRestaurants ? <div className="p-8 text-center"><Loader/></div> : views[currentView]}
                </main>
            </div>
        </>
    );
}