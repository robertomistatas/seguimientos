import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    signInAnonymously,
    signInWithCustomToken
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    addDoc, 
    query, 
    where, 
    getDocs,
    onSnapshot
} from 'firebase/firestore';

// --- CONTEXTO DE AUTENTICACIÓN ---
const AuthContext = createContext(null);

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfigString = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
const firebaseConfig = JSON.parse(firebaseConfigString);

// --- INICIALIZACIÓN DE FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- COMPONENTES DE LA UI (Iconos, etc.) ---

const IconWrapper = ({ children }) => <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">{children}</div>;

const StatCard = ({ title, value, icon, color }) => (
    <div className={`p-6 rounded-2xl shadow-lg flex flex-col items-start ${color}`}>
        <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-white bg-opacity-30">
            {icon}
        </div>
        <p className="text-lg font-medium text-white text-opacity-80">{title}</p>
        <p className="text-4xl font-bold text-white">{value}</p>
    </div>
);

const BeneficiaryCard = ({ beneficiary, status }) => {
    const { CheckCircle, AlertTriangle, XCircle } = window.lucide;

    const statusConfig = {
        'Al día': { color: 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-700', icon: <CheckCircle className="text-green-500" /> },
        'Pendiente': { color: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600', icon: <AlertTriangle className="text-yellow-500" /> },
        'Urgente': { color: 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-600', icon: <XCircle className="text-red-500" /> }
    };

    const config = statusConfig[status] || statusConfig['Urgente'];

    return (
        <div className={`p-4 border-l-4 ${config.color} rounded-lg shadow-md flex items-center justify-between`}>
            <div>
                <p className="font-bold text-gray-800 dark:text-gray-100">{beneficiary.nombre}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{beneficiary.comuna}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Último contacto: {beneficiary.ultimoLlamadoExitoso || 'N/A'}</p>
            </div>
            <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{status}</span>
                {config.icon}
            </div>
        </div>
    );
};


// --- MÓDULO: DASHBOARD ---
const Dashboard = () => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } = window.Recharts;
    const { CheckCircle, Clock, Phone, Users } = window.lucide;

    // Datos de ejemplo para las gráficas. Deberían venir de Firestore.
    const callsByOperator = [
        { name: 'Ana', llamadas: 120, tiempo: 480 },
        { name: 'Juan', llamadas: 98, tiempo: 350 },
        { name: 'Maria', llamadas: 150, tiempo: 600 },
        { name: 'Pedro', llamadas: 80, tiempo: 320 },
    ];

    const callsByDay = [
        { day: 'Lun', llamadas: 50 },
        { day: 'Mar', llamadas: 65 },
        { day: 'Mié', llamadas: 80 },
        { day: 'Jue', llamadas: 72 },
        { day: 'Vie', llamadas: 95 },
    ];
    
    const callResults = [
        { name: 'Exitosos', value: 462 },
        { name: 'Sin Respuesta', value: 88 },
    ];
    const COLORS = ['#4ade80', '#f87171'];


    return (
        <div className="p-4 sm:p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard de Rendimiento</h1>
            
            {/* Métricas Clave */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Llamados Exitosos" value="462" icon={<CheckCircle size={24} className="text-white" />} color="bg-gradient-to-br from-green-400 to-green-600" />
                <StatCard title="Tiempo Total (min)" value="1,800" icon={<Clock size={24} className="text-white" />} color="bg-gradient-to-br from-blue-400 to-blue-600" />
                <StatCard title="Promedio Llamada (min)" value="3.9" icon={<Phone size={24} className="text-white" />} color="bg-gradient-to-br from-purple-400 to-purple-600" />
                <StatCard title="Beneficiarios Activos" value="125" icon={<Users size={24} className="text-white" />} color="bg-gradient-to-br from-yellow-400 to-yellow-600" />
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Llamadas por Teleoperadora</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={callsByOperator}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '0.75rem' }} />
                            <Legend />
                            <Bar dataKey="llamadas" fill="#8884d8" name="Nº de Llamadas" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Distribución Diaria</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={callsByDay}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="day" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '0.75rem' }} />
                            <Bar dataKey="llamadas" fill="#82ca9d" name="Llamadas" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Resultados de Llamadas</h2>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={callResults}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {callResults.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '0.75rem' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// --- MÓDULO: REGISTRO DE LLAMADAS ---
const RegistroLlamadas = () => {
    const [file, setFile] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
        }
    };

    const processFile = async () => {
        if (!file) {
            setError('Por favor, selecciona un archivo Excel.');
            return;
        }
        setLoading(true);
        setError('');
        setAnalysis(null);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                // Usar el objeto global XLSX cargado por el script
                const workbook = window.XLSX.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                const headers = jsonData[0];
                const rows = jsonData.slice(1);

                const parsedData = rows.map(row => {
                    let rowData = {};
                    headers.forEach((header, index) => {
                        rowData[header] = row[index];
                    });
                    return rowData;
                });
                
                setData(parsedData);
                analyzeData(parsedData);

            } catch (err) {
                console.error("Error al procesar el archivo:", err);
                setError('Hubo un error al leer el archivo. Asegúrate de que tenga el formato correcto.');
            } finally {
                setLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };
    
    const analyzeData = (parsedData) => {
        let totalCalls = parsedData.length;
        let incoming = 0;
        let outgoing = 0;
        let successful = 0;
        let totalDurationSeconds = 0;
        let unidentified = 0;
        
        parsedData.forEach(call => {
            if(call.Evento === 'Entrante') incoming++;
            if(call.Evento === 'Saliente') outgoing++;
            if(call.Resultado === 'Llamado exitoso') {
                successful++;
                totalDurationSeconds += (call.Seg || 0);
            }
            if(call.Beneficiario === 'No identificado') unidentified++;
        });

        const avgDurationMinutes = successful > 0 ? (totalDurationSeconds / successful / 60).toFixed(2) : 0;
        
        setAnalysis({
            totalCalls,
            incoming,
            outgoing,
            successful,
            unidentified,
            avgDurationMinutes
        });
    }

    return (
        <div className="p-4 sm:p-8 space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Registro de Llamadas</h1>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Subir Archivo de Llamadas</h2>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <label className="w-full sm:w-auto px-5 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer text-center">
                        <span className="text-blue-500 font-semibold">Seleccionar Excel</span>
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileChange} />
                    </label>
                    {file && <span className="text-gray-600 dark:text-gray-300">{file.name}</span>}
                    <button
                        onClick={processFile}
                        disabled={!file || loading}
                        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Procesando...' : 'Analizar Archivo'}
                    </button>
                </div>
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>

            {analysis && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Resultados del Análisis</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Llamadas</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{analysis.totalCalls}</p>
                        </div>
                         <div className="p-4 bg-green-50 dark:bg-green-900/50 rounded-lg">
                            <p className="text-sm text-green-600 dark:text-green-300">Exitosas</p>
                            <p className="text-2xl font-bold text-green-800 dark:text-green-200">{analysis.successful}</p>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                            <p className="text-sm text-blue-600 dark:text-blue-300">Duración Prom. (min)</p>
                            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{analysis.avgDurationMinutes}</p>
                        </div>
                         <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Entrantes</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{analysis.incoming}</p>
                        </div>
                         <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Salientes</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{analysis.outgoing}</p>
                        </div>
                         <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg">
                            <p className="text-sm text-yellow-600 dark:text-yellow-300">No Identificados</p>
                            <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{analysis.unidentified}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MÓDULO: ASIGNACIONES ---
const Asignaciones = () => {
    // Lógica para cargar, mostrar y editar asignaciones desde Firestore
    return (
        <div className="p-4 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Asignaciones de Beneficiarios</h1>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <p className="text-gray-600 dark:text-gray-300">Módulo en construcción. Aquí se podrán cargar y gestionar las listas de beneficiarios asignados a cada teleoperadora.</p>
                {/* Ejemplo de UI */}
                <div className="mt-4">
                    <button className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                        Cargar Asignaciones (CSV/Excel)
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MÓDULO: HISTORIAL DE SEGUIMIENTOS ---
const HistorialSeguimientos = () => {
    // Datos de ejemplo. Deberían venir de un análisis cruzado en Firestore.
    const beneficiaries = [
        { id: 1, nombre: 'Juan Pérez', comuna: 'Santiago', ultimoLlamadoExitoso: '2025-07-05' },
        { id: 2, nombre: 'Maria González', comuna: 'Providencia', ultimoLlamadoExitoso: '2025-06-20' },
        { id: 3, nombre: 'Pedro Soto', comuna: 'Las Condes', ultimoLlamadoExitoso: '2025-05-10' },
        { id: 4, nombre: 'Ana López', comuna: 'Santiago', ultimoLlamadoExitoso: '2025-07-01' },
    ];

    const getStatus = (lastCallDate) => {
        if (!lastCallDate) return 'Urgente';
        const today = new Date();
        const lastCall = new Date(lastCallDate);
        const diffDays = Math.ceil((today - lastCall) / (1000 * 60 * 60 * 24));

        if (diffDays <= 15) return 'Al día';
        if (diffDays <= 30) return 'Pendiente';
        return 'Urgente';
    };

    return (
        <div className="p-4 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Historial de Seguimientos</h1>
            
            {/* Filtros */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg mb-6 flex flex-wrap gap-4 items-center">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">Filtrar por:</h3>
                <select className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                    <option>Comuna</option>
                    <option>Santiago</option>
                    <option>Providencia</option>
                </select>
                <select className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                    <option>Estado</option>
                    <option>Al día</option>
                    <option>Pendiente</option>
                    <option>Urgente</option>
                </select>
                 <select className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                    <option>Teleoperadora</option>
                    <option>Ana</option>
                    <option>Juan</option>
                </select>
            </div>

            {/* Lista de Beneficiarios */}
            <div className="space-y-4">
                {beneficiaries.map(b => (
                    <BeneficiaryCard key={b.id} beneficiary={b} status={getStatus(b.ultimoLlamadoExitoso)} />
                ))}
            </div>
        </div>
    );
};


// --- COMPONENTE DE LOGIN ---
const Login = ({ setAuthReady }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged se encargará de actualizar el estado de la app
        } catch (err) {
            setError('Error al iniciar sesión. Revisa tus credenciales.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    // Función para crear un usuario (ejemplo, podría estar en una página de registro)
    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Asignar un rol por defecto al nuevo usuario
            await setDoc(doc(db, "users", userCredential.user.uid), {
                email: userCredential.user.email,
                role: "teleoperadora" // Rol por defecto
            });
        } catch (err) {
            setError('Error al registrar el usuario.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mistatas</h1>
                    <p className="text-gray-500 dark:text-gray-400">Seguimiento de Llamadas</p>
                </div>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                        >
                            {loading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </div>
                     <div className="text-center">
                        <button type="button" onClick={handleSignUp} className="text-sm text-blue-500 hover:underline">
                            Crear cuenta de prueba (teleoperadora)
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DE LA APP ---
function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [scriptsReady, setScriptsReady] = useState(false);
    const [scriptError, setScriptError] = useState(null);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const loadScript = (src, id) => {
            return new Promise((resolve, reject) => {
                const existingScript = document.getElementById(id);
                if (existingScript) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.id = id;
                script.src = src;
                script.async = true;
                script.onload = resolve;
                script.onerror = () => reject(new Error(`Error al cargar el script: ${src}`));
                document.body.appendChild(script);
            });
        };

        Promise.all([
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'xlsx-script'),
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/recharts/2.12.7/Recharts.min.js', 'recharts-script'),
            loadScript('https://unpkg.com/lucide-react/dist/umd/lucide-react.js', 'lucide-script')
        ]).then(() => {
            setScriptsReady(true);
        }).catch(error => {
            console.error("Error al cargar los scripts:", error);
            setScriptError(error.message);
        });

        const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setUserData({ uid: firebaseUser.uid, ...userDocSnap.data() });
                } else {
                    const defaultUserData = { email: firebaseUser.email, role: 'teleoperadora' };
                    await setDoc(userDocRef, defaultUserData);
                    setUserData({ uid: firebaseUser.uid, ...defaultUserData });
                }
                setUser(firebaseUser);
            } else {
                setUser(null);
                setUserData(null);
            }
            setAuthReady(true);
        });

        return () => authUnsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard />;
            case 'registro':
                return <RegistroLlamadas />;
            case 'asignaciones':
                return <Asignaciones />;
            case 'historial':
                return <HistorialSeguimientos />;
            default:
                return <Dashboard />;
        }
    };
    
    if (scriptError) {
        return <div className="flex items-center justify-center min-h-screen bg-red-100 text-red-700"><p>{scriptError}</p></div>;
    }

    if (!authReady || !scriptsReady) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900"><div className="text-xl dark:text-white">Cargando aplicación...</div></div>;
    }

    if (!user) {
        return <Login setAuthReady={setAuthReady} />;
    }
    
    const { XCircle, BarChart2, Upload, Users, History, LogOut } = window.lucide;

    const NavLink = ({ page, icon, children }) => (
        <button
            onClick={() => {
                setCurrentPage(page)
                setSidebarOpen(false)
            }}
            className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors ${
                currentPage === page 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
            {icon}
            <span className="ml-4 font-medium">{children}</span>
        </button>
    );

    return (
        <AuthContext.Provider value={{ user, userData }}>
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
                {/* Sidebar */}
                 <aside className={`absolute lg:relative z-20 w-64 h-full px-6 py-4 overflow-y-auto bg-white dark:bg-gray-800 border-r dark:border-gray-700 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 ease-in-out`}>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Mistatas</h2>
                        <button className="lg:hidden text-gray-600 dark:text-gray-300" onClick={() => setSidebarOpen(false)}>
                            <XCircle />
                        </button>
                    </div>
                    <nav className="space-y-3">
                        <NavLink page="dashboard" icon={<BarChart2 />}>Dashboard</NavLink>
                        <NavLink page="registro" icon={<Upload />}>Registro Llamadas</NavLink>
                        <NavLink page="asignaciones" icon={<Users />}>Asignaciones</NavLink>
                        <NavLink page="historial" icon={<History />}>Historial</NavLink>
                    </nav>
                    <div className="absolute bottom-0 left-0 w-full p-6">
                         <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm font-medium text-gray-800 dark:text-white">{userData?.email}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userData?.role}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-3 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg"
                        >
                            <LogOut />
                            <span className="ml-4 font-medium">Cerrar Sesión</span>
                        </button>
                    </div>
                </aside>

                {/* Contenido Principal */}
                <div className="flex-1 flex flex-col overflow-hidden">
                     <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 lg:hidden">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white capitalize">{currentPage}</h2>
                        <button onClick={() => setSidebarOpen(true)} className="text-gray-600 dark:text-gray-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                    </header>
                    <main className="flex-1 overflow-x-hidden overflow-y-auto">
                        {renderPage()}
                    </main>
                </div>
            </div>
        </AuthContext.Provider>
    );
}

export default App;
