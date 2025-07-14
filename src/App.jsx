import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
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
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    CheckCircle, AlertTriangle, XCircle, Clock, Phone, Users, BarChart2, Upload, History, LogOut,
    ChevronDown, ChevronUp
} from 'lucide-react';

// --- CONTEXTO DE AUTENTICACIÓN ---
const AuthContext = createContext(null);

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyASPhkFj4RwmmloxSgJzK3JhXD7-qz2yxk",
  authDomain: "teleasistencia-6c0fd.firebaseapp.com",
  projectId: "teleasistencia-6c0fd",
  storageBucket: "teleasistencia-6c0fd.firebasestorage.app",
  messagingSenderId: "551971576400",
  appId: "1:551971576400:web:952333e1409c2ecdaf8f55",
  measurementId: "G-4Z9KWG6JJS"
};

// --- INICIALIZACIÓN DE FIREBASE ---
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
// NOTA: Asegúrate de que tus reglas de seguridad de Firestore permitan escrituras
// en la colección 'users' para los usuarios autenticados. Ejemplo:
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /users/{userId} {
//       allow read, write: if request.auth != null && request.auth.uid == userId;
//     }
//     // Reglas para otras colecciones
//   }
// }

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
                <StatCard title="Tiempo Total (min)" value="1,800" icon={<Clock size={24} className="text-white" />} color="bg-gradient-to-br from-blue-400 to blue-600" />
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
    const [data, setData] = useState(() => {
        const savedData = localStorage.getItem('llamadasData');
        return savedData ? JSON.parse(savedData) : [];
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState(() => {
        const savedAnalysis = localStorage.getItem('llamadasAnalysis');
        return savedAnalysis ? JSON.parse(savedAnalysis) : null;
    });

    // Guardar datos en localStorage cuando cambien
    useEffect(() => {
        if (data.length > 0) {
            localStorage.setItem('llamadasData', JSON.stringify(data));
        }
    }, [data]);

    useEffect(() => {
        if (analysis) {
            localStorage.setItem('llamadasAnalysis', JSON.stringify(analysis));
        }
    }, [analysis]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
        }
    };

    const handleClearData = () => {
        setData([]);
        setAnalysis(null);
        setFile(null);
        localStorage.removeItem('llamadasData');
        localStorage.removeItem('llamadasAnalysis');
    };

    const processFile = async () => {
        if (!file) {
            setError('Por favor, selecciona un archivo Excel.');
            return;
        }
        setLoading(true);
        setError('');
        // Limpiar datos anteriores antes de procesar el nuevo archivo
        setData([]);
        setAnalysis(null);
        localStorage.removeItem('llamadasData');
        localStorage.removeItem('llamadasAnalysis');

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
        
        const newAnalysis = {
            totalCalls,
            incoming,
            outgoing,
            successful,
            unidentified,
            avgDurationMinutes
        };
        
        setAnalysis(newAnalysis);
    }

    return (
        <div className="p-4 sm:p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Registro de Llamadas</h1>
                {(data.length > 0 || analysis) && (
                    <button
                        onClick={handleClearData}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
                    >
                        Eliminar Datos
                    </button>
                )}
            </div>
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

            {data.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg overflow-auto">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Detalle de Llamadas</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    {Object.keys(data[0]).map((header, index) => (
                                        <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {data.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {Object.values(row).map((cell, cellIndex) => (
                                            <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MÓDULO: ASIGNACIONES ---
const Asignaciones = () => {
    const [showNewOperatorForm, setShowNewOperatorForm] = useState(false);
    const [operators, setOperators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOperator, setSelectedOperator] = useState(null);
    const [file, setFile] = useState(null);
    const [fileLoading, setFileLoading] = useState(false);
    const [fileError, setFileError] = useState('');
    // Nuevo estado para manejar qué operadores tienen su lista expandida
    const [expandedOperators, setExpandedOperators] = useState({});

    // Toggle para expandir/colapsar la lista de beneficiarios
    const toggleOperatorExpansion = (operatorId) => {
        setExpandedOperators(prev => ({
            ...prev,
            [operatorId]: !prev[operatorId]
        }));
    };

    // Formulario para nuevo operador
    const [newOperator, setNewOperator] = useState({
        nombre: '',
        email: '',
        telefono: ''
    });

    // Cargar teleoperadores al montar el componente
    useEffect(() => {
        const loadOperators = async () => {
            try {
                const operatorsRef = collection(db, 'operators');
                const snapshot = await getDocs(operatorsRef);
                const operatorsList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setOperators(operatorsList);
            } catch (err) {
                console.error('Error al cargar teleoperadores:', err);
                setError('Error al cargar la lista de teleoperadores');
            } finally {
                setLoading(false);
            }
        };

        loadOperators();
    }, []);

    // Crear nuevo operador
    const handleCreateOperator = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const operatorsRef = collection(db, 'operators');
            const docRef = await addDoc(operatorsRef, {
                ...newOperator,
                createdAt: new Date().toISOString(),
                beneficiarios: []
            });

            setOperators([...operators, { id: docRef.id, ...newOperator }]);
            setShowNewOperatorForm(false);
            setNewOperator({ nombre: '', email: '', telefono: '' });
        } catch (err) {
            console.error('Error al crear teleoperador:', err);
            setError('Error al crear el teleoperador');
        } finally {
            setLoading(false);
        }
    };

    // Procesar archivo Excel
    const processFile = async () => {
        if (!file || !selectedOperator) {
            setFileError('Por favor, selecciona un archivo Excel y un teleoperador');
            return;
        }

        setFileLoading(true);
        setFileError('');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const workbook = window.XLSX.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                // Cambiamos la forma en que obtenemos los datos del Excel
                const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { 
                    header: ["Nombre", "Teléfono", "Comuna"],
                    range: 1  // Empezar desde la segunda fila (ignorar headers)
                });

                // Validar y procesar datos
                const processedData = jsonData
                    .filter(row => row.Nombre && row.Teléfono && row.Comuna) // Asegurarnos que tengan los campos requeridos
                    .map(row => {
                        // Convertir el teléfono a string si es número
                        const telefonoStr = String(row.Teléfono);
                        // Separar los teléfonos usando varios separadores posibles
                        const telefonos = telefonoStr
                            .split(/[\s|-|,|;|\|]/)
                            .map(tel => tel.trim().replace(/\D/g, '')) // Eliminar caracteres no numéricos
                            .filter(tel => tel.length === 9); // Mantener solo números de 9 dígitos

                        return {
                            nombre: row.Nombre.trim(),
                            telefonos,
                            comuna: row.Comuna.trim()
                        };
                    })
                    .filter(b => b.nombre && b.telefonos.length > 0 && b.comuna);

                if (processedData.length === 0) {
                    throw new Error('No se encontraron datos válidos en el archivo Excel. Verifica que el formato sea correcto.');
                }

                // Actualizar en Firestore
                const operatorRef = doc(db, 'operators', selectedOperator.id);
                await setDoc(operatorRef, {
                    ...selectedOperator,
                    beneficiarios: processedData,
                    lastUpdate: new Date().toISOString()
                }, { merge: true });

                // Actualizar estado local
                setOperators(operators.map(op => 
                    op.id === selectedOperator.id 
                        ? { ...op, beneficiarios: processedData }
                        : op
                ));

                setFile(null);
                setSelectedOperator(null);
                setFileError(''); // Limpiar cualquier error previo

            } catch (err) {
                console.error('Error al procesar el archivo:', err);
                setFileError(err.message || 'Error al procesar el archivo. Verifica que el formato sea correcto y que contenga las columnas: Nombre, Teléfono y Comuna.');
            } finally {
                setFileLoading(false);
            }
        };

        reader.readAsBinaryString(file);
    };

    // Eliminar asignaciones de un operador
    const handleClearAssignments = async (operatorId) => {
        try {
            const operatorRef = doc(db, 'operators', operatorId);
            await setDoc(operatorRef, {
                beneficiarios: []
            }, { merge: true });

            setOperators(operators.map(op => 
                op.id === operatorId 
                    ? { ...op, beneficiarios: [] }
                    : op
            ));
        } catch (err) {
            console.error('Error al eliminar asignaciones:', err);
            setError('Error al eliminar las asignaciones');
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Asignaciones de Beneficiarios</h1>
                <button
                    onClick={() => setShowNewOperatorForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                >
                    Nuevo Teleoperador
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                    <p>{error}</p>
                </div>
            )}

            {/* Formulario para nuevo operador */}
            {showNewOperatorForm && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Crear Nuevo Teleoperador</h2>
                    <form onSubmit={handleCreateOperator} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                            <input
                                type="text"
                                value={newOperator.nombre}
                                onChange={(e) => setNewOperator({...newOperator, nombre: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="email"
                                value={newOperator.email}
                                onChange={(e) => setNewOperator({...newOperator, email: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                            <input
                                type="tel"
                                value={newOperator.telefono}
                                onChange={(e) => setNewOperator({...newOperator, telefono: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowNewOperatorForm(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {loading ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Sección de carga de Excel */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Asignar Beneficiarios</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Seleccionar Teleoperador
                        </label>
                        <select
                            value={selectedOperator?.id || ''}
                            onChange={(e) => setSelectedOperator(operators.find(op => op.id === e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">Seleccione un teleoperador</option>
                            {operators.map(op => (
                                <option key={op.id} value={op.id}>{op.nombre}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <label className="w-full sm:w-auto px-5 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer text-center">
                            <span className="text-blue-500 font-semibold">Seleccionar Excel</span>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                className="hidden"
                                onChange={(e) => {
                                    setFile(e.target.files[0]);
                                    setFileError('');
                                }}
                            />
                        </label>
                        {file && <span className="text-gray-600 dark:text-gray-300">{file.name}</span>}
                        <button
                            onClick={processFile}
                            disabled={!file || !selectedOperator || fileLoading}
                            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        >
                            {fileLoading ? 'Procesando...' : 'Cargar Asignaciones'}
                        </button>
                    </div>
                    {fileError && <p className="text-sm text-red-600">{fileError}</p>}
                </div>
            </div>

            {/* Lista de Teleoperadores y sus asignaciones */}
            <div className="space-y-4">
                {operators.map(operator => (
                    <div key={operator.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{operator.nombre}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{operator.email}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{operator.telefono}</p>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-2">
                                    {operator.beneficiarios?.length || 0} beneficiarios asignados
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => toggleOperatorExpansion(operator.id)}
                                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded flex items-center"
                                >
                                    {expandedOperators[operator.id] ? (
                                        <>
                                            <span className="mr-2">Ocultar Lista</span>
                                            <ChevronUp size={16} />
                                        </>
                                    ) : (
                                        <>
                                            <span className="mr-2">Ver Lista</span>
                                            <ChevronDown size={16} />
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleClearAssignments(operator.id)}
                                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded"
                                >
                                    Eliminar Asignaciones
                                </button>
                            </div>
                        </div>
                        
                        {expandedOperators[operator.id] && operator.beneficiarios?.length > 0 && (
                            <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Nombre
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Teléfonos
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Comuna
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {operator.beneficiarios.map((beneficiario, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                    {beneficiario.nombre}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                    {beneficiario.telefonos.join(', ')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                    {beneficiario.comuna}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MÓDULO: HISTORIAL DE SEGUIMIENTOS ---
const HistorialSeguimientos = () => {
    const [seguimientos, setSeguimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarSeguimientos = async () => {
            try {
                setLoading(true);
                // TODO: Implementar la carga real de seguimientos desde Firebase
                // Por ahora usamos datos de ejemplo
                const datosPrueba = [];
                setSeguimientos(datosPrueba);
            } catch (err) {
                console.error('Error al cargar seguimientos:', err);
                setError('Error al cargar el historial de seguimientos');
            } finally {
                setLoading(false);
            }
        };

        cargarSeguimientos();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-600 dark:text-gray-300">Cargando seguimientos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    Historial de Seguimientos
                </h1>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                    Registros de Seguimiento
                </h2>
                {seguimientos.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Beneficiario
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Teleoperador
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Observaciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {seguimientos.map((seguimiento, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {seguimiento.fecha}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {seguimiento.beneficiario}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {seguimiento.teleoperador}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {seguimiento.estado}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {seguimiento.observaciones}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                        No hay registros de seguimiento disponibles
                    </p>
                )}
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
        } catch (err) {
            if (err.code === 'auth/operation-not-allowed') {
                setError('Error: El inicio de sesión con Email/Contraseña no está habilitado. Actívelo en la consola de Firebase.');
            } else {
                setError('Error al iniciar sesión. Revisa tus credenciales.');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSignUp = async (e) => {
        e.preventDefault();
        if(!email || !password) {
            setError("Por favor, ingrese email y contraseña.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // La creación del documento de usuario ahora se maneja en onAuthStateChanged
        } catch (err) {
            if (err.code === 'auth/operation-not-allowed') {
                setError('Error: La creación de usuarios con Email/Contraseña no está habilitada. Actívela en la consola de Firebase.');
            } else if (err.code === 'auth/invalid-email') {
                setError('El formato del email no es válido.');
            }
            else {
                setError('Error al registrar el usuario.');
            }
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
                    {error && <p className="text-sm text-red-600 p-3 bg-red-100 dark:bg-red-900/30 rounded-md">{error}</p>}
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
    const [appError, setAppError] = useState(null);
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
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'xlsx-script')
        ]).then(() => {
            setScriptsReady(true);
        }).catch(error => {
            console.error("Error al cargar los scripts:", error);
            setAppError(error.message);
        });

        const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (!userDocSnap.exists() && !firebaseUser.isAnonymous) {
                    // Si el documento no existe y el usuario NO es anónimo, créalo.
                    // Esto sucede justo después de que un nuevo usuario se registra.
                    const defaultUserData = { email: firebaseUser.email, role: 'teleoperadora' };
                    try {
                        await setDoc(userDocRef, defaultUserData);
                        setUserData({ uid: firebaseUser.uid, ...defaultUserData });
                    } catch (error) {
                         console.error("Error al crear el documento del usuario:", error);
                         setAppError("Error de base de datos: Permisos insuficientes para crear un nuevo usuario. Revisa tus reglas de Firestore.");
                    }
                } else if (userDocSnap.exists()) {
                     setUserData({ uid: firebaseUser.uid, ...userDocSnap.data() });
                } else {
                    // Es un usuario anónimo, no se necesita documento en Firestore.
                    setUserData({ uid: firebaseUser.uid, role: 'anonymous' });
                }
                setUser(firebaseUser);
            } else {
                setUser(null);
                setUserData(null);
            }
            setAuthReady(true);
        });
        
        // Solo intento login por token personalizado si está definido
        if (!auth.currentUser) {
            (async () => {
                try {
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    }
                    // El login anónimo está deshabilitado por configuración, no se intenta
                } catch (error) {
                    console.error("Error en el inicio de sesión inicial:", error);
                    setAppError("Ocurrió un error de autenticación con Firebase.");
                }
            })();
        }

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
    
    if (appError) {
        return <div className="flex items-center justify-center min-h-screen bg-red-100 text-red-700 p-4 text-center"><p>{appError}</p></div>;
    }

    if (!authReady || !scriptsReady) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900"><div className="text-xl dark:text-white">Cargando aplicación...</div></div>;
    }

    // Si la autenticación está lista pero no hay usuario, muestra el Login
    if (authReady && !user) {
        return <Login setAuthReady={setAuthReady} />;
    }
    
    // Si hay un usuario, pero no hay datos de usuario (puede pasar brevemente), muestra cargando
    if (!userData) {
         return <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900"><div className="text-xl dark:text-white">Cargando datos de usuario...</div></div>;
    }
    
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
