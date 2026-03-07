import React, { useState, useMemo, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- Constants & Config ---
const DEFAULT_ADMIN_USER = 'ArkanA';
const DEFAULT_ADMIN_PASS = 'Arkan1234,';
const MASTER_RECOVERY_KEY = 'Aida2026';
const ADMIN_WHATSAPP_NUMBER = '9647769516814';
const STORE_LOGO = 'https://i.ibb.co/hx5T0jpJ/icon.png'; 
const INITIAL_STORE_SIGNATURE = 'https://i.ibb.co/PZt3sfJc/Arkan-signature.jpg';
const PARTY2_SIGNATURE = 'https://i.ibb.co/Hf65zpHf/Sarwar-signature.jpg';
const INITIAL_STORE_PHONE = '07769516814';
const STORE_NAME = 'ئایدا ستۆر';
const INITIAL_STORE_ADDRESS = 'سلێمانی، شەقامی سەرەکی';

const CURRENCIES = {
  USD: { symbol: '$', name: 'دۆلار', code: 'USD' },
  IQD: { symbol: 'د.ع', name: 'دینار', code: 'IQD' },
  AED: { symbol: 'د.ئ', name: 'درهەم', code: 'AED' }
};

const MODULES = [
  { id: 'dashboard', label: 'سەرەتا (ئامارەکان)' },
  { id: 'items', label: 'پێناسەی کاڵاکان' },
  { id: 'companies', label: 'کۆمپانیاکان' },
  { id: 'agents', label: 'بریکارەکان' },
  { id: 'offices', label: 'نوسینگەکان' },
  { id: 'purchases', label: 'کڕین' },
  { id: 'sales', label: 'فرۆشتن' },
  { id: 'payments', label: 'وەرگرتن و پێدان' },
  { id: 'inventory', label: 'کۆگا (بینین)' },
  { id: 'inventory_print_price', label: 'چاپکردنی کۆگا بە نرخەوە' },
  { id: 'reports', label: 'ڕاپۆرتەکان (گشتی)' },
  { id: 'capital', label: 'سەرمایە و خەرجی (قازانج)' },
  { id: 'users', label: 'بەکارهێنەران' },
  { id: 'settings', label: 'ڕێکخستنەکان' }
];

const THEMES = {
  emeraldDark: { main: 'bg-emerald-900', text: 'text-emerald-900', hover: 'hover:bg-emerald-800', lightBg: 'bg-emerald-50', border: 'border-emerald-900', sidebar: 'bg-black', sidebarHover: 'hover:bg-slate-800', iconText: 'text-emerald-400', name: 'سەوزی تۆخ و ڕەش' },
  orangeDark: { main: 'bg-[#c2410c]', text: 'text-[#c2410c]', hover: 'hover:bg-[#9a3412]', lightBg: 'bg-orange-50', border: 'border-[#c2410c]', sidebar: 'bg-blue-950', sidebarHover: 'hover:bg-blue-900', iconText: 'text-orange-400', name: 'پرتەقاڵی کاڵتر' },
  blueDark: { main: 'bg-blue-900', text: 'text-blue-900', hover: 'hover:bg-blue-800', lightBg: 'bg-blue-50', border: 'border-blue-900', sidebar: 'bg-black', sidebarHover: 'hover:bg-slate-800', iconText: 'text-blue-400', name: 'شینی تۆخ و ڕەش' },
  creamBrown: { main: 'bg-[#8B5A2B]', text: 'text-[#8B5A2B]', hover: 'hover:bg-[#6b4423]', lightBg: 'bg-[#F5F5DC]', border: 'border-[#8B5A2B]', sidebar: 'bg-[#3E2723]', sidebarHover: 'hover:bg-[#4e342e]', iconText: 'text-[#D2B48C]', name: 'کرێمی و قاوەیی' },
  goldDark: { main: 'bg-[#B8860B]', text: 'text-[#B8860B]', hover: 'hover:bg-[#996515]', lightBg: 'bg-[#FFF8DC]', border: 'border-[#B8860B]', sidebar: 'bg-black', sidebarHover: 'hover:bg-slate-800', iconText: 'text-[#FFD700]', name: 'ئاڵتوونی تاریک و ڕەش' },
  redDark: { main: 'bg-red-900', text: 'text-red-900', hover: 'hover:bg-red-800', lightBg: 'bg-red-50', border: 'border-red-900', sidebar: 'bg-black', sidebarHover: 'hover:bg-slate-800', iconText: 'text-red-400', name: 'سووری تاریک و ڕەش' },
  bw: { main: 'bg-black', text: 'text-black', hover: 'hover:bg-slate-800', lightBg: 'bg-slate-100', border: 'border-black', sidebar: 'bg-black', sidebarHover: 'hover:bg-slate-800', iconText: 'text-white', name: 'ڕەش و سپی' }
};

const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined' && Object.keys(JSON.parse(__firebase_config || '{}')).length > 0) {
    try { return JSON.parse(__firebase_config); } catch (e) {}
  }
  return { apiKey: "AIzaSyBFPkNBvMcOOMc6Oam8nlrQWAOpCTOu0Bg", authDomain: "aidastore-2026.firebaseapp.com", projectId: "aidastore-2026", storageBucket: "aidastore-2026.firebasestorage.app", messagingSenderId: "1009068204406", appId: "1:1009068204406:web:f64cb19253296e4a391a57" };
};

const app = initializeApp(getFirebaseConfig());
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'sewastore-local-app';

// --- Icons ---
const IconHome = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconBuilding = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>;
const IconOffice = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v3"/><path d="M12 14v3"/><path d="M16 14v3"/></svg>;
const IconShoppingCart = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>;
const IconPackage = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const IconDollarSign = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconFileText = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const IconPrinter = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconList = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IconCreditCard = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconLock = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconUser = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconContract = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M15.5 12.5 12 16l-3-1.5L8 18"/></svg>;
const IconDocs = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconAgent = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconBox = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IconMenu = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
const IconSearch = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconImage = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const IconUpload = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IconActivity = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;

const DOC_TYPES = ['کارتی نیشتمانی', 'کارتی زانیاری', 'پاسپۆرت', 'کۆدی ئاسایش', 'مۆڵەتی شۆفێری', 'کارت بانکی', 'ناسنامەی باری شارستانی', 'ڕەگەزنامە', 'اقامە', 'بەڵگەنامەی سەربازی', 'ساڵانەی ئۆتۆمبێل'];

// --- Main Application ---
export default function App() {
  const [user, setUser] = useState(null); 
  const [isLogged, setIsLogged] = useState(false);
  const [loggedAppUser, setLoggedAppUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [modal, setModal] = useState({ show: false, type: 'alert', message: '', onConfirm: null });
  
  const [settings, setSettings] = useState({
      storePhone: INITIAL_STORE_PHONE, storeAddress: INITIAL_STORE_ADDRESS, signatureUrl: INITIAL_STORE_SIGNATURE, themeKey: 'emeraldDark', fontSize: 'text-base', currency: 'USD'
  });

  const [companies, setCompanies] = useState([]);
  const [agents, setAgents] = useState([]); 
  const [offices, setOffices] = useState([]);
  const [definedItems, setDefinedItems] = useState([]); 
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [capitalTx, setCapitalTx] = useState([]);
  const [appUsers, setAppUsers] = useState([]);
  const [userLogs, setUserLogs] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null); 
  const [viewingInstallments, setViewingInstallments] = useState(null);
  const [viewingDocuments, setViewingDocuments] = useState(null); 
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [saleMode, setSaleMode] = useState('installment'); 
  const [purMode, setPurMode] = useState('cash'); 
  const [saleItems, setSaleItems] = useState([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
  const [purItems, setPurItems] = useState([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [purEntityType, setPurEntityType] = useState('company');

  const [compTxDir, setCompTxDir] = useState('pay');
  const [agentTxDir, setAgentTxDir] = useState('receive');
  const [viaOfficeComp, setViaOfficeComp] = useState(false);
  const [viaOfficeAgent, setViaOfficeAgent] = useState(false);

  const [searchTerms, setSearchTerms] = useState({ installment: '', agent: '', company: '', office: '' });
  const installmentSelectRef = useRef(null);
  const agentSelectRef = useRef(null);
  const companySelectRef = useRef(null);
  const officeSelectRef = useRef(null);
  
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveredData, setRecoveredData] = useState(null);

  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false);

  const getToday = () => new Date().toISOString().split('T')[0];
  const currentCurrency = CURRENCIES[settings.currency] || CURRENCIES.USD;

  const logAction = async (actionDesc) => {
    if (!loggedAppUser || !user) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'userLogs'), {
            username: loggedAppUser.username,
            action: actionDesc,
            timestamp: serverTimestamp(),
            date: new Date().toLocaleString('en-GB')
        });
    } catch (e) { console.error("Error logging:", e); }
  };

  const hasPermission = (modId) => {
      if (loggedAppUser?.role === 'admin' || loggedAppUser?.username === DEFAULT_ADMIN_USER) return true;
      if (!loggedAppUser?.permissions) return true; 
      return loggedAppUser.permissions.includes(modId);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
        const savedSettings = localStorage.getItem('sewastore_settings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setSettings(prev => ({...prev, ...parsed}));
        }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (isMobile) document.documentElement.setAttribute('dir', 'ltr');
    else document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ckb');
  }, [isMobile]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (error) { console.error(error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubCompanies = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'companies'), snap => setCompanies(snap.docs.map(d => d.data())));
    const unsubAgents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'agents'), snap => setAgents(snap.docs.map(d => d.data())));
    const unsubOffices = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'offices'), snap => setOffices(snap.docs.map(d => d.data())));
    const unsubDefinedItems = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'definedItems'), snap => setDefinedItems(snap.docs.map(d => d.data())));
    const unsubPurchases = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'purchases'), snap => setPurchases(snap.docs.map(d => d.data())));
    const unsubSales = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'sales'), snap => setSales(snap.docs.map(d => d.data())));
    const unsubCapital = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'capitalTx'), snap => {
        const data = snap.docs.map(d => d.data());
        data.sort((a, b) => a.id.localeCompare(b.id)); 
        setCapitalTx(data);
    });
    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'appUsers'), snap => setAppUsers(snap.docs.map(d => d.data())));
    
    // Load Logs
    const logsQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'userLogs'), orderBy('timestamp', 'desc'));
    const unsubLogs = onSnapshot(logsQuery, snap => setUserLogs(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => { unsubCompanies(); unsubAgents(); unsubOffices(); unsubDefinedItems(); unsubPurchases(); unsubSales(); unsubCapital(); unsubUsers(); unsubLogs(); };
  }, [user]);

  const currentTheme = THEMES[settings.themeKey] || THEMES.emeraldDark;
  const inpCls = `w-full border border-slate-300 p-2.5 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:${currentTheme.border}`;
  const thCls = `p-3 md:p-4 border-b border-slate-200 font-bold`;
  const tdCls = "p-3 md:p-4 border-b border-slate-100";

  const getDocRef = (colName, docId) => doc(db, 'artifacts', appId, 'public', 'data', colName, String(docId));
  const confirmAction = (message, onConfirm) => setModal({ show: true, type: 'confirm', message, onConfirm });
  const alertMsg = (message) => setModal({ show: true, type: 'alert', message, onConfirm: null });

  const formatMoney = (amount, currencyCode) => {
      const code = currencyCode || settings.currency;
      const sym = CURRENCIES[code]?.symbol || '$';
      return `${sym}${Number(amount).toFixed(2)}`;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const u = loginForm.user; const p = loginForm.pass;
    const foundUser = appUsers.find(user => user.username === u && user.password === p);
    if (foundUser) { setLoggedAppUser(foundUser); setIsLogged(true); setLoginError(''); await logAction('چوونەژوورەوە بۆ سیستم'); }
    else if (u === DEFAULT_ADMIN_USER && p === DEFAULT_ADMIN_PASS) { setLoggedAppUser({ username: u, role: 'admin' }); setIsLogged(true); setLoginError(''); await logAction('چوونەژوورەوە بۆ سیستم وەک ئەدمین'); }
    else setLoginError('ناوی بەکارهێنەر یان وشەی تێپەڕ هەڵەیە!');
  };

  const handleRecover = (e) => {
    e.preventDefault();
    if (recoveryKey === MASTER_RECOVERY_KEY) {
      let dataToShow = appUsers.length > 0 ? [...appUsers] : [];
      if (!dataToShow.find(u => u.username === DEFAULT_ADMIN_USER)) dataToShow.push({ username: DEFAULT_ADMIN_USER, password: DEFAULT_ADMIN_PASS, role: 'admin' });
      setRecoveredData(dataToShow); setLoginError('');
    } else { setLoginError('کۆدی گەڕاندنەوە هەڵەیە!'); setRecoveredData(null); }
  };

  const requestPasswordViaWhatsApp = () => {
      const message = encodeURIComponent(`سڵاو، من پاسوۆردی سیستمی ئایدا ستۆرم بیرچووەتەوە. تکایە هاوکاریم بکە بۆ گەڕاندنەوەی.`);
      window.open(`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  const handleSaveSettings = async (e) => {
      e.preventDefault();
      const form = e.target;
      const newSettings = { storePhone: form.storePhone.value, storeAddress: form.storeAddress.value, signatureUrl: form.signatureUrl.value, themeKey: form.themeKey.value, fontSize: form.fontSize.value, currency: form.currency.value };
      setSettings(newSettings);
      localStorage.setItem('sewastore_settings', JSON.stringify(newSettings));
      await logAction('گۆڕانکاری لە ڕێکخستنەکانی سیستم');
      alertMsg("ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوت کران.");
  };

  const printContent = (title, receiptNo, contentHTML, party1Name = STORE_NAME, party2Name = 'کڕیار/فرۆشیار', includeSignatures = true) => {
    const signatureImage = settings.signatureUrl ? `<img src="${settings.signatureUrl}" style="width:120px;height:auto;margin:5px auto;display:block;" alt="واژۆ" />` : '';
    const signature2Image = typeof PARTY2_SIGNATURE !== 'undefined' && PARTY2_SIGNATURE ? `<img src="${PARTY2_SIGNATURE}" style="width:120px;height:auto;margin:5px auto;display:block;" alt="واژۆی لایەنی دووەم" />` : '';
    
    let printColorMain = '#064e3b'; let printColorBg = '#ecfdf5';
    if (settings.themeKey === 'orangeDark') { printColorMain = '#c2410c'; printColorBg = '#fff7ed'; }
    if (settings.themeKey === 'blueDark') { printColorMain = '#1e3a8a'; printColorBg = '#eff6ff'; }
    if (settings.themeKey === 'creamBrown') { printColorMain = '#8B5A2B'; printColorBg = '#F5F5DC'; }
    if (settings.themeKey === 'goldDark') { printColorMain = '#B8860B'; printColorBg = '#FFF8DC'; }
    if (settings.themeKey === 'redDark') { printColorMain = '#7f1d1d'; printColorBg = '#fef2f2'; }
    if (settings.themeKey === 'bw') { printColorMain = '#000000'; printColorBg = '#f1f5f9'; }

    const signaturesBlock = includeSignatures ? `
      <div style="display:flex;justify-content:space-around;margin-top:25px;padding-top:15px;border-top:2px dashed ${printColorMain};page-break-inside:avoid;">
        <div style="text-align:center;width:250px;color:#0f172a;"><div style="font-weight:bold;margin-bottom:${settings.signatureUrl?'10px':'35px'};font-size:16px;color:${printColorMain};">واژۆی لایەنی یەکەم</div>${signatureImage}<div style="border-top:2px solid #0f172a;padding-top:8px;font-weight:bold;">${party1Name}</div></div>
        <div style="text-align:center;width:250px;color:#0f172a;"><div style="font-weight:bold;margin-bottom:${PARTY2_SIGNATURE?'10px':'35px'};font-size:16px;color:${printColorMain};">واژۆی لایەنی دووەم</div>${signature2Image}<div style="border-top:2px solid #0f172a;padding-top:8px;font-weight:bold;">${party2Name}</div></div>
      </div>` : '';

    const printWindow = window.open('', '_blank');
    if (!printWindow) { alertMsg("تکایە ڕێگە بە کردنەوەی پەنجەرەی نوێ (Pop-ups) بدە لە براوسەرەکەت بۆ چاپکردن."); return; }

    printWindow.document.write(`
      <html dir="rtl"><head><title>${title}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>*,*::before,*::after{box-sizing:border-box!important}@media print{body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;margin:0;padding:10px;width:100%}*{color-adjust:exact!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}@page{size:A4 portrait;margin:10mm}.receipt-container{box-shadow:none!important;border:2px solid ${printColorMain}!important;width:100%!important;max-width:100%!important;padding:15px!important;margin:0!important}table{font-size:12px!important;min-width:0!important;width:100%!important;table-layout:auto!important;border-collapse:collapse!important;margin-bottom:10px!important;border:1px solid #cbd5e1!important}th,td{padding:6px!important;white-space:normal!important;border:1px solid #cbd5e1!important;word-wrap:break-word!important}th{background-color:${printColorMain}!important;color:#fff!important}div,table,tbody,tr,td,th{max-width:100%!important;overflow:visible!important}.header-logo h1{font-size:22px!important;color:${printColorMain}!important}.info-grid{display:flex!important;flex-wrap:wrap!important;gap:10px!important}.info-box{flex:1 1 45%!important;border:1px solid #cbd5e1!important;padding:10px!important;font-size:12px!important;background-color:${printColorBg}!important}.overflow-x-auto,.table-responsive{overflow-x:visible!important}[class*="min-w-"]{min-width:0!important}::-webkit-scrollbar{display:none}}body{font-family:'Calibri',sans-serif;padding:15px;color:#0f172a;background:#fff;margin:0}.receipt-container{max-width:800px;margin:0 auto;background:#fff;border-radius:12px;border:2px solid #e2e8f0;border-top:8px solid ${printColorMain};padding:25px}.header{display:flex;justify-content:space-between;border-bottom:2px solid #e2e8f0;padding-bottom:15px;margin-bottom:20px}.header-logo{display:flex;align-items:center;gap:15px}.header-logo h1{color:${printColorMain};margin:0;font-size:26px}.header-meta{text-align:left;background:${printColorBg};padding:10px 15px;border-radius:8px;border:1px solid ${printColorMain};flex-grow:1;opacity:0.8}.header-meta .title-badge{color:${printColorMain};font-size:16px;margin-bottom:5px;font-weight:bold;display:block}.table-responsive{width:100%;overflow-x:auto}table{width:100%;border-collapse:collapse;margin-top:15px;margin-bottom:25px;font-size:14px;border:1px solid #e2e8f0}th,td{padding:10px;text-align:right;border:1px solid #e2e8f0}th{background-color:${printColorMain};color:#fff;font-weight:bold}.info-grid{display:flex;gap:15px;margin-bottom:20px}.info-box{flex:1;background:${printColorBg};padding:15px;border-radius:8px;border:1px solid #cbd5e1}.thank-you{text-align:center;margin-top:25px}.contact-note{margin-top:10px;font-weight:bold;border:2px dashed ${printColorMain};padding:10px;border-radius:8px;text-align:center}.print-img{max-width:100px;max-height:100px;border-radius:8px;border:1px solid #cbd5e1;object-fit:cover}</style>
        </head><body><div class="receipt-container"><div class="header"><div class="header-logo">${STORE_LOGO ? `<img src="${STORE_LOGO}" style="width:80px;height:80px;object-fit:contain;border-radius:8px;" alt="Logo" onerror="this.style.display='none'" />` : ''}<div><h1>${STORE_NAME}</h1></div></div><div class="header-meta"><span class="title-badge">${title}</span><p>پسوڵە ژمارە: <span style="font-weight:bold;font-size:16px;">${receiptNo||'-'}</span></p><p>بەرواری چاپ: ${getToday()}</p></div></div>${contentHTML}${signaturesBlock}<div class="thank-you">سوپاس بۆ مامەڵەکردن لەگەڵمان. هیوای ڕۆژێکی خۆش.<div class="contact-note">${settings.storeAddress ? `ناونیشان: ${settings.storeAddress} | ` : ''}مۆبایل: <span dir="ltr" style="font-size:16px;">${settings.storePhone}</span></div></div></div><script>window.onload=function(){setTimeout(function(){window.print();},1200);};window.onafterprint=function(){window.close();};</script></body></html>
    `);
    printWindow.document.close();
  };

  // --- Image Upload Component for Forms ---
  const ImageUploadField = ({ name, defaultValue, label, placeholder }) => {
    const [preview, setPreview] = useState(defaultValue || '');
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploadingGlobal(true); setIsUploading(true);
        try {
            const fileRef = ref(storage, `artifacts/${appId}/public/data/uploads/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            setPreview(url);
        } catch (err) {
            console.error("Upload error:", err);
            alertMsg("کێشەیەک ڕوویدا لە بارکردنی وێنەکە. تکایە دووبارە هەوڵبدەرەوە.");
        }
        setIsUploading(false); setIsUploadingGlobal(false);
    };

    return (
        <div className="flex flex-col">
            <label className="block text-sm mb-1 text-slate-600 flex items-center gap-1"><IconImage/> {label}</label>
            <div className="flex items-center gap-2">
                <input type="hidden" name={name} value={preview} />
                <input 
                    type="url" 
                    value={preview}
                    onChange={(e) => setPreview(e.target.value)}
                    className={`flex-1 border border-slate-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:${currentTheme.border} text-sm`} 
                    placeholder={placeholder} 
                    dir="ltr" 
                />
                <label className={`cursor-pointer ${currentTheme.main} ${currentTheme.hover} text-white p-2.5 rounded-lg flex items-center justify-center transition-colors relative`} title="بارکردن لە ئامێرەکەوە">
                    {isUploading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full inline-block"></span> : <IconUpload />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>
            </div>
            {preview && (
                <div className="mt-2 relative inline-block">
                    <img src={preview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-300 shadow-sm" onError={(e) => e.target.style.display='none'} />
                    <button type="button" onClick={() => setPreview('')} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 shadow-md hover:bg-rose-600"><IconX/></button>
                </div>
            )}
        </div>
    );
  };

  const inventory = useMemo(() => {
    const items = {};
    purchases.forEach(p => {
      const iList = p.items || [{ itemName: p.itemName, qty: p.qty, price: p.unitPrice || (p.total/p.qty), currency: p.currency }];
      iList.forEach(i => {
        const itemCurr = i.currency || p.currency || settings.currency;
        const key = `${i.itemName}_${itemCurr}`;
        if (!items[key]) items[key] = { itemName: i.itemName, totalQty: 0, costSum: 0, soldQty: 0, photoUrl: i.photoUrl || p.photoUrl || '', currency: itemCurr };
        items[key].totalQty += Number(i.qty); items[key].costSum += (Number(i.qty) * Number(i.price || i.unitPrice));
      });
    });
    sales.forEach(s => {
      const iList = s.items || [{ itemName: s.itemName, qty: s.qty, price: s.unitPrice || (s.price/s.qty), currency: s.currency }];
      iList.forEach(i => { 
         const itemCurr = i.currency || s.currency || settings.currency;
         const key = `${i.itemName}_${itemCurr}`;
         if (items[key]) items[key].soldQty += Number(i.qty); 
      });
    });
    return Object.values(items).map(item => ({ ...item, currentQty: item.totalQty - item.soldQty, avgCost: item.totalQty > 0 ? (item.costSum / item.totalQty) : 0 })).filter(item => item.currentQty > 0 || item.soldQty > 0);
  }, [purchases, sales, settings.currency]);

  const currentCapital = useMemo(() => {
      const capitals = { USD: 0, IQD: 0, AED: 0 };
      capitalTx.forEach(tx => {
         const curr = tx.currency || settings.currency;
         if(tx.type !== 'purchase_debt' && tx.type !== 'receive_office_loan' && capitals[curr] !== undefined) {
             capitals[curr] += tx.amount;
         }
      });
      return capitals;
  }, [capitalTx, settings.currency]);

  const getSalePaidAmount = (saleId) => {
    const sale = sales.find(s => s.id === saleId); if (!sale) return 0; if (sale.saleType === 'cash') return sale.price;
    return (sale.advance || 0) + capitalTx.filter(tx => tx.refId === saleId && (tx.type === 'receive_installment' || tx.type === 'receive_agent_payment')).reduce((sum, tx) => sum + tx.amount, 0);
  };
  const getCompanyDebt = (companyId, currencyCode) => {
    const code = currencyCode || settings.currency;
    const totalBoughtOnDebt = purchases.filter(p => p.companyId === companyId && p.paymentType === 'debt' && (p.currency || settings.currency) === code).reduce((sum, p) => sum + p.total, 0);
    const totalPaidToCompany = Math.abs(capitalTx.filter(tx => tx.refId === companyId && tx.type === 'pay_company_debt' && (tx.currency || settings.currency) === code).reduce((sum, tx) => sum + tx.amount, 0));
    const totalReceivedFromCompany = capitalTx.filter(tx => tx.refId === companyId && tx.type === 'receive_company_payment' && (tx.currency || settings.currency) === code).reduce((sum, tx) => sum + tx.amount, 0);
    const totalCreditSalesToCompany = sales.filter(s => s.saleType === 'credit_company' && s.companyId === companyId && (s.currency || settings.currency) === code).reduce((sum, s) => sum + s.price, 0);
    return totalBoughtOnDebt - totalPaidToCompany + totalReceivedFromCompany - totalCreditSalesToCompany;
  };
  const getAgentDebt = (agentId, currencyCode) => {
    const code = currencyCode || settings.currency;
    const totalCreditSales = sales.filter(s => (s.saleType === 'credit_agent' || s.saleType === 'credit') && s.agentId === agentId && (s.currency || settings.currency) === code).reduce((sum, s) => sum + s.price, 0);
    const totalReceivedFromAgent = capitalTx.filter(tx => tx.type === 'receive_agent_payment' && tx.refId === agentId && (tx.currency || settings.currency) === code).reduce((sum, tx) => sum + tx.amount, 0);
    const totalPaidToAgent = Math.abs(capitalTx.filter(tx => tx.type === 'pay_agent_payment' && tx.refId === agentId && (tx.currency || settings.currency) === code).reduce((sum, tx) => sum + tx.amount, 0));
    const totalBoughtFromAgentOnDebt = purchases.filter(p => p.companyId === agentId && p.paymentType === 'debt' && (p.currency || settings.currency) === code).reduce((sum, p) => sum + p.total, 0);
    return (totalCreditSales + totalPaidToAgent) - (totalReceivedFromAgent + totalBoughtFromAgentOnDebt);
  };
  const getOfficeDebt = (officeId, currencyCode) => {
    const code = currencyCode || settings.currency;
    const loans = capitalTx.filter(tx => tx.type === 'receive_office_loan' && tx.refId === officeId && (tx.currency || settings.currency) === code).reduce((sum, tx) => sum + tx.amount, 0);
    const payments = Math.abs(capitalTx.filter(tx => tx.type === 'pay_office_debt' && tx.refId === officeId && (tx.currency || settings.currency) === code).reduce((sum, tx) => sum + tx.amount, 0));
    return loans - payments;
  };

  const addTransaction = async (type, amount, desc, refId = null, note = '', exactId = null, existReceiptNo = null, customCurrency = null) => {
    const id = exactId || (Date.now().toString() + Math.random().toString().slice(2, 6));
    let rNo = existReceiptNo || (capitalTx.filter(t => t.type === type).length > 0 ? Math.max(...capitalTx.filter(t => t.type === type).map(t => t.receiptNo || 0)) + 1 : 1);
    const currencyToUse = customCurrency || settings.currency;
    const data = { id, type, amount, date: getToday(), desc, refId, note, receiptNo: rNo, currency: currencyToUse };
    await setDoc(getDocRef('capitalTx', id), data); return data;
  };
  const deleteTransactionsByRef = async (refId) => { for (const tx of capitalTx.filter(tx => tx.refId === refId)) await deleteDoc(getDocRef('capitalTx', tx.id)); };

  const handleSaveAppUser = async (e) => {
    e.preventDefault(); 
    const form = e.target; 
    
    // Collect permissions
    const selectedPermissions = [];
    MODULES.forEach(mod => {
        if(form[`perm_${mod.id}`]?.checked) selectedPermissions.push(mod.id);
    });

    const newAppUser = { 
        id: editingId || Date.now().toString(), 
        username: form.username.value, 
        password: form.password.value, 
        role: form.role.value,
        permissions: selectedPermissions
    };
    if (!editingId && appUsers.find(u => u.username === newAppUser.username)) return alertMsg('ئەم ناوە پێشتر بەکارهاتووە!');
    if (newAppUser.username === DEFAULT_ADMIN_USER) return alertMsg('ناتوانیت دەستکاری یوسەری سەرەکی سیستم بکەیت لێرەوە.');
    await setDoc(getDocRef('appUsers', newAppUser.id), newAppUser); 
    await logAction(editingId ? `نوێکردنەوەی بەکارهێنەر: ${newAppUser.username}` : `دروستکردنی بەکارهێنەر: ${newAppUser.username}`);
    setEditingId(null); form.reset();
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault(); const form = e.target; const newComp = { id: editingId || Date.now().toString(), name: form.name.value, phone: form.phone.value, address: form.address.value, photoUrl: form.photoUrl.value };
    await setDoc(getDocRef('companies', newComp.id), newComp); 
    await logAction(editingId ? `نوێکردنەوەی کۆمپانیا: ${newComp.name}` : `تۆمارکردنی کۆمپانیا: ${newComp.name}`);
    setEditingId(null); form.reset();
  };
  const handleSaveAgent = async (e) => {
    e.preventDefault(); const form = e.target; const newAgent = { id: editingId || Date.now().toString(), name: form.name.value, phone: form.phone.value, address: form.address.value, notes: form.notes.value, photoUrl: form.photoUrl.value };
    await setDoc(getDocRef('agents', newAgent.id), newAgent); 
    await logAction(editingId ? `نوێکردنەوەی بریکار: ${newAgent.name}` : `تۆمارکردنی بریکار: ${newAgent.name}`);
    setEditingId(null); form.reset();
  };
  const handleSaveOffice = async (e) => {
    e.preventDefault(); const form = e.target; const newOffice = { id: editingId || Date.now().toString(), name: form.name.value, phone: form.phone.value, address: form.address.value };
    await setDoc(getDocRef('offices', newOffice.id), newOffice); 
    await logAction(editingId ? `نوێکردنەوەی نوسینگە: ${newOffice.name}` : `تۆمارکردنی نوسینگە: ${newOffice.name}`);
    setEditingId(null); form.reset();
  };
  const handleSaveDefinedItem = async (e) => {
    e.preventDefault(); const form = e.target; const newItem = { id: editingId || Date.now().toString(), type: form.itemType.value, brand: form.brand.value, name: form.name.value, photoUrl: form.photoUrl.value };
    await setDoc(getDocRef('definedItems', newItem.id), newItem); 
    await logAction(editingId ? `نوێکردنەوەی کاڵا: ${newItem.name}` : `پێناسەکردنی کاڵا: ${newItem.name}`);
    setEditingId(null); form.reset();
  };
  const deleteAppUser = (id) => confirmAction('دڵنیایت لە سڕینەوە؟', async () => { await deleteDoc(getDocRef('appUsers', id)); await logAction(`سڕینەوەی بەکارهێنەر: ${id}`); });
  const deleteCompany = (id) => confirmAction('دڵنیایت لە سڕینەوە؟', async () => { await deleteDoc(getDocRef('companies', id)); await logAction(`سڕینەوەی کۆمپانیا: ${id}`); });
  const deleteAgent = (id) => confirmAction('دڵنیایت لە سڕینەوە؟', async () => { await deleteDoc(getDocRef('agents', id)); await logAction(`سڕینەوەی بریکار: ${id}`); });
  const deleteOffice = (id) => confirmAction('دڵنیایت لە سڕینەوە؟', async () => { await deleteDoc(getDocRef('offices', id)); await logAction(`سڕینەوەی نوسینگە: ${id}`); });
  const deleteDefinedItem = (id) => confirmAction('دڵنیایت لە سڕینەوە؟', async () => { await deleteDoc(getDocRef('definedItems', id)); await logAction(`سڕینەوەی کاڵا: ${id}`); });

  // --- Purchases Logic (Multi-item) ---
  const addPurItem = () => setPurItems([...purItems, { id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
  const removePurItem = (id) => setPurItems(purItems.filter(i => i.id !== id));
  const updatePurItem = (id, field, value) => setPurItems(purItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  const handleSavePurchase = async (e) => {
    e.preventDefault(); const form = e.target; const paymentType = purMode; const note = form.note.value; const selectedCurrency = form.currency.value;
    if (purItems.some(i => !i.itemName || !i.qty || !i.unitPrice)) return alertMsg('تکایە زانیاری هەموو کاڵاکان بە تەواوی پڕبکەرەوە.');
    let entityId = form.entityId?.value || ''; let entityName = form.companyNameStr?.value || '';
    if (paymentType === 'debt' && !entityId) return alertMsg("بۆ کڕینی قەرز دەبێت لایەنێک هەڵبژێریت!");
    if (entityId) {
       if (purEntityType === 'company') entityName = companies.find(c => c.id === entityId)?.name || '';
       if (purEntityType === 'agent') entityName = agents.find(a => a.id === entityId)?.name || '';
    } else if (!entityName) entityName = 'فرۆشیاری نەناسراو (کاش)';
    const totalPrice = purItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0);
    const purToEdit = editingId ? purchases.find(p => p.id === editingId) : null;
    const rNo = purToEdit?.receiptNo || (purchases.length > 0 ? Math.max(...purchases.map(p => p.receiptNo || 0)) + 1 : 1);
    const newPurchase = { id: editingId || Date.now().toString(), companyId: entityId, companyName: entityName, entityType: purEntityType, items: purItems, itemName: purItems.length === 1 ? purItems[0].itemName : 'کڕینی جۆراوجۆر', qty: purItems.reduce((sum, i) => sum + Number(i.qty), 0), price: purItems.length === 1 ? Number(purItems[0].unitPrice) : 0, total: totalPrice, paymentType, note, date: getToday(), receiptNo: rNo, currency: selectedCurrency };
    if (editingId) await deleteTransactionsByRef(editingId);
    await setDoc(getDocRef('purchases', newPurchase.id), newPurchase);
    await logAction(editingId ? `نوێکردنەوەی پسوڵەی کڕین ژمارە ${rNo}` : `تۆمارکردنی پسوڵەی کڕین ژمارە ${rNo}`);
    setEditingId(null); setPurItems([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
    const txType = paymentType === 'cash' ? 'purchase_cash' : 'purchase_debt';
    await addTransaction(txType, -totalPrice, `کڕین لە: ${newPurchase.companyName}`, newPurchase.id, note, null, rNo, selectedCurrency); form.reset();
  };
  const deletePurchase = (id) => confirmAction('دڵنیایت لە سڕینەوە؟', async () => { const p = purchases.find(x=>x.id===id); await deleteDoc(getDocRef('purchases', id)); await deleteTransactionsByRef(id); await logAction(`سڕینەوەی پسوڵەی کڕین ژمارە ${p?.receiptNo}`); });
  const printPurchase = (p) => {
    let currentDebt = 0; let phone = '-'; let entityPhoto = '';
    if (p.companyId) {
        if (p.entityType === 'agent') { currentDebt = getAgentDebt(p.companyId, p.currency); const ag = agents.find(a => a.id === p.companyId); phone = ag?.phone || '-'; entityPhoto = ag?.photoUrl || ''; } 
        else { currentDebt = getCompanyDebt(p.companyId, p.currency); const comp = companies.find(c => c.id === p.companyId); phone = comp?.phone || '-'; entityPhoto = comp?.photoUrl || ''; }
    }
    const itemsList = p.items || [{ itemName: p.itemName, qty: p.qty, unitPrice: p.price || (p.total/p.qty), total: p.total }];
    const photoHtml = entityPhoto ? `<img src="${entityPhoto}" class="print-img" alt="وێنە" onerror="this.style.display='none'" />` : '';
    const html = `<div class="info-grid"><div class="info-box flex gap-4 items-center">${photoHtml}<div><strong>ناوی فرۆشیار:</strong> ${p.companyName}<br/><strong>مۆبایل:</strong> <span dir="ltr">${phone}</span><br/></div></div><div class="info-box"><strong>بەرواری کڕین:</strong> ${p.date}<br/><strong>جۆری مامەڵە:</strong> <span style="font-weight: bold;">${p.paymentType === 'debt' ? 'قەرز لەسەرمان' : 'نەختینە (کاش)'}</span><br/>${p.paymentType === 'debt' ? `<strong>حسابی ئەم لایەنە:</strong> <span dir="ltr" style="color:#000000;font-weight:bold;font-size:16px;">${formatMoney(currentDebt, p.currency)}</span>` : ''}</div></div><div class="table-responsive"><table><tr><th>ناوی کاڵا</th><th>بڕ</th><th>نرخی تاک</th><th>کۆی گشتی</th></tr>${itemsList.map(i => {const defItem = definedItems.find(d => d.name === i.itemName); const itemPhotoHtml = defItem?.photoUrl ? `<img src="${defItem.photoUrl}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;vertical-align:middle;margin-left:8px;" onerror="this.style.display='none'"/>` : ''; return `<tr><td>${itemPhotoHtml} ${i.itemName}</td><td>${i.qty}</td><td>${formatMoney(i.unitPrice, p.currency)}</td><td style="font-weight:bold;">${formatMoney(Number(i.qty) * Number(i.unitPrice), p.currency)}</td></tr>`}).join('')}<tr><td colspan="3" style="text-align:left;font-weight:bold;">کۆی گشتی پسوڵە:</td><td style="font-weight:bold;font-size:16px;">${formatMoney(p.total, p.currency)}</td></tr></table></div><div style="margin-top:15px;color:#334155;"><strong>تێبینی:</strong> ${p.note || '-'}</div>`;
    printContent('پسوڵەی کڕین', p.receiptNo, html, STORE_NAME, p.companyName, true);
  };

  // --- Sales Logic (Multi-item) ---
  const addSaleItem = () => setSaleItems([...saleItems, { id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
  const removeSaleItem = (id) => setSaleItems(saleItems.filter(i => i.id !== id));
  const updateSaleItem = (id, field, value) => {
    setSaleItems(saleItems.map(i => {
      if (i.id === id) {
        let updated = { ...i, [field]: value };
        if (field === 'itemName') { const stockItem = inventory.find(inv => inv.itemName === value); if(stockItem && stockItem.avgCost) updated.unitPrice = (stockItem.avgCost * 1.1).toFixed(2); }
        return updated;
      } return i;
    }));
  };
  const handleEditSale = (s) => {
     setEditingId(s.id); setSaleMode(s.saleType === 'credit' ? 'credit_agent' : (s.saleType || 'installment'));
     if (s.items && s.items.length > 0) setSaleItems(s.items); else setSaleItems([{ id: Date.now(), itemName: s.itemName, qty: s.qty, unitPrice: s.unitPrice || (s.price/s.qty) }]);
     window.scrollTo({top:0, behavior:'smooth'});
  };
  const handleSaveSale = async (e) => {
    e.preventDefault(); const form = e.target; const note = form.note.value; const customerPhotoUrl = form.customerPhotoUrl ? form.customerPhotoUrl.value : ''; const selectedCurrency = form.currency.value;
    if (saleItems.some(i => !i.itemName || !i.qty || !i.unitPrice)) return alertMsg('تکایە زانیاری هەموو کاڵاکان بە تەواوی پڕبکەرەوە.');
    const oldSale = editingId ? sales.find(s => s.id === editingId) : null;
    const oldItems = oldSale?.items || (oldSale ? [{ itemName: oldSale.itemName, qty: oldSale.qty }] : []);
    for (const item of saleItems) {
      const oldQty = oldItems.find(oi => oi.itemName === item.itemName)?.qty || 0;
      const itemInStock = inventory.find(i => i.itemName === item.itemName && i.currency === selectedCurrency); // Simplified stock check based on currency
      const availableQty = itemInStock ? itemInStock.currentQty + oldQty : 0;
      if (availableQty < Number(item.qty)) return alertMsg(`بڕی پێویست لە کۆگادا نییە بۆ کاڵای: ${item.itemName} بەم دراوە!`);
    }
    const totalPrice = saleItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0);
    const rNo = oldSale?.receiptNo || (sales.length > 0 ? Math.max(...sales.map(s => s.receiptNo || 0)) + 1 : 1);
    let newSale = { id: editingId || Date.now().toString(), items: saleItems, itemName: saleItems.length === 1 ? saleItems[0].itemName : 'فرۆشتنی جۆراوجۆر', qty: saleItems.reduce((sum, i) => sum + Number(i.qty), 0), unitPrice: saleItems.length === 1 ? Number(saleItems[0].unitPrice) : 0, price: totalPrice, note, date: getToday(), receiptNo: rNo, saleType: saleMode, documents: oldSale?.documents || [], currency: selectedCurrency };
    if (saleMode === 'installment') {
      const advance = parseFloat(form.advance.value) || 0; const months = parseInt(form.months.value) || 1; const monthlyAmount = (totalPrice - advance) / months;
      const installments = Array.from({ length: months }).map((_, i) => { const date = new Date(); date.setMonth(date.getMonth() + i + 1); return { id: Math.random().toString(), monthNum: i + 1, amount: monthlyAmount, dueDate: date.toISOString().split('T')[0] }; });
      newSale = { ...newSale, customerName: form.customerName.value, phone: form.phone.value, address: form.address.value, customerPhotoUrl, advance, months, monthlyAmount, installments };
    } else if (saleMode === 'cash') { newSale = { ...newSale, customerName: form.customerName.value, phone: form.phone.value, address: form.address.value, customerPhotoUrl }; } 
    else if (saleMode === 'credit_agent' || saleMode === 'credit_company') {
      const isAgent = saleMode === 'credit_agent'; const entityId = isAgent ? form.agentId.value : form.companyId.value; const entity = isAgent ? agents.find(a => a.id === entityId) : companies.find(c => c.id === entityId);
      const creditDays = parseInt(form.creditDays.value) || 7; const dueDateObj = new Date(); dueDateObj.setDate(dueDateObj.getDate() + creditDays);
      newSale = { ...newSale, agentId: isAgent ? entityId : null, companyId: !isAgent ? entityId : null, customerName: entity.name, phone: entity.phone, address: entity.address, customerPhotoUrl: entity.photoUrl || '', creditDays, dueDate: dueDateObj.toISOString().split('T')[0] };
    }
    if (editingId) { for (const tx of capitalTx.filter(tx => tx.refId === editingId && (tx.type === 'sale_advance' || tx.type === 'sale_cash'))) await deleteDoc(getDocRef('capitalTx', tx.id)); }
    await setDoc(getDocRef('sales', newSale.id), newSale); 
    await logAction(editingId ? `نوێکردنەوەی پسوڵەی فرۆشتن ژمارە ${rNo}` : `تۆمارکردنی پسوڵەی فرۆشتن ژمارە ${rNo}`);
    setEditingId(null); setSaleItems([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
    if (saleMode === 'installment' && newSale.advance > 0) await addTransaction('sale_advance', newSale.advance, `پێشەکی فرۆشتن بە: ${newSale.customerName}`, newSale.id, note, null, rNo, selectedCurrency);
    else if (saleMode === 'cash') await addTransaction('sale_cash', totalPrice, `فرۆشتنی کاش بە: ${newSale.customerName}`, newSale.id, note, null, rNo, selectedCurrency);
    form.reset();
  };
  const deleteSale = (id) => confirmAction('دڵنیایت؟ بە سڕینەوەی ئەم پسوڵەیە کاڵاکە دەگەڕێتەوە کۆگا.', async () => { const s = sales.find(x=>x.id===id); await deleteDoc(getDocRef('sales', id)); await deleteTransactionsByRef(id); await logAction(`سڕینەوەی پسوڵەی فرۆشتن ژمارە ${s?.receiptNo}`); });

  const printSale = (s) => {
    const isCreditAgent = s.saleType === 'credit' || s.saleType === 'credit_agent'; const isCreditCompany = s.saleType === 'credit_company'; const isCash = s.saleType === 'cash';
    let balanceHTML = '';
    if (isCreditAgent) balanceHTML = `<strong>کۆی قەرزی بریکار:</strong> <span dir="ltr" style="color:#000;font-weight:bold;font-size:16px;">${formatMoney(getAgentDebt(s.agentId, s.currency), s.currency)}</span>`;
    else if (isCreditCompany) { const cDebt = getCompanyDebt(s.companyId, s.currency); balanceHTML = `<strong>کۆی حسابی کۆمپانیا:</strong> <span dir="ltr" style="color:#000;font-weight:bold;font-size:16px;">${cDebt > 0 ? `لەسەرمانە: ${formatMoney(Math.abs(cDebt), s.currency)}` : `قەرزارمانن: ${formatMoney(Math.abs(cDebt), s.currency)}`}</span>`; } 
    else if (!isCash) balanceHTML = `<strong>بڕی قەرزی ماوە:</strong> <span dir="ltr" style="color:#000;font-weight:bold;font-size:16px;">${formatMoney(s.price - getSalePaidAmount(s.id), s.currency)}</span>`;
    const itemsList = s.items || [{ itemName: s.itemName, qty: s.qty, unitPrice: s.unitPrice || (s.price/s.qty), price: s.price }];
    const typeLabel = isCash ? 'کاش' : (isCreditAgent ? 'قەرز (بریکار)' : (isCreditCompany ? 'قەرز (کۆمپانیا)' : 'قیست'));
    const customerTypeLabel = isCreditAgent ? 'بریکار' : (isCreditCompany ? 'کۆمپانیا' : 'کڕیار');
    const photoHtml = s.customerPhotoUrl ? `<img src="${s.customerPhotoUrl}" class="print-img" alt="وێنە" onerror="this.style.display='none'" />` : '';
    const html = `<div class="info-grid"><div class="info-box flex gap-4 items-center">${photoHtml}<div><strong>ناوی ${customerTypeLabel}:</strong> ${s.customerName}<br><strong>مۆبایل:</strong> <span dir="ltr">${s.phone}</span><br></div></div><div class="info-box"><strong>بەرواری پسوڵە:</strong> ${s.date}<br><strong>جۆری فرۆشتن:</strong> ${typeLabel}<br>${balanceHTML}</div></div><div class="table-responsive"><table><tr><th>ناوی کاڵا</th><th>بڕ</th><th>نرخی تاک</th><th>کۆی نرخ</th></tr>${itemsList.map(i => {const defItem = definedItems.find(d => d.name === i.itemName); const itemPhotoHtml = defItem?.photoUrl ? `<img src="${defItem.photoUrl}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;vertical-align:middle;margin-left:8px;" onerror="this.style.display='none'"/>` : ''; return `<tr><td>${itemPhotoHtml} ${i.itemName}</td><td>${i.qty}</td><td>${formatMoney(i.unitPrice, s.currency)}</td><td style="font-weight:bold;">${formatMoney(Number(i.qty) * Number(i.unitPrice), s.currency)}</td></tr>`}).join('')}<tr style="background-color:#f8fafc;"><td colspan="3" style="text-align:left;font-weight:bold;">کۆی گشتی پسوڵە:</td><td style="font-weight:bold;font-size:16px;">${formatMoney(s.price, s.currency)}</td></tr>${s.saleType === 'installment' ? `<tr><td colspan="3" style="text-align:left;">پێشەکی وەرگیراو:</td><td style="font-weight:bold;">${formatMoney(s.advance, s.currency)}</td></tr><tr><td colspan="3" style="text-align:left;">قیستی مانگانە (${s.months} مانگ):</td><td style="font-weight:bold;">${formatMoney(s.monthlyAmount, s.currency)}</td></tr>` : ''}${isCreditAgent || isCreditCompany ? `<tr><td colspan="3" style="text-align:left;">وادەی گەڕاندنەوە:</td><td style="color:#000;font-weight:bold;" dir="ltr">${s.dueDate}</td></tr>` : ''}</table></div><div style="margin-top:15px;color:#334155;"><strong>تێبینی:</strong> ${s.note || '-'}</div>`;
    printContent(`پسوڵەی فرۆشتن (${typeLabel})`, s.receiptNo, html, STORE_NAME, s.customerName, true);
  };

  const printContract = (s) => {
    const itemNames = (s.items || [{ itemName: s.itemName }]).map(i => i.itemName).join('، ');
    const html = `<div style="text-align:center;margin-bottom:15px;"><h2 style="font-size:24px;font-weight:900;text-decoration:underline;margin:0;">گرێبەستی قیست</h2></div><div style="font-size:14.5px;font-weight:bold;line-height:1.8;color:#0f172a;text-align:justify;margin-bottom:20px;padding:15px 20px;background:#ecfdf5;border-radius:12px;border:2px solid #cbd5e1;"><ol style="margin:0;padding-right:20px;"><li style="margin-bottom:10px;">هەرکات لایەنی دووەم (<span>${s.customerName}</span>) پێویستی بە کارتی نیشتمانی هەبوو کە پێشتر وەک بارمتەیەک لای لایەنی یەکەم (<span>${STORE_NAME}</span>) داینابوو تەنها مۆڵەتی شۆفێری لەبری وەردەگیرێت بە مەرجێک ماوەکەی بەسەرنەچوبێت یان ئەو بڕە پارەیەی لە قیستەکە ماوە وەک ئەمانەتێک دەبێت بیدات بە لایەنی یەکەم تا ئەو کاتەی دووبارە کارتی نیشتمانی دەگێڕێتەوە.</li><li style="margin-bottom:10px;">لایەنی دووەم بەڵێن دەدات کە پابەند بێت بە گەڕاندنەوەی قیستەکانی لە ماوەی دیاریکراوی خۆیدا هەر ٣٠ ڕۆژ جارێک بێ دواکەوتن ، نەدانی مووچە و دواکەوتنی مووچە و لێبڕینی مووچە و لاوازی بازاڕ یاخوود هەر هۆکارێکی دیکە نەکاتە بەهانە بۆ دواخستنی قیستەکانی.</li><li style="margin-bottom:10px;">لایەنی دووەم ئامێری ئاماژەپێکراوی (<span>${itemNames}</span>) بێ هیچ کەم و کوڕییەک وەرگرت.</li><li style="margin-bottom:10px;">پێویستە لایەنی دووەم (<span>${s.customerName}</span>) کۆپی کارتی نیشتمانی و کارتی زانیاری بدات بە لایەنی یەکەم (<span>${STORE_NAME}</span>) وە پێویستە وەک بارمتەیەک لایەنی دووەم (<span>${s.customerName}</span>) کارتی نیشتمانی اصلى بدات بە لایەنی یەکەم (<span>${STORE_NAME}</span>) تا کۆتایی هاتنی ماوەی قیستەکە و پاکتاوکردنی هەژمارەکەی.</li><li style="margin-bottom:10px;">هەرکات لایەنی دووەم (<span>${s.customerName}</span>) ویستی بە هەر هۆکارێک ئەم گرێبەستە هەڵبووەشێنێتەوە ئەوا لایەنی یەکەم (<span>${STORE_NAME}</span>) بە مافی خۆی دەزانێت کە بڕی پێشەکی وەرگیراو نەگەڕێنێتەوە بۆ لایەنی دووەم (<span>${s.customerName}</span>) وە کاڵای گەڕاوە بە نرخی ڕۆژ خەمڵاندنی بۆ دەکرێت و دەدرێت بە لایەنی دووەم (<span>${s.customerName}</span>).</li></ol><p style="margin-top:15px;margin-bottom:0;font-weight:900;text-align:center;border-top:1px dashed #cbd5e1;padding-top:15px;">هەردوو لایەن پاش خوێندنەوەی تەواوی خاڵەکان و تێگەیشتنیان وە بە تەواوی هەست و هۆش و پاش ڕەزامەندییان بە ویستی خۆیان لای خوارەوە واژۆیان کرد.</p></div>`;
    printContent('گرێبەستی فرۆشتن', s.receiptNo, html, STORE_NAME, s.customerName, true);
  };

  const handleDocToggle = (docName) => setSelectedDocs(selectedDocs.some(d => d.name === docName) ? selectedDocs.filter(d => d.name !== docName) : [...selectedDocs, { name: docName, fileUrl: null }]);
  const handleFileChange = async (e, docName) => {
     const file = e.target.files[0]; if(!file) return; setUploadingDoc(docName);
     try {
       const fileRef = ref(storage, `artifacts/${appId}/public/data/documents/${viewingDocuments.id}/${Date.now()}`); await uploadBytes(fileRef, file); const url = await getDownloadURL(fileRef);
       setSelectedDocs(prev => prev.map(d => d.name === docName ? { ...d, fileUrl: url } : d));
     } catch (err) { alertMsg("کێشەیەک ڕوویدا لە بارکردنی وێنەکە."); } setUploadingDoc(null);
  };
  const handleSaveDocs = async () => { await updateDoc(getDocRef('sales', viewingDocuments.id), { documents: selectedDocs }); await logAction(`پاشەکەوتکردنی بەڵگەنامە بۆ کڕیار: ${viewingDocuments.customerName}`); alertMsg('بەڵگەنامەکان پاشەکەوت کران.'); setViewingDocuments(null); };
  const printDocsReceipt = (sale, selectedDocsArr) => {
    const docsHTML = selectedDocsArr.length > 0 ? selectedDocsArr.map(d => `<li style="margin-bottom:20px;"><div style="margin-bottom:10px;">☑ ${d.name}</div>${d.fileUrl ? `<img src="${d.fileUrl}" style="max-width:100%;max-height:250px;border-radius:8px;border:2px solid #cbd5e1;display:block;margin-top:5px;" alt="doc"/>` : ''}</li>`).join('') : '<li>هیچ بەڵگەنامەیەک دیاری نەکراوە.</li>';
    const html = `<div style="font-size:16px;line-height:1.8;color:#0f172a;margin-bottom:20px;padding:25px;background:#ecfdf5;border-radius:12px;border:2px solid #a7f3d0;"><p style="font-size:18px;font-weight:bold;margin-bottom:25px;border-bottom:1px solid #cbd5e1;padding-bottom:15px;">ئاماژە بە پسوڵەی ژمارە (<span style="font-size:20px;">${sale.receiptNo}</span>)، ئەم بەڵگەنامانەی خوارەوە وەرگیراون لە کڕیار (<strong>${sale.customerName}</strong>):</p><ul style="list-style-type:none;padding:0;font-size:17px;font-weight:bold;">${docsHTML}</ul></div>`;
    printContent('وەرگرتنی بەڵگەنامە', sale.receiptNo, html, STORE_NAME, sale.customerName, true);
  };


  const printPaymentReceipt = (tx, overrideBalance = null) => {
    const isInstallment = tx.type === 'receive_installment'; const isAgent = tx.type === 'receive_agent_payment' || tx.type === 'pay_agent_payment';
    let typeText = isInstallment ? 'وەرگرتنی پارە (قیست)' : 'پێدانی پارە (قەرز)';
    if (tx.type === 'receive_agent_payment') typeText = 'وەرگرتنی قەرز (لە بریکار)'; if (tx.type === 'pay_agent_payment') typeText = 'پێدانی پارە (بۆ بریکار)';
    if (tx.type === 'receive_company_payment') typeText = 'وەرگرتنی پارە (لە کۆمپانیا)'; if (tx.type === 'pay_office_debt') typeText = 'پێدانی پارە (بۆ نوسینگە)'; if (tx.type === 'receive_office_loan') typeText = 'وەرگرتنی پارە (لە نوسینگە)';
    const partyName = tx.desc.split(': ')[1] || tx.desc; let currentBalance = overrideBalance !== null ? overrideBalance : 0; let phoneNum = '-';
    if (overrideBalance === null) {
      const isTxNew = !capitalTx.find(t => t.id === tx.id);
      if (isInstallment && tx.refId) { const sale = sales.find(s => s.id === tx.refId); if (sale) { let paid = getSalePaidAmount(tx.refId); if (isTxNew) paid += tx.amount; currentBalance = sale.price - paid; phoneNum = sale.phone; } } 
      else if (isAgent && tx.refId) { const agent = agents.find(a => a.id === tx.refId); if (agent) { let debt = getAgentDebt(tx.refId, tx.currency); if (isTxNew) { debt += (tx.type === 'pay_agent_payment' ? Math.abs(tx.amount) : -Math.abs(tx.amount)); } currentBalance = debt; phoneNum = agent.phone; } } 
      else if ((tx.type === 'pay_company_debt' || tx.type === 'receive_company_payment') && tx.refId) { const comp = companies.find(c => c.id === tx.refId); if (comp) { let debt = getCompanyDebt(tx.refId, tx.currency); if (isTxNew) { debt += (tx.type === 'receive_company_payment' ? Math.abs(tx.amount) : -Math.abs(tx.amount)); } currentBalance = Math.abs(debt); phoneNum = comp.phone; } } 
      else if ((tx.type === 'pay_office_debt' || tx.type === 'receive_office_loan') && tx.refId) { const off = offices.find(o => o.id === tx.refId); if (off) { let debt = getOfficeDebt(tx.refId, tx.currency); if (isTxNew) { debt += (tx.type === 'pay_office_debt' ? Math.abs(tx.amount) : -Math.abs(tx.amount)); } currentBalance = debt; phoneNum = off.phone; } }
    }
    const html = `<div class="info-grid"><div class="info-box"><strong>جۆری پسوڵە:</strong> ${typeText}<br/><strong>ناوی لایەن:</strong> ${partyName}<br/><strong>ژمارەی مۆبایل:</strong> <span dir="ltr">${phoneNum}</span><br/></div><div class="info-box"><strong>بەروار:</strong> ${tx.date}<br/><strong>کۆتا باڵانسی ماوە:</strong> <span dir="ltr" style="color:#000;font-weight:bold;font-size:16px;">${formatMoney(Math.abs(currentBalance || 0), tx.currency)}</span></div></div><table><tr><th>بڕی پارەی دیاریکراو</th><th>تێبینی</th></tr><tr><td style="font-weight:bold;font-size:18px;" dir="ltr">${formatMoney(Math.abs(tx.amount), tx.currency)}</td><td>${tx.note || '-'}</td></tr></table>`;
    printContent(typeText, tx.receiptNo, html, STORE_NAME, partyName, true);
  };

  const handlePaymentSubmit = async (e, typeCategory) => {
    e.preventDefault(); const form = e.target; const refId = form.refId.value; const txDirection = form.txDirection?.value || 'receive'; const amount = parseFloat(form.amount.value); const note = form.note.value; const selectedCurrency = form.currency.value;
    let typeStr = ''; let desc = ''; let dbAmount = amount; let expectedNewBalance = 0;
    const isHawala = form.viaOffice?.checked && txDirection === 'pay'; const officeId = form.officeId?.value; const officeFee = parseFloat(form.officeFee?.value) || 0;
    if (isHawala && !officeId) return alertMsg('تکایە نوسینگە هەڵبژێرە!');
    const rNo = (editingPaymentId ? capitalTx.find(t => t.id === editingPaymentId)?.receiptNo : null) || (capitalTx.length > 0 ? Math.max(...capitalTx.map(t => t.receiptNo || 0)) + 1 : 1);

    if (typeCategory === 'installment') { typeStr = 'receive_installment'; const sale = sales.find(s => s.id === refId); desc = `وەرگرتنی قیست لە: ${sale?.customerName}`; expectedNewBalance = sale.price - (getSalePaidAmount(refId) + amount); } 
    else if (typeCategory === 'agent') { const agent = agents.find(a => a.id === refId); if (txDirection === 'receive') { typeStr = 'receive_agent_payment'; desc = `وەرگرتنی قەرز لە بریکار: ${agent?.name}`; expectedNewBalance = getAgentDebt(refId, selectedCurrency) - amount; } else { typeStr = 'pay_agent_payment'; desc = `پێدانی پارە بە بریکار: ${agent?.name}`; dbAmount = -amount; expectedNewBalance = getAgentDebt(refId, selectedCurrency) + amount; } } 
    else if (typeCategory === 'company') { const comp = companies.find(c => c.id === refId); if (txDirection === 'pay') { typeStr = 'pay_company_debt'; desc = `پێدانەوەی قەرز بە: ${comp?.name}`; dbAmount = -amount; expectedNewBalance = getCompanyDebt(refId, selectedCurrency) - amount; } else { typeStr = 'receive_company_payment'; desc = `وەرگرتنی پارە لە کۆمپانیا: ${comp?.name}`; expectedNewBalance = getCompanyDebt(refId, selectedCurrency) + amount; } } 
    else if (typeCategory === 'office') { const off = offices.find(o => o.id === refId); if (txDirection === 'receive') { typeStr = 'receive_office_loan'; desc = `وەرگرتنی پارە لە نوسینگە: ${off?.name}`; dbAmount = amount; expectedNewBalance = getOfficeDebt(refId, selectedCurrency) + amount; } else { typeStr = 'pay_office_debt'; desc = `پێدانەوەی قەرز بە نوسینگە: ${off?.name}`; dbAmount = -amount; expectedNewBalance = getOfficeDebt(refId, selectedCurrency) - amount; } }

    if (isHawala && !editingPaymentId) {
        const office = offices.find(o => o.id === officeId);
        const tx1 = await addTransaction(typeStr, dbAmount, desc + ` (لەڕێی نوسینگەی ${office.name})`, refId, note, null, rNo, selectedCurrency);
        if (officeFee > 0) await addTransaction('expense', -officeFee, `تێچووی حەواڵە بۆ نوسینگەی ${office.name}`, null, `بۆ پسوڵەی ${rNo}`, null, rNo, selectedCurrency);
        await addTransaction('receive_office_loan', amount + officeFee, `قەرزی حەواڵە بۆ ${desc}`, officeId, note, null, rNo, selectedCurrency);
        await logAction(`مامەڵەی پارەدان بە حەواڵە بۆ ${desc}`);
        confirmAction('پارەکە بە حەواڵە درا، دەتەوێت پسوڵەکە چاپ بکەیت؟', () => printPaymentReceipt({...tx1, amount: amount}, expectedNewBalance));
        form.reset(); setViaOfficeAgent(false); setViaOfficeComp(false); return;
    }

    if (editingPaymentId) { const oldTx = capitalTx.find(t => t.id === editingPaymentId); if (oldTx) { await addTransaction(typeStr, dbAmount, desc, refId, note, oldTx.id, oldTx.receiptNo, selectedCurrency); await logAction(`نوێکردنەوەی مامەڵەی دارایی ژمارە ${oldTx.receiptNo}`); setEditingPaymentId(null); alertMsg('مامەڵەکە نوێکرایەوە.'); } } 
    else { const newTx = await addTransaction(typeStr, dbAmount, desc, refId, note, null, rNo, selectedCurrency); await logAction(`تۆمارکردنی مامەڵەی دارایی ژمارە ${rNo}`); confirmAction('سەرکەوتوو بوو، دەتەوێت پسوڵەکە چاپ بکەیت؟', () => printPaymentReceipt(newTx, expectedNewBalance)); }
    form.reset();
  };
  const deletePaymentTx = (id) => confirmAction('دڵنیایت لە سڕینەوە؟', async () => { const t = capitalTx.find(x=>x.id===id); await deleteDoc(getDocRef('capitalTx', id)); await logAction(`سڕینەوەی مامەڵەی دارایی ژمارە ${t?.receiptNo}`); });
  const handleCapitalSubmit = async (e) => { e.preventDefault(); const type = e.target.type.value; const amount = parseFloat(e.target.amount.value); const reason = e.target.reason.value; const note = e.target.note.value; const selectedCurrency = e.target.currency.value; if (type === 'expense') await addTransaction('expense', -amount, `خەرجی: ${reason}`, null, note, null, null, selectedCurrency); else if (type === 'add') await addTransaction('capital_add', amount, `زیادکردنی سەرمایە: ${reason}`, null, note, null, null, selectedCurrency); else await addTransaction('capital_remove', -amount, `کێشانەوەی سەرمایە: ${reason}`, null, note, null, null, selectedCurrency); await logAction(`مامەڵەی سندوق: ${type} - ${amount} ${selectedCurrency}`); e.target.reset(); };
  const handleSearchChange = (type, value) => { setSearchTerms({ ...searchTerms, [type]: value }); if (value.trim() !== '') { if (type === 'installment' && installmentSelectRef.current) installmentSelectRef.current.size = 5; if (type === 'agent' && agentSelectRef.current) agentSelectRef.current.size = 5; if (type === 'company' && companySelectRef.current) companySelectRef.current.size = 5; if (type === 'office' && officeSelectRef.current) officeSelectRef.current.size = 5; } else { if (type === 'installment' && installmentSelectRef.current) installmentSelectRef.current.size = 1; if (type === 'agent' && agentSelectRef.current) agentSelectRef.current.size = 1; if (type === 'company' && companySelectRef.current) companySelectRef.current.size = 1; if (type === 'office' && officeSelectRef.current) officeSelectRef.current.size = 1; } };
  const handleSelectChange = (e, ref) => { if(ref.current) ref.current.size = 1; };

  // --- UI Render ---
  const renderDashboard = () => {
    const totalSales = sales.reduce((acc, s) => acc + (s.currency === settings.currency ? s.price : 0), 0); const totalDebtInMarket = sales.filter(s=>s.saleType==='installment' && s.currency === settings.currency).reduce((acc, s) => acc + (s.price - getSalePaidAmount(s.id)), 0); const totalAgentDebt = agents.reduce((acc, a) => acc + getAgentDebt(a.id, settings.currency), 0);
    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">سەرەتا - ئامارەکان (بە {currentCurrency.name})</h2>
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${hasPermission('capital') ? '4' : '3'} gap-4 md:gap-6`}>
          {hasPermission('capital') && (<div className={`${currentTheme.main} text-white p-5 md:p-6 rounded-xl shadow-lg flex items-center justify-between`}><div><p className="opacity-80 mb-1 font-medium text-sm md:text-base">سندوق (نەختینە)</p><h3 className="text-xl md:text-2xl font-bold">{formatMoney(currentCapital[settings.currency] || 0)}</h3></div><IconDollarSign size={32} className="opacity-80" /></div>)}
          <div className="bg-slate-900 text-white p-5 md:p-6 rounded-xl shadow-lg flex items-center justify-between"><div><p className="text-slate-300 mb-1 font-medium text-sm md:text-base">کۆی فرۆشراو</p><h3 className="text-xl md:text-2xl font-bold">{formatMoney(totalSales)}</h3></div><IconShoppingCart size={32} className="opacity-80" /></div>
          <div className="bg-black text-white p-5 md:p-6 rounded-xl shadow-lg flex items-center justify-between"><div><p className="text-slate-400 mb-1 font-medium text-sm md:text-base">قەرزی بازاڕ (قیست)</p><h3 className="text-xl md:text-2xl font-bold">{formatMoney(totalDebtInMarket)}</h3></div><IconList size={32} className="opacity-80" /></div>
          <div className={`${currentTheme.main} text-white p-5 md:p-6 rounded-xl shadow-lg flex items-center justify-between opacity-90`}><div><p className="opacity-80 mb-1 font-medium text-sm md:text-base">قەرزی بریکارەکان</p><h3 className="text-xl md:text-2xl font-bold">{formatMoney(totalAgentDebt)}</h3></div><IconAgent size={32} className="opacity-80" /></div>
        </div>
      </div>
    );
  };

  const renderDefinedItems = () => {
    const itemToEdit = editingId ? definedItems.find(i => i.id === editingId) : null;
    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">پێناسەی کاڵاکان</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={editingId || 'new'} onSubmit={handleSaveDefinedItem} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div><label className="block text-sm mb-1 text-slate-600">جۆری کاڵا</label><input required name="itemType" defaultValue={itemToEdit?.type} className={inpCls} /></div>
            <div><label className="block text-sm mb-1 text-slate-600">براند</label><input required name="brand" defaultValue={itemToEdit?.brand} className={inpCls} /></div>
            <div><label className="block text-sm mb-1 text-slate-600">ناوی کاڵا</label><input required name="name" defaultValue={itemToEdit?.name} className={inpCls} /></div>
            <ImageUploadField name="photoUrl" defaultValue={itemToEdit?.photoUrl} label="وێنەی کاڵا" placeholder="لینک یان بارکردن..." />
            <div className="flex gap-2"><button type="submit" disabled={isUploadingGlobal} className={`flex-1 ${currentTheme.main} ${currentTheme.hover} text-white p-2.5 rounded-lg font-medium disabled:opacity-50`}>{editingId ? 'نوێکردنەوە' : 'زیادکردن'}</button>{editingId && <button type="button" onClick={() => setEditingId(null)} className="bg-slate-900 text-white p-2.5 rounded-lg">بەتاڵ</button>}</div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200"><table className="w-full text-right whitespace-nowrap min-w-[600px]"><thead className={`${currentTheme.lightBg} border-b border-slate-200 text-slate-800`}><tr>{['وێنە', 'جۆری کاڵا', 'براند', 'ناوی کاڵا', 'کردارەکان'].map(h=><th key={h} className={thCls}>{h}</th>)}</tr></thead><tbody>{definedItems.map(i => (<tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50"><td className={tdCls}>{i.photoUrl ? <img src={i.photoUrl} alt="Item" className="w-10 h-10 object-cover rounded-lg border border-slate-200" /> : <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><IconBox /></div>}</td><td className={tdCls}>{i.type}</td><td className={tdCls}>{i.brand}</td><td className={`${tdCls} font-bold ${currentTheme.text}`}>{i.name}</td><td className={`${tdCls} flex gap-2`}><button onClick={() => setEditingId(i.id)} className={`${currentTheme.text} ${currentTheme.lightBg} p-2 rounded-full`}><IconEdit /></button><button onClick={() => deleteDefinedItem(i.id)} className="text-rose-600 bg-rose-100 p-2 rounded-full"><IconTrash /></button></td></tr>))}</tbody></table></div>
      </div>
    );
  };

  const renderUsers = () => {
    if (loggedAppUser?.role !== 'admin') return null; const userToEdit = editingId ? appUsers.find(u => u.id === editingId) : null;
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">بەکارهێنەران و چالاکییەکان</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={editingId || 'new_user'} onSubmit={handleSaveAppUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div><label className="block text-sm mb-1 text-slate-600">یوزەر</label><input required name="username" defaultValue={userToEdit?.username} className={inpCls} dir="ltr" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">پاسوۆرد</label><input required name="password" defaultValue={userToEdit?.password} className={inpCls} dir="ltr" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">ڕۆڵ</label><select required name="role" defaultValue={userToEdit?.role || 'user'} className={inpCls}><option value="user">ئاسایی</option><option value="admin">ئەدمین</option></select></div>
            <div className="flex gap-2"><button type="submit" className={`flex-1 ${currentTheme.main} ${currentTheme.hover} text-white p-2.5 rounded-lg font-medium`}>{editingId ? 'نوێکردنەوە' : 'دروستکردن'}</button>{editingId && <button type="button" onClick={() => setEditingId(null)} className="bg-slate-900 text-white p-2.5 rounded-lg">بەتاڵ</button>}</div>
            
            <div className="col-span-1 md:col-span-4 mt-2">
                <label className="block text-sm mb-2 text-slate-600 font-bold border-b pb-2">دەسەڵاتەکان (تەنها بۆ یوسەری ئاسایی کار دەکات)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {MODULES.map(mod => (
                        <label key={mod.id} className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded border border-slate-200 text-sm hover:bg-slate-100">
                            <input type="checkbox" name={`perm_${mod.id}`} defaultChecked={userToEdit ? (userToEdit.permissions?.includes(mod.id)) : true} className="w-4 h-4" />
                            {mod.label}
                        </label>
                    ))}
                </div>
            </div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200"><table className="w-full text-right whitespace-nowrap min-w-[400px]"><thead className={`${currentTheme.lightBg} border-b border-slate-200 text-slate-800`}><tr>{['ناوی بەکارهێنەر', 'ڕۆڵ', 'دەسەڵاتەکان', 'کردارەکان'].map(h=><th key={h} className={thCls}>{h}</th>)}</tr></thead><tbody>{appUsers.map(u => (<tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50"><td className={`${tdCls} font-medium`} dir="ltr">{u.username}</td><td className={tdCls}>{u.role === 'admin' ? 'ئەدمین' : 'ئاسایی'}</td><td className={tdCls}>{u.role === 'admin' ? 'تەواوی دەسەڵات' : (u.permissions ? u.permissions.length + ' بەش' : 'هەمووی')}</td><td className={`${tdCls} flex gap-2`}><button onClick={() => setEditingId(u.id)} className={`${currentTheme.text} ${currentTheme.lightBg} p-2 rounded-full`}><IconEdit /></button><button onClick={() => deleteAppUser(u.id)} className="text-rose-600 bg-rose-100 p-2 rounded-full"><IconTrash /></button></td></tr>))}<tr className="border-b border-slate-100 bg-slate-50"><td className={`${tdCls} font-medium text-slate-500`} dir="ltr">{DEFAULT_ADMIN_USER}</td><td className={`${tdCls} text-slate-500`}>سەرەکی</td><td className={`${tdCls} text-slate-500`}>تەواوی دەسەڵات</td><td className={`${tdCls} text-slate-400 text-sm`}>بنچینەیی</td></tr></tbody></table></div>
        
        <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2"><IconActivity/> تۆماری چالاکییەکان (Logs)</h3>
        <div className="bg-slate-900 rounded-xl shadow-sm overflow-hidden border border-slate-800 max-h-[400px] flex flex-col">
            <div className="overflow-y-auto p-4 space-y-2">
                {userLogs.length === 0 && <p className="text-slate-500 text-center py-4">هیچ چالاکییەک تۆمار نەکراوە.</p>}
                {userLogs.map(log => (
                    <div key={log.id} className="text-sm border-b border-slate-800 pb-2">
                        <span className="text-emerald-500 font-bold" dir="ltr">[{log.date}]</span> 
                        <span className="text-blue-400 font-bold mx-2">{log.username}:</span> 
                        <span className="text-slate-300">{log.action}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
  };

  const renderCompanies = () => {
    const compToEdit = editingId ? companies.find(c => c.id === editingId) : null;
    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">کۆمپانیاکان</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={editingId || 'new'} onSubmit={handleSaveCompany} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div><label className="block text-sm mb-1 text-slate-600">ناو</label><input required name="name" defaultValue={compToEdit?.name} className={inpCls} /></div>
            <div><label className="block text-sm mb-1 text-slate-600">مۆبایل</label><input required name="phone" defaultValue={compToEdit?.phone} className={inpCls} /></div>
            <div><label className="block text-sm mb-1 text-slate-600">ناونیشان</label><input name="address" defaultValue={compToEdit?.address} className={inpCls} /></div>
            <ImageUploadField name="photoUrl" defaultValue={compToEdit?.photoUrl} label="وێنەی کۆمپانیا" placeholder="لینک یان بارکردن..." />
            <div className="flex gap-2"><button type="submit" disabled={isUploadingGlobal} className={`flex-1 ${currentTheme.main} ${currentTheme.hover} text-white p-2.5 rounded-lg font-medium disabled:opacity-50`}>{editingId ? 'نوێکردنەوە' : 'زیادکردن'}</button>{editingId && <button type="button" onClick={() => setEditingId(null)} className="bg-slate-900 text-white p-2.5 rounded-lg">بەتاڵ</button>}</div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200"><table className="w-full text-right whitespace-nowrap min-w-[700px]"><thead className={`${currentTheme.lightBg} border-b border-slate-200 text-slate-800`}><tr>{['وێنە','ناو','مۆبایل','ناونیشان','قەرزی ماوە','کردارەکان'].map(h=><th key={h} className={thCls}>{h}</th>)}</tr></thead><tbody>{companies.map(c => { const debt = getCompanyDebt(c.id, settings.currency); return (<tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50"><td className={tdCls}>{c.photoUrl ? <img src={c.photoUrl} alt="Company" className="w-10 h-10 object-cover rounded-lg border border-slate-200" /> : <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><IconBuilding /></div>}</td><td className={`${tdCls} font-medium`}>{c.name}</td><td className={tdCls}>{c.phone}</td><td className={tdCls}>{c.address}</td><td className={`${tdCls} font-bold`} dir="ltr">{debt > 0 ? <span className="text-black">لەسەرمانە: ${formatMoney(debt)}</span> : debt < 0 ? <span className="text-blue-600">قەرزارمانن: ${formatMoney(Math.abs(debt))}</span> : <span className="text-slate-500">${formatMoney(0)}</span>}</td><td className={`${tdCls} flex gap-2 mt-1`}><button onClick={() => setEditingId(c.id)} className={`${currentTheme.text} ${currentTheme.lightBg} p-2 rounded-full`}><IconEdit /></button><button onClick={() => deleteCompany(c.id)} className="text-rose-600 bg-rose-100 p-2 rounded-full"><IconTrash /></button></td></tr>)})}</tbody></table></div>
      </div>
    );
  };

  const renderAgents = () => {
    const agentToEdit = editingId ? agents.find(a => a.id === editingId) : null;
    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">بریکارەکان</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={editingId || 'new'} onSubmit={handleSaveAgent} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div><label className="block text-sm mb-1 text-slate-600">ناو</label><input required name="name" defaultValue={agentToEdit?.name} className={inpCls} /></div>
            <div><label className="block text-sm mb-1 text-slate-600">مۆبایل</label><input required name="phone" defaultValue={agentToEdit?.phone} className={inpCls} /></div>
            <div><label className="block text-sm mb-1 text-slate-600">ناونیشان</label><input name="address" defaultValue={agentToEdit?.address} className={inpCls} /></div>
            <div><label className="block text-sm mb-1 text-slate-600">تێبینی</label><input name="notes" defaultValue={agentToEdit?.notes} className={inpCls} /></div>
            <div className="lg:col-span-1"><ImageUploadField name="photoUrl" defaultValue={agentToEdit?.photoUrl} label="وێنە" placeholder="لینک..." /></div>
            <div className="flex gap-2"><button type="submit" disabled={isUploadingGlobal} className={`flex-1 ${currentTheme.main} ${currentTheme.hover} text-white p-2.5 rounded-lg font-medium disabled:opacity-50`}>{editingId ? 'نوێکردنەوە' : 'زیادکردن'}</button>{editingId && <button type="button" onClick={() => setEditingId(null)} className="bg-slate-900 text-white p-2.5 rounded-lg">بەتاڵ</button>}</div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200"><table className="w-full text-right whitespace-nowrap min-w-[700px]"><thead className={`${currentTheme.lightBg} border-b border-slate-200 text-slate-800`}><tr>{['وێنە','ناو','مۆبایل','ناونیشان','قەرزی لایە','کردارەکان'].map(h=><th key={h} className={thCls}>{h}</th>)}</tr></thead><tbody>{agents.map(a => { const debt = getAgentDebt(a.id, settings.currency); return (<tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50"><td className={tdCls}>{a.photoUrl ? <img src={a.photoUrl} alt="Agent" className="w-10 h-10 object-cover rounded-lg border border-slate-200" /> : <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><IconAgent /></div>}</td><td className={`${tdCls} font-medium`}>{a.name}</td><td className={tdCls}>{a.phone}</td><td className={tdCls}>{a.address}</td><td className={`${tdCls} font-bold text-black`} dir="ltr">{formatMoney(debt)}</td><td className={`${tdCls} flex gap-2 mt-1`}><button onClick={() => setEditingId(a.id)} className={`${currentTheme.text} ${currentTheme.lightBg} p-2 rounded-full`}><IconEdit /></button><button onClick={() => deleteAgent(a.id)} className="text-rose-600 bg-rose-100 p-2 rounded-full"><IconTrash /></button></td></tr>)})}</tbody></table></div>
      </div>
    );
  };

  const renderOffices = () => {
    const officeToEdit = editingId ? offices.find(o => o.id === editingId) : null;
    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">نوسینگەکان (حەواڵە)</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={editingId || 'new'} onSubmit={handleSaveOffice} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div><label className="block text-sm mb-1 text-slate-600">ناو</label><input required name="name" defaultValue={officeToEdit?.name} className={inpCls} /></div>
            <div><label className="block text-sm mb-1 text-slate-600">مۆبایل</label><input name="phone" defaultValue={officeToEdit?.phone} className={inpCls} /></div>
            <div><label className="block text-sm mb-1 text-slate-600">ناونیشان</label><input name="address" defaultValue={officeToEdit?.address} className={inpCls} /></div>
            <div className="flex gap-2"><button type="submit" className={`flex-1 ${currentTheme.main} ${currentTheme.hover} text-white p-2.5 rounded-lg font-medium`}>{editingId ? 'نوێکردنەوە' : 'زیادکردن'}</button>{editingId && <button type="button" onClick={() => setEditingId(null)} className="bg-slate-900 text-white p-2.5 rounded-lg">بەتاڵ</button>}</div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200"><table className="w-full text-right whitespace-nowrap min-w-[500px]"><thead className={`${currentTheme.lightBg} border-b border-slate-200 text-slate-800`}><tr>{['ناو','مۆبایل','ناونیشان','قەرز لەسەرمان','کردارەکان'].map(h=><th key={h} className={thCls}>{h}</th>)}</tr></thead><tbody>{offices.map(o => { const debt = getOfficeDebt(o.id, settings.currency); return (<tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50"><td className={`${tdCls} font-medium`}>{o.name}</td><td className={tdCls}>{o.phone}</td><td className={tdCls}>{o.address}</td><td className={`${tdCls} font-bold text-orange-600`} dir="ltr">{formatMoney(debt)}</td><td className={`${tdCls} flex gap-2`}><button onClick={() => setEditingId(o.id)} className={`${currentTheme.text} ${currentTheme.lightBg} p-2 rounded-full`}><IconEdit /></button><button onClick={() => deleteOffice(o.id)} className="text-rose-600 bg-rose-100 p-2 rounded-full"><IconTrash /></button></td></tr>)})}</tbody></table></div>
      </div>
    );
  };

  const renderPurchases = () => {
    const handleEditPurchase = (p) => { setEditingId(p.id); setPurMode(p.paymentType); setPurEntityType(p.entityType || (p.paymentType === 'debt' ? 'company' : 'none')); if(p.items && p.items.length > 0) setPurItems(p.items); else setPurItems([{ id: Date.now(), itemName: p.itemName, qty: p.qty, unitPrice: p.price || (p.total/p.qty) }]); window.scrollTo({top:0, behavior:'smooth'}); };
    const purToEdit = editingId ? purchases.find(p => p.id === editingId) : null;
    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">کڕین لە کۆمپانیا یان بریکار</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={`${editingId || 'new'}-${purMode}-${purEntityType}`} onSubmit={handleSavePurchase} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
            <div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">جۆری مامەڵە</label><select required name="paymentType" value={purMode} onChange={e=>{setPurMode(e.target.value); if(e.target.value==='debt' && purEntityType==='none') setPurEntityType('company');}} className={inpCls}><option value="cash">کاش</option><option value="debt">قەرز</option></select></div>
            <div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">کڕین لە کێ؟</label><select value={purEntityType} onChange={e=>setPurEntityType(e.target.value)} className={inpCls}><option value="company">کۆمپانیا</option><option value="agent">بریکار</option>{purMode === 'cash' && <option value="none">کەسی نەناسراو</option>}</select></div>
            <div className="lg:col-span-3"><label className="block text-sm mb-1 text-slate-600">هەڵبژاردنی ناو {purMode === 'debt' && <span className="text-rose-500 font-bold">*</span>}</label>{purEntityType === 'none' ? (<input name="companyNameStr" placeholder="ناوی فرۆشیار بنووسە..." defaultValue={purToEdit ? purToEdit.companyName : ''} className={inpCls} />) : (<select required={purMode === 'debt'} name="entityId" defaultValue={purToEdit?.companyId} className={inpCls}><option value="">هەڵبژێرە...</option>{(purEntityType === 'company' ? companies : agents).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>)}</div>
            <div className="lg:col-span-1"><label className="block text-sm mb-1 text-slate-600">دراو</label><select name="currency" defaultValue={purToEdit?.currency || settings.currency} className={inpCls}>{Object.values(CURRENCIES).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
            
            <div className={`lg:col-span-8 ${currentTheme.lightBg} p-4 rounded-xl border border-slate-200 mt-2 space-y-3`}><h4 className={`font-bold ${currentTheme.text} mb-2 border-b pb-2`}>لیستی کاڵاکان</h4>
               {purItems.map((item, index) => (
                   <div key={item.id} className="flex flex-col sm:flex-row gap-3 sm:items-end p-3 sm:p-0 border sm:border-0 rounded-lg sm:rounded-none bg-white sm:bg-transparent">
                       <div className="flex-1"><label className="block text-xs mb-1 text-slate-600">ناوی کاڵا</label><select required value={item.itemName} onChange={(e) => updatePurItem(item.id, 'itemName', e.target.value)} className={inpCls}><option value="">هەڵبژێرە...</option>{definedItems.map(i => <option key={i.id} value={i.name}>{i.brand} - {i.name}</option>)}</select></div>
                       <div className="flex gap-3"><div className="w-24 flex-1 sm:flex-none"><label className="block text-xs mb-1 text-slate-600">بڕ (دانە)</label><input required type="number" step="any" value={item.qty} onChange={(e) => updatePurItem(item.id, 'qty', e.target.value)} className={inpCls} /></div><div className="w-32 flex-1 sm:flex-none"><label className="block text-xs mb-1 text-slate-600">نرخی تاک</label><input required type="number" step="any" value={item.unitPrice} onChange={(e) => updatePurItem(item.id, 'unitPrice', e.target.value)} className={inpCls} /></div></div>
                       {purItems.length > 1 && (<button type="button" onClick={() => removePurItem(item.id)} className="p-2 w-full sm:w-auto bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors mt-2 sm:mt-0"><IconTrash/> سڕینەوە</button>)}
                   </div>
               ))}
               <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4"><button type="button" onClick={addPurItem} className={`w-full sm:w-auto text-sm font-bold ${currentTheme.text} bg-white px-4 py-2.5 rounded-lg border border-slate-300 shadow-sm`}>+ زیادکردنی کاڵای تر</button><div className={`text-left font-black text-xl ${currentTheme.text} bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200`} dir="ltr">کۆی گشتی: {purItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0).toFixed(2)}</div></div>
            </div>
            <div className="lg:col-span-6"><label className="block text-sm mb-1 text-slate-600">تێبینی</label><input name="note" defaultValue={purToEdit?.note} className={inpCls} placeholder="هەر تێبینییەک..." /></div>
            <div className="lg:col-span-2 flex gap-2"><button type="submit" className={`flex-1 ${currentTheme.main} ${currentTheme.hover} text-white p-3 rounded-lg font-bold`}>{editingId ? 'نوێکردنەوە' : 'پاشەکەوتکردن'}</button>{editingId && <button type="button" onClick={() => {setEditingId(null); setPurItems([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }])}} className="bg-slate-900 text-white p-3 rounded-lg">بەتاڵ</button>}</div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200"><table className="w-full text-right whitespace-nowrap min-w-[800px]"><thead className={`${currentTheme.lightBg} border-b border-slate-200 text-slate-800`}><tr>{['ژ.پ','بەروار','فرۆشیار','کاڵاکان','کۆی گشتی','پێدان','تێبینی','کردارەکان'].map(h=><th key={h} className={thCls}>{h}</th>)}</tr></thead><tbody>{purchases.map(p => { const itemsList = p.items || [{ itemName: p.itemName, qty: p.qty, unitPrice: p.price || (p.total/p.qty) }]; return (<tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50"><td className={`${tdCls} font-bold text-slate-400`}>{p.receiptNo}</td><td className={tdCls}>{p.date}</td><td className={`${tdCls} font-semibold`}>{p.companyName} <span className="text-xs text-slate-400">({p.entityType === 'agent' ? 'بریکار' : 'کۆمپانیا'})</span></td><td className={tdCls}>{itemsList.map(i=>i.itemName).join('، ')}</td><td className={`${tdCls} font-bold ${currentTheme.text}`} dir="ltr">{formatMoney(p.total, p.currency)}</td><td className={tdCls}>{p.paymentType === 'debt' ? <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded text-xs font-bold">قەرز</span> : <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">کاش</span>}</td><td className={`${tdCls} text-slate-500`}>{p.note}</td><td className={`${tdCls} flex gap-2`}><button onClick={() => printPurchase(p)} className="text-slate-900 bg-slate-200 p-2 rounded-full"><IconPrinter /></button><button onClick={() => handleEditPurchase(p)} className={`${currentTheme.text} ${currentTheme.lightBg} p-2 rounded-full`}><IconEdit /></button><button onClick={() => deletePurchase(p.id)} className="text-rose-500 bg-rose-50 p-2 rounded-full"><IconTrash /></button></td></tr>)})}</tbody></table></div>
      </div>
    );
  };

  const renderInventory = () => {
    const printInventory = (withPrice) => {
        const html = `
          <div style="text-align:center;margin-bottom:20px;">
            <h2 style="font-size:22px;color:#0f172a;">ڕاپۆرتی کۆگا (کاڵا بەردەستەکان)</h2>
            <p style="font-size:14px;color:#64748b;">بەروار: ${getToday()}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;text-align:right;font-size:14px;">
            <thead>
              <tr style="background-color:#f1f5f9;border-bottom:2px solid #cbd5e1;">
                <th style="padding:10px;border:1px solid #e2e8f0;">ناوی کاڵا</th>
                <th style="padding:10px;border:1px solid #e2e8f0;">بڕی بەردەست</th>
                ${withPrice ? `<th style="padding:10px;border:1px solid #e2e8f0;">تێکڕای تێچوو</th><th style="padding:10px;border:1px solid #e2e8f0;">کۆی سەرمایەی کاڵا</th>` : ''}
              </tr>
            </thead>
            <tbody>
              ${inventory.map(i => `
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;">${i.itemName} <span style="font-size:11px;color:#64748b">(${i.currency})</span></td>
                  <td style="padding:10px;border:1px solid #e2e8f0;">${i.currentQty}</td>
                  ${withPrice ? `<td style="padding:10px;border:1px solid #e2e8f0;" dir="ltr">${formatMoney(i.avgCost, i.currency)}</td><td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;" dir="ltr">${formatMoney(i.currentQty * i.avgCost, i.currency)}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        printContent(`ڕاپۆرتی کۆگا ${withPrice ? '(بە نرخ)' : '(بێ نرخ)'}`, '', html, STORE_NAME, '', false);
    };

    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">کۆگا (کاڵا بەردەستەکان)</h2>
        <div className="flex gap-3 mb-4">
           <button onClick={() => printInventory(false)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-black"><IconPrinter/> چاپکردن (بێ نرخ)</button>
           {hasPermission('inventory_print_price') && <button onClick={() => printInventory(true)} className={`${currentTheme.main} text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2`}><IconPrinter/> چاپکردن (بە نرخەوە)</button>}
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200">
          <table className="w-full text-right min-w-[500px]">
            <thead className={`${currentTheme.lightBg} border-b border-slate-200 text-slate-800`}><tr>{['وێنە','ناوی کاڵا','تێکڕای نرخی کڕین (تێچوو)','بڕی ماوە لە کۆگا'].map(h=><th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody>
              {inventory.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-slate-500">کۆگا بەتاڵە</td></tr>}
              {inventory.map(i => {
                const defItem = definedItems.find(d => d.name === i.itemName); const photo = defItem?.photoUrl || i.photoUrl || '';
                return (<tr key={`${i.itemName}_${i.currency}`} className="border-b border-slate-100 hover:bg-slate-50"><td className={tdCls}>{photo ? <img src={photo} alt="Item" className="w-10 h-10 object-cover rounded-lg border border-slate-200" /> : <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><IconBox /></div>}</td><td className={`${tdCls} font-semibold text-slate-800`}>{i.itemName} <span className="text-xs text-slate-400">({i.currency})</span></td><td className={tdCls} dir="ltr">{hasPermission('inventory_print_price') ? formatMoney(i.avgCost, i.currency) : '---'}</td><td className={`${tdCls} font-bold ${currentTheme.text} text-lg`}>{i.currentQty}</td></tr>)
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSales = () => {
    if (viewingInstallments) {
      const sale = sales.find(s => s.id === viewingInstallments); const isInstallment = sale.saleType === 'installment'; const totalPaid = getSalePaidAmount(sale.id); const balance = sale.price - totalPaid; const paymentsMade = capitalTx.filter(tx => tx.refId === sale.id && (tx.type === 'receive_installment' || tx.type === 'receive_agent_payment'));
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4"><h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-3">{sale.customerPhotoUrl && <img src={sale.customerPhotoUrl} className="w-12 h-12 rounded-full object-cover border-2 shadow-sm" alt="C" />}وردەکاری: {sale.customerName}</h2><button onClick={() => setViewingInstallments(null)} className="text-white bg-slate-900 px-4 py-2 rounded-lg font-medium self-start sm:self-auto hover:bg-black">گەڕانەوە</button></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4"><div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200"><p className="text-sm text-slate-500">کۆی گشتی فرۆشتن</p><h3 className="text-xl font-bold" dir="ltr">{formatMoney(sale.price, sale.currency)}</h3></div><div className={`${currentTheme.lightBg} p-4 md:p-5 rounded-xl border ${currentTheme.border}`}><p className={`text-sm ${currentTheme.text}`}>کۆی بڕی وەرگیراو</p><h3 className={`text-xl font-bold ${currentTheme.text}`} dir="ltr">{formatMoney(totalPaid, sale.currency)}</h3></div><div className="bg-slate-100 p-4 md:p-5 rounded-xl border border-slate-300"><p className="text-sm text-slate-800">قەرزی ماوە</p><h3 className="text-xl font-bold text-black" dir="ltr">{formatMoney(balance, sale.currency)}</h3></div></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 overflow-x-auto"><h3 className="font-bold text-lg mb-3 border-b pb-2">{isInstallment ? 'خشتەی قیستەکان' : 'زانیاری قەرز'}</h3>{isInstallment ? (<table className="w-full text-right text-sm min-w-[300px]"><thead className={`${currentTheme.lightBg} ${currentTheme.text}`}><tr>{['مانگ','بەروار','بڕی پێویست'].map(h=><th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{sale.installments?.map(inst => (<tr key={inst.id} className="border-b"><td className="p-2">مانگی {inst.monthNum}</td><td className="p-2" dir="ltr">{inst.dueDate}</td><td className="p-2 font-bold" dir="ltr">{formatMoney(inst.amount, sale.currency)}</td></tr>))}</tbody></table>) : (<div className="p-4"><p><strong>وادەی گەڕاندنەوە:</strong> <span dir="ltr">${sale.dueDate}</span> ({sale.creditDays} ڕۆژ)</p></div>)}</div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 overflow-x-auto"><h3 className="font-bold text-lg mb-3 border-b pb-2">مێژووی وەرگرتنی پارەکان</h3><table className="w-full text-right text-sm min-w-[300px]"><thead className={`${currentTheme.lightBg} ${currentTheme.text}`}><tr>{['بەروار','بڕ','تێبینی'].map(h=><th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{sale.advance > 0 && <tr><td className="p-2">{sale.date}</td><td className={`p-2 ${currentTheme.text} font-bold`} dir="ltr">{formatMoney(sale.advance, sale.currency)}</td><td className="p-2">پێشەکی وەرگیراو لەکاتی فرۆشتن</td></tr>}{sale.saleType === 'cash' && <tr><td className="p-2">{sale.date}</td><td className={`p-2 ${currentTheme.text} font-bold`} dir="ltr">{formatMoney(sale.price, sale.currency)}</td><td className="p-2">فرۆشتنی کاش بە یەکجار</td></tr>}{paymentsMade.map(p => (<tr key={p.id} className="border-b"><td className="p-2">{p.date}</td><td className={`p-2 ${currentTheme.text} font-bold`} dir="ltr">{formatMoney(p.amount, sale.currency)}</td><td className="p-2">{p.note}</td></tr>))}</tbody></table></div>
          </div>
        </div>
      );
    }

    const saleToEdit = editingId ? sales.find(s => s.id === editingId) : null;
    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">فرۆشتن (کاش، قەرز، قیست)</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap gap-4 mb-6 border-b pb-4">
            {['installment-فرۆشتن بە قیست', 'cash-فرۆشتنی کاش', 'credit_agent-قەرز بۆ بریکار', 'credit_company-قەرز بۆ کۆمپانیا'].map(mode => { const [m, lbl] = mode.split('-'); return (<label key={m} className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-slate-50 py-2 px-3 rounded-lg"><input type="radio" name="smode" checked={saleMode === m || (m === 'credit_agent' && saleMode === 'credit')} onChange={()=>setSaleMode(m)} className="w-5 h-5 accent-black" /> {lbl}</label>) })}
          </div>
          <form key={`${editingId || 'new'}-${saleMode}`} onSubmit={handleSaveSale} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
            {saleMode === 'credit_agent' || saleMode === 'credit' ? (<div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">ناوی بریکار</label><select required name="agentId" defaultValue={saleToEdit?.agentId} className={inpCls}><option value="">هەڵبژێرە...</option>{agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>) : saleMode === 'credit_company' ? (<div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">ناوی کۆمپانیا</label><select required name="companyId" defaultValue={saleToEdit?.companyId} className={inpCls}><option value="">هەڵبژێرە...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>) : (<><div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">ناوی کڕیار</label><input required name="customerName" defaultValue={saleToEdit?.customerName} className={inpCls} /></div><div><label className="block text-sm mb-1 text-slate-600">ژمارەی مۆبایل</label><input required name="phone" defaultValue={saleToEdit?.phone} className={inpCls} /></div><div><label className="block text-sm mb-1 text-slate-600">ناونیشان</label><input required={saleMode==='installment'} name="address" defaultValue={saleToEdit?.address} className={inpCls} /></div></>)}
            <div className="lg:col-span-1"><label className="block text-sm mb-1 text-slate-600">دراو</label><select name="currency" defaultValue={saleToEdit?.currency || settings.currency} className={inpCls}>{Object.values(CURRENCIES).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
            {(saleMode === 'installment' || saleMode === 'cash') && (<div className="lg:col-span-2"><ImageUploadField name="customerPhotoUrl" defaultValue={saleToEdit?.customerPhotoUrl} label="وێنەی کڕیار" placeholder="لینک..." /></div>)}
            <div className={`md:col-span-4 lg:col-span-7 ${currentTheme.lightBg} p-4 rounded-xl border border-slate-200 mt-2 space-y-3`}><h4 className={`font-bold ${currentTheme.text} mb-2 border-b pb-2`}>لیستی کاڵاکان</h4>
               {saleItems.map((item, index) => (
                   <div key={item.id} className="flex flex-col sm:flex-row gap-3 sm:items-end p-3 sm:p-0 border sm:border-0 rounded-lg sm:rounded-none bg-white sm:bg-transparent">
                       <div className="flex-1"><label className="block text-xs mb-1 text-slate-600">ناوی کاڵا</label><select required value={item.itemName} onChange={(e) => updateSaleItem(item.id, 'itemName', e.target.value)} className={inpCls}><option value="">هەڵبژێرە لە کۆگا...</option>{inventory.map(i => <option key={i.itemName} value={i.itemName}>{i.itemName} (بەردەست: {i.currentQty} بە {i.currency})</option>)}</select></div>
                       <div className="flex gap-3"><div className="w-full sm:w-24"><label className="block text-xs mb-1 text-slate-600">بڕ</label><input required type="number" step="any" value={item.qty} onChange={(e) => updateSaleItem(item.id, 'qty', e.target.value)} className={inpCls} /></div><div className="w-full sm:w-32"><label className="block text-xs mb-1 text-slate-600">نرخی تاک</label><input required type="number" step="any" value={item.unitPrice} onChange={(e) => updateSaleItem(item.id, 'unitPrice', e.target.value)} className={inpCls} /></div></div>
                       {saleItems.length > 1 && (<button type="button" onClick={() => removeSaleItem(item.id)} className="p-2.5 mt-2 sm:mt-0 w-full sm:w-auto bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors flex justify-center items-center gap-1"><IconTrash/> <span className="sm:hidden">سڕینەوە</span></button>)}
                   </div>
               ))}
               <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4"><button type="button" onClick={addSaleItem} className={`w-full sm:w-auto text-sm font-bold ${currentTheme.text} bg-white px-4 py-2.5 rounded-lg shadow-sm border border-slate-200`}>+ زیادکردنی کاڵای تر</button><div className={`text-left font-black text-xl ${currentTheme.text} bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm`} dir="ltr">کۆی گشتی: {saleItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0).toFixed(2)}</div></div>
            </div>
            {saleMode === 'installment' && (<><div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">پێشەکی وەرگیراو</label><input required type="number" step="any" name="advance" defaultValue={saleToEdit?.advance || 0} className={inpCls} /></div><div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">مانگەکانی قیست</label><input required type="number" name="months" min="1" defaultValue={saleToEdit?.months} className={inpCls} /></div></>)}
            {(saleMode === 'credit_agent' || saleMode === 'credit' || saleMode === 'credit_company') && (<div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">ماوەی دانەوە (ڕۆژ)</label><input required type="number" name="creditDays" min="1" defaultValue="7" className={`${inpCls} font-bold`} /></div>)}
            <div className="lg:col-span-3"><label className="block text-sm mb-1 text-slate-600">تێبینی</label><input name="note" defaultValue={saleToEdit?.note} className={inpCls} placeholder="تێبینی..." /></div>
            <div className="md:col-span-7 flex gap-2 mt-2"><button type="submit" disabled={isUploadingGlobal} className={`flex-1 ${currentTheme.main} ${currentTheme.hover} text-white p-3 rounded-lg font-bold disabled:opacity-50`}>{editingId ? 'نوێکردنەوە و پاشەکەوتکردن' : 'تۆمارکردنی فرۆشتن'}</button>{editingId && <button type="button" onClick={() => {setEditingId(null); setSaleItems([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }])}} className="bg-slate-900 text-white p-3 rounded-lg">بەتاڵ</button>}</div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200">
          <table className="w-full text-right whitespace-nowrap min-w-[900px]"><thead className={`${currentTheme.lightBg} border-b border-slate-200 text-slate-800`}><tr>{['وێنە', 'ژ.پ / جۆر', 'کڕیار/بریکار', 'کاڵاکان', 'کۆی نرخ', 'وەرگیراو', 'ماوە(قەرز)', 'کردارەکان'].map(h=><th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody>
              {sales.map(s => {
                const paid = getSalePaidAmount(s.id); const balance = s.price - paid; const isInst = s.saleType === 'installment'; const isCash = s.saleType === 'cash'; const isComp = s.saleType === 'credit_company'; const typeBadge = isCash ? 'کاش' : (isInst ? 'قیست' : (isComp ? 'کۆمپانیا' : 'بریکار')); const itemsList = s.items || [{ itemName: s.itemName }]; const photoUrl = s.customerPhotoUrl || (s.agentId ? agents.find(a=>a.id===s.agentId)?.photoUrl : (s.companyId ? companies.find(c=>c.id===s.companyId)?.photoUrl : ''));

                return (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50"><td className={tdCls}>{photoUrl ? <img src={photoUrl} alt="User" className="w-10 h-10 object-cover rounded-lg border border-slate-200" /> : <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><IconUser /></div>}</td><td className={`${tdCls} font-bold text-slate-600`}>{s.receiptNo} <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">{typeBadge}</span></td><td className={`${tdCls} font-semibold`}>{s.customerName}</td><td className={tdCls}>{itemsList.map(i=>i.itemName).join('، ')}</td><td className={`${tdCls} font-bold ${currentTheme.text}`} dir="ltr">{formatMoney(s.price, s.currency)}</td><td className={`${tdCls} text-emerald-700`} dir="ltr">{formatMoney(paid, s.currency)}</td><td className={`${tdCls} text-black font-bold`} dir="ltr">{formatMoney(balance, s.currency)}</td><td className={`${tdCls} flex gap-2 mt-1`}>{!isCash && <button onClick={() => setViewingInstallments(s.id)} className={`bg-blue-50 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-bold`} title="وردەکاری هەژمار">وردەکاری</button>}{isInst && <button onClick={() => { setViewingDocuments(s); setSelectedDocs((s.documents || []).map(d => typeof d === 'string' ? {name:d, fileUrl:null} : d)); }} className={`${currentTheme.text} ${currentTheme.lightBg} p-2 rounded-full`} title="بەڵگەنامەکان"><IconDocs /></button>}{isInst && <button onClick={() => printContract(s)} className="text-slate-900 bg-slate-200 p-2 rounded-full" title="چاپکردنی گرێبەست"><IconContract /></button>}<button onClick={() => printSale(s)} className="text-slate-600 bg-slate-200 p-2 rounded-full" title="چاپکردنی پسوڵە"><IconPrinter /></button><button onClick={() => handleEditSale(s)} className={`${currentTheme.text} ${currentTheme.lightBg} p-2 rounded-full`} title="دەستکاریکردن"><IconEdit /></button><button onClick={() => deleteSale(s.id)} className="text-rose-600 bg-rose-100 p-2 rounded-full"><IconTrash /></button></td></tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPayments = () => {
    const activeSales = sales.filter(s => s.saleType === 'installment' && (s.price - getSalePaidAmount(s.id)) > 0); const filteredActiveSales = activeSales.filter(s => s.customerName.includes(searchTerms.installment) || String(s.receiptNo).includes(searchTerms.installment) || s.phone.includes(searchTerms.installment));
    const filteredAgents = agents.filter(a => a.name.includes(searchTerms.agent) || a.phone.includes(searchTerms.agent)); const filteredCompanies = companies.filter(c => c.name.includes(searchTerms.company) || c.phone.includes(searchTerms.company)); const filteredOffices = offices.filter(o => o.name.includes(searchTerms.office) || o.phone.includes(searchTerms.office));
    const recentPayments = [...capitalTx].filter(tx => ['receive_installment', 'receive_agent_payment', 'pay_agent_payment', 'pay_company_debt', 'receive_company_payment', 'pay_office_debt', 'receive_office_loan'].includes(tx.type)).reverse().slice(0, 10);
    const pToEdit = editingPaymentId ? capitalTx.find(t => t.id === editingPaymentId) : null; const isE_Inst = pToEdit?.type === 'receive_installment'; const isE_Ag = pToEdit?.type === 'receive_agent_payment' || pToEdit?.type === 'pay_agent_payment'; const isE_Comp = pToEdit?.type === 'pay_company_debt' || pToEdit?.type === 'receive_company_payment'; const isE_Off = pToEdit?.type === 'pay_office_debt' || pToEdit?.type === 'receive_office_loan';

    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">وەرگرتن و پێدانی پارە</h2>
        {editingPaymentId && (<div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex justify-between items-center"><span className="font-bold text-rose-900">تۆ لە دۆخی دەستکاریکردنی پسوڵەی ژمارە ({pToEdit.receiptNo}) دایت!</span><button onClick={() => setEditingPaymentId(null)} className="text-sm bg-rose-200 px-3 py-1 rounded text-rose-900">پاشگەزبوونەوە</button></div>)}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className={`bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col ${isE_Inst ? `ring-2 ring-blue-500` : `border-t-4 border-t-blue-600`}`}><h3 className={`font-bold ${currentTheme.text} mb-4 flex items-center gap-2`}><IconDollarSign/> {isE_Inst ? 'دەستکاری قیست' : 'وەرگرتنی قیست'}</h3><div className="mb-3 relative"><div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400"><IconSearch /></div><input type="text" placeholder="گەڕان..." value={searchTerms.installment} onChange={(e) => handleSearchChange('installment', e.target.value)} className={inpCls} /></div><form key={`ri-${editingPaymentId || 'new'}`} onSubmit={e => handlePaymentSubmit(e, 'installment')} className="space-y-4 flex-1 flex flex-col"><select ref={installmentSelectRef} onChange={(e) => handleSelectChange(e, installmentSelectRef)} required name="refId" defaultValue={isE_Inst ? pToEdit?.refId : ''} className={inpCls}><option value="">کڕیار هەڵبژێرە...</option>{(isE_Inst ? sales.filter(s=>s.saleType==='installment') : filteredActiveSales).map(s => <option key={s.id} value={s.id}>{s.customerName} - {s.receiptNo} (ماوە: ${formatMoney(s.price - getSalePaidAmount(s.id), s.currency)})</option>)}</select><div className="flex gap-2"><input required type="number" step="any" name="amount" defaultValue={isE_Inst ? Math.abs(pToEdit.amount) : ''} placeholder="بڕی وەرگیراو" className={inpCls} /><select name="currency" defaultValue={isE_Inst ? pToEdit?.currency : settings.currency} className="border border-slate-300 p-2.5 rounded-lg bg-slate-50">{Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}</select></div><input name="note" defaultValue={isE_Inst ? pToEdit?.note : ''} placeholder="تێبینی..." className={inpCls} /><div className="mt-auto pt-4"><button type="submit" disabled={isE_Comp || isE_Ag || isE_Off} className={`w-full ${currentTheme.main} text-white p-2.5 rounded-lg font-bold ${currentTheme.hover}`}>تۆمارکردن</button></div></form></div>
          <div className={`bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col ${isE_Ag ? `ring-2 ring-blue-500` : `border-t-4 border-t-slate-900`}`}><h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><IconAgent/> {isE_Ag ? 'دەستکاری پارەی بریکار' : 'مامەڵەی بریکارەکان'}</h3><div className="mb-3 relative"><div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400"><IconSearch /></div><input type="text" placeholder="گەڕان..." value={searchTerms.agent} onChange={(e) => handleSearchChange('agent', e.target.value)} className={inpCls} /></div><form key={`ra-${editingPaymentId || 'new'}`} onSubmit={e => handlePaymentSubmit(e, 'agent')} className="space-y-4 flex-1 flex flex-col"><select required name="txDirection" value={agentTxDir} onChange={e=>setAgentTxDir(e.target.value)} className={`${inpCls} ${currentTheme.lightBg} font-bold ${currentTheme.text}`}><option value="receive">وەرگرتنی پارە (لە بریکار)</option><option value="pay">پێدانی پارە (بە بریکار)</option></select><select ref={agentSelectRef} onChange={(e) => handleSelectChange(e, agentSelectRef)} required name="refId" defaultValue={isE_Ag ? pToEdit?.refId : ''} className={inpCls}><option value="">ناوی بریکار...</option>{filteredAgents.map(a => <option key={a.id} value={a.id}>{a.name} (حساب: ${formatMoney(getAgentDebt(a.id, settings.currency), settings.currency)})</option>)}</select><div className="flex gap-2"><input required type="number" step="any" name="amount" defaultValue={isE_Ag ? Math.abs(pToEdit.amount) : ''} placeholder="بڕی پارە" className={inpCls} /><select name="currency" defaultValue={isE_Ag ? pToEdit?.currency : settings.currency} className="border border-slate-300 p-2.5 rounded-lg bg-slate-50">{Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}</select></div>{agentTxDir === 'pay' && !isE_Ag && (<div className="bg-slate-50 p-3 rounded-lg border border-slate-200"><label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-sm mb-2"><input type="checkbox" name="viaOffice" checked={viaOfficeAgent} onChange={e=>setViaOfficeAgent(e.target.checked)} className="w-4 h-4 accent-black" /> پارەدان لەڕێی نوسینگە</label>{viaOfficeAgent && (<div className="space-y-2 mt-2"><select required name="officeId" className={inpCls}><option value="">نوسینگە هەڵبژێرە...</option>{offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select><input type="number" step="any" name="officeFee" placeholder="تێچووی حەواڵە" className={inpCls} /></div>)}</div>)}<input name="note" defaultValue={isE_Ag ? pToEdit?.note : ''} placeholder="تێبینی..." className={inpCls} /><div className="mt-auto pt-4"><button type="submit" disabled={isE_Comp || isE_Inst || isE_Off} className="w-full bg-slate-900 text-white p-2.5 rounded-lg font-bold hover:bg-black">تۆمارکردن</button></div></form></div>
          <div className={`bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col ${isE_Comp ? `ring-2 ring-blue-500` : `border-t-4 border-t-black`}`}><h3 className="font-bold text-black mb-4 flex items-center gap-2"><IconBuilding/> {isE_Comp ? 'دەستکاری پارەی کۆمپانیا' : 'مامەڵەی کۆمپانیاکان'}</h3><div className="mb-3 relative"><div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400"><IconSearch /></div><input type="text" placeholder="گەڕان..." value={searchTerms.company} onChange={(e) => handleSearchChange('company', e.target.value)} className={inpCls} /></div><form key={`pay-${editingPaymentId || 'new'}`} onSubmit={e => handlePaymentSubmit(e, 'company')} className="space-y-4 flex-1 flex flex-col"><select required name="txDirection" value={compTxDir} onChange={e=>setCompTxDir(e.target.value)} className={`${inpCls} ${currentTheme.lightBg} font-bold ${currentTheme.text}`}><option value="pay">پێدانی پارە (بە کۆمپانیا)</option><option value="receive">وەرگرتنی پارە (لە کۆمپانیا)</option></select><select ref={companySelectRef} onChange={(e) => handleSelectChange(e, companySelectRef)} required name="refId" defaultValue={isE_Comp ? pToEdit?.refId : ''} className={inpCls}><option value="">کۆمپانیا هەڵبژێرە...</option>{filteredCompanies.map(c => <option key={c.id} value={c.id}>{c.name} (حساب: ${formatMoney(getCompanyDebt(c.id, settings.currency), settings.currency)})</option>)}</select><div className="flex gap-2"><input required type="number" step="any" name="amount" defaultValue={isE_Comp ? Math.abs(pToEdit.amount) : ''} placeholder="بڕی پارە" className={inpCls} /><select name="currency" defaultValue={isE_Comp ? pToEdit?.currency : settings.currency} className="border border-slate-300 p-2.5 rounded-lg bg-slate-50">{Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}</select></div>{compTxDir === 'pay' && !isE_Comp && (<div className="bg-slate-50 p-3 rounded-lg border border-slate-200"><label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-sm mb-2"><input type="checkbox" name="viaOffice" checked={viaOfficeComp} onChange={e=>setViaOfficeComp(e.target.checked)} className="w-4 h-4 accent-black" /> پارەدان لەڕێی نوسینگە</label>{viaOfficeComp && (<div className="space-y-2 mt-2"><select required name="officeId" className={inpCls}><option value="">نوسینگە هەڵبژێرە...</option>{offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select><input type="number" step="any" name="officeFee" placeholder="تێچووی حەواڵە" className={inpCls} /></div>)}</div>)}<input name="note" defaultValue={isE_Comp ? pToEdit?.note : ''} placeholder="ڕەقەم حەواڵە یان تێبینی..." className={inpCls} /><div className="mt-auto pt-4"><button type="submit" disabled={isE_Inst || isE_Ag || isE_Off} className="w-full bg-black text-white p-2.5 rounded-lg font-bold hover:bg-slate-900">تۆمارکردن</button></div></form></div>
          <div className={`bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col ${isE_Off ? `ring-2 ring-blue-500` : `border-t-4 border-t-blue-600`}`}><h3 className={`font-bold ${currentTheme.text} mb-4 flex items-center gap-2`}><IconOffice/> {isE_Off ? 'دەستکاری پارەی نوسینگە' : 'مامەڵەی نوسینگەکان'}</h3><div className="mb-3 relative"><div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400"><IconSearch /></div><input type="text" placeholder="گەڕان..." value={searchTerms.office} onChange={(e) => handleSearchChange('office', e.target.value)} className={inpCls} /></div><form key={`off-${editingPaymentId || 'new'}`} onSubmit={e => handlePaymentSubmit(e, 'office')} className="space-y-4 flex-1 flex flex-col"><select required name="txDirection" defaultValue={isE_Off ? (pToEdit?.type === 'pay_office_debt' ? 'pay' : 'receive') : 'receive'} className={`${inpCls} ${currentTheme.lightBg} font-bold ${currentTheme.text}`}><option value="receive">وەرگرتنی پارە (لە نوسینگە)</option><option value="pay">پێدانی پارە (بە نوسینگە)</option></select><select ref={officeSelectRef} onChange={(e) => handleSelectChange(e, officeSelectRef)} required name="refId" defaultValue={isE_Off ? pToEdit?.refId : ''} className={inpCls}><option value="">نوسینگە هەڵبژێرە...</option>{filteredOffices.map(o => <option key={o.id} value={o.id}>{o.name} (حساب: ${formatMoney(getOfficeDebt(o.id, settings.currency), settings.currency)})</option>)}</select><div className="flex gap-2"><input required type="number" step="any" name="amount" defaultValue={isE_Off ? Math.abs(pToEdit.amount) : ''} placeholder="بڕی پارە" className={inpCls} /><select name="currency" defaultValue={isE_Off ? pToEdit?.currency : settings.currency} className="border border-slate-300 p-2.5 rounded-lg bg-slate-50">{Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}</select></div><input name="note" defaultValue={isE_Off ? pToEdit?.note : ''} placeholder="تێبینی..." className={inpCls} /><div className="mt-auto pt-4"><button type="submit" disabled={isE_Comp || isE_Ag || isE_Inst} className={`w-full ${currentTheme.main} text-white p-2.5 rounded-lg font-bold ${currentTheme.hover}`}>تۆمارکردن</button></div></form></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 mt-6 overflow-x-auto"><h3 className="font-bold text-lg mb-4 border-b pb-2 text-slate-800">دوایین مامەڵەکانی پارەدان و وەرگرتن</h3><table className="w-full text-right text-sm min-w-[600px]"><thead className="bg-slate-50 text-slate-600 border-b"><tr>{['ژ.پ','بەروار','جۆری مامەڵە','وردەکاری','بڕ','کردارەکان'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{recentPayments.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-slate-500">هیچ مامەڵەیەک نییە</td></tr>}{recentPayments.map(tx => (<tr key={tx.id} className="border-b hover:bg-slate-50"><td className="p-3 font-bold text-slate-400">{tx.receiptNo}</td><td className="p-3 text-slate-600" dir="ltr">{tx.date}</td><td className="p-3 font-bold">{tx.type === 'receive_installment' && <span className="text-blue-600">وەرگرتنی قیست</span>}{tx.type === 'receive_agent_payment' && <span className="text-emerald-600">وەرگرتن لە بریکار</span>}{tx.type === 'pay_agent_payment' && <span className="text-rose-600">پێدان بە بریکار</span>}{tx.type === 'pay_company_debt' && <span className="text-rose-600">پێدانی قەرز کۆمپانیا</span>}{tx.type === 'receive_company_payment' && <span className="text-blue-600">وەرگرتن لە کۆمپانیا</span>}{tx.type === 'receive_office_loan' && <span className="text-emerald-600">وەرگرتن لە نوسینگە</span>}{tx.type === 'pay_office_debt' && <span className="text-rose-600">پێدان بە نوسینگە</span>}</td><td className="p-3 text-slate-700">{tx.desc} <span className="text-slate-400">({tx.note})</span></td><td className="p-3 font-bold" dir="ltr"><span className={(tx.type.includes('receive') && tx.type !== 'receive_office_loan') ? 'text-blue-600' : 'text-rose-600'}>{formatMoney(Math.abs(tx.amount), tx.currency)}</span></td><td className="p-3 flex gap-2"><button onClick={() => printPaymentReceipt(tx)} className="bg-slate-200 text-slate-700 hover:bg-slate-300 p-2 rounded-lg text-xs font-semibold"><IconPrinter /></button>{(!tx.desc.includes('حەواڵە')) && <button onClick={() => { setEditingPaymentId(tx.id); window.scrollTo({top:0, behavior:'smooth'}); }} className={`${currentTheme.lightBg} ${currentTheme.text} hover:opacity-80 p-2 rounded-lg`}><IconEdit /></button>}<button onClick={() => deletePaymentTx(tx.id)} className="bg-slate-200 text-black hover:bg-slate-300 p-2 rounded-lg"><IconTrash /></button></td></tr>))}</tbody></table></div>
      </div>
    );
  };

  const renderCapitalContent = () => {
    if (loggedAppUser?.role !== 'admin') return null;
    const totalInvested = capitalTx.filter(t => t.type === 'capital_add' && t.currency === settings.currency).reduce((a, t) => a + t.amount, 0) - Math.abs(capitalTx.filter(t => t.type === 'capital_remove' && t.currency === settings.currency).reduce((a, t) => a + t.amount, 0));
    const totalSalesAmount = sales.filter(s => s.currency === settings.currency).reduce((acc, s) => acc + s.price, 0); let totalCostOfSold = 0;
    sales.filter(s => s.currency === settings.currency).forEach(s => { const sItems = s.items || [{ itemName: s.itemName, qty: s.qty, price: s.unitPrice || (s.price/s.qty) }]; sItems.forEach(si => { const pItems = purchases.filter(p => p.currency === settings.currency).flatMap(p => p.items ? p.items.map(pi=>({ ...pi, parentId: p.id })) : [{ itemName: p.itemName, qty: p.qty, price: p.unitPrice || (p.total/p.qty) }]).filter(pi => pi.itemName === si.itemName); const totalQty = pItems.reduce((acc, p) => acc + Number(p.qty), 0); const avgCost = totalQty > 0 ? (pItems.reduce((acc, p) => acc + (Number(p.qty) * Number(p.price || p.unitPrice)), 0) / totalQty) : 0; totalCostOfSold += (Number(si.qty) * avgCost); }); });
    const expectedGrossProfit = totalSalesAmount - totalCostOfSold; const totalExpenses = capitalTx.filter(t => t.type === 'expense' && t.currency === settings.currency).reduce((acc, t) => acc + Math.abs(t.amount), 0); const netProfit = expectedGrossProfit - totalExpenses;

    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">پوختەی سەرمایە و خەرجییەکان (بە {currentCurrency.name})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6"><div className={`${currentTheme.lightBg} p-5 rounded-xl border ${currentTheme.border}`}><p className={`text-sm ${currentTheme.text} font-bold`}>سەرمایەی خاوەن کار (دانراو)</p><h3 className={`text-2xl font-bold ${currentTheme.text}`} dir="ltr">{formatMoney(totalInvested)}</h3></div><div className="bg-slate-100 p-5 rounded-xl border border-slate-300"><p className="text-sm text-slate-800 font-bold">پوختەی قازانج (دوای خەرجی)</p><h3 className="text-2xl font-bold text-slate-900" dir="ltr">{formatMoney(netProfit)}</h3></div><div className={`${currentTheme.main} p-5 rounded-xl shadow-md`}><p className="text-sm text-white/80 font-bold">کۆی سەرمایەی بنچینەیی ئێستا</p><h3 className="text-2xl font-bold text-white" dir="ltr">{formatMoney(totalInvested + netProfit)}</h3></div></div>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 mb-6"><h3 className="text-xl mb-4 font-bold text-slate-800">زیادکردنی جوڵەی سەرمایە یان خەرجی</h3><form onSubmit={handleCapitalSubmit} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end bg-slate-50 p-5 rounded-xl border border-slate-200"><div><label className="block text-sm mb-1 text-slate-700 font-medium">جۆری مامەڵە</label><select name="type" className={inpCls}><option value="expense">خەرجی (کەمکردن)</option><option value="add">زیادکردنی سەرمایە</option><option value="remove">کێشانەوەی سەرمایە</option></select></div><div className="lg:col-span-2 flex gap-2"><div className="flex-1"><label className="block text-sm mb-1 text-slate-700 font-medium">بڕ</label><input required type="number" step="any" name="amount" className={inpCls} /></div><div><label className="block text-sm mb-1 text-slate-700 font-medium">دراو</label><select name="currency" defaultValue={settings.currency} className={inpCls}>{Object.values(CURRENCIES).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div></div><div><label className="block text-sm mb-1 text-slate-700 font-medium">هۆکار</label><input required name="reason" className={inpCls} /></div><div className="lg:col-span-2 flex gap-2 items-end"><div className="flex-1"><label className="block text-sm mb-1 text-slate-700 font-medium">تێبینی</label><input name="note" className={inpCls} /></div><button type="submit" className={`${currentTheme.main} ${currentTheme.hover} text-white p-2.5 px-6 rounded-lg font-bold`}>جێبەجێکردن</button></div></form></div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200"><h3 className="p-4 bg-slate-50 font-bold border-b border-slate-200 text-slate-800">تەواوی جوڵەکانی سندوق</h3><table className="w-full text-right min-w-[800px]"><thead className="bg-slate-50 border-b border-slate-200 text-slate-600"><tr>{['ژ.پ','بەروار','جۆر','وەسف','تێبینی','بڕ'].map(h=><th key={h} className="p-4">{h}</th>)}</tr></thead><tbody>{[...capitalTx].reverse().map(tx => (<tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-4 font-bold text-slate-400">{tx.receiptNo || '-'}</td><td className="p-4 text-slate-500" dir="ltr">{tx.date}</td><td className="p-4">{tx.type === 'expense' && <span className="text-slate-900 font-medium">خەرجی</span>}{tx.type === 'capital_add' && <span className="text-blue-600 font-medium">سەرمایە (زیاد)</span>}{tx.type === 'capital_remove' && <span className="text-slate-900 font-medium">سەرمایە (کەم)</span>}{(tx.type === 'purchase' || tx.type === 'purchase_cash') && <span className="text-slate-900 font-medium">کڕین (کاش)</span>}{tx.type === 'purchase_debt' && <span className="text-black font-medium">کڕین (قەرز)</span>}{tx.type === 'sale_advance' && <span className="text-blue-600 font-medium">پێشەکی فرۆشتن</span>}{tx.type === 'sale_cash' && <span className="text-blue-600 font-medium">فرۆشتنی کاش</span>}{tx.type === 'receive_installment' && <span className="text-emerald-600 font-bold">وەرگرتنی قیست</span>}{tx.type === 'receive_agent_payment' && <span className="text-emerald-600 font-bold">وەرگرتن لە بریکار</span>}{tx.type === 'pay_agent_payment' && <span className="text-rose-600 font-bold">پێدان بە بریکار</span>}{tx.type === 'pay_company_debt' && <span className="text-rose-600 font-bold">پێدانی قەرز کۆمپانیا</span>}{tx.type === 'receive_company_payment' && <span className="text-blue-600 font-bold">وەرگرتن لە کۆمپانیا</span>}{tx.type === 'receive_office_loan' && <span className="text-emerald-600 font-bold">قەرزی نوسینگە (حەواڵە)</span>}{tx.type === 'pay_office_debt' && <span className="text-rose-600 font-bold">پێدانەوەی قەرزی نوسینگە</span>}</td><td className="p-4 text-slate-700">{tx.desc}</td><td className="p-4 text-slate-500">{tx.note}</td><td className="p-4 font-bold" dir="ltr"><span className={tx.amount > 0 ? 'text-blue-600' : 'text-rose-600'}>{formatMoney(tx.amount, tx.currency)}</span></td></tr>))}</tbody></table></div>
      </div>
    );
  };

  const [reportTab, setReportTab] = useState('active_accounts');
  const [statementFilter, setStatementFilter] = useState({ name: '', dateFrom: '', dateTo: '' });
  const [itemReportFilter, setItemReportFilter] = useState({ name: '', dateFrom: '', dateTo: '' });

  const renderReports = () => {
    const today = getToday();
    const activeAccounts = sales.filter(s => s.saleType === 'installment').map(s => ({ ...s, paid: getSalePaidAmount(s.id), balance: s.price - getSalePaidAmount(s.id) })).filter(s => s.balance > 0);
    const lateAccounts = sales.filter(s => s.saleType === 'installment').map(s => { const paid = getSalePaidAmount(s.id); let expectedToPay = s.advance; s.installments?.forEach(inst => { if (inst.dueDate <= today) expectedToPay += inst.amount; }); const arrears = Math.max(0, expectedToPay - paid); return { ...s, paid, balance: s.price - paid, arrears }; }).filter(s => s.arrears > 0);
    const overdueAgents = sales.filter(s => (s.saleType === 'credit' || s.saleType === 'credit_agent' || s.saleType === 'credit_company') && s.dueDate < today && (s.price - getSalePaidAmount(s.id)) > 0).map(s => ({ ...s, paid: getSalePaidAmount(s.id), balance: s.price - getSalePaidAmount(s.id) }));
    const agentsStatus = agents.map(a => ({ ...a, debt: getAgentDebt(a.id, settings.currency) })).sort((a,b) => b.debt - a.debt);
    const companiesStatus = companies.map(c => ({ ...c, debt: getCompanyDebt(c.id, settings.currency) })).sort((a,b) => b.debt - a.debt);
    const officesStatus = offices.map(o => ({ ...o, debt: getOfficeDebt(o.id, settings.currency) })).sort((a,b) => b.debt - a.debt);
    const totalCompanyDebt = companiesStatus.reduce((acc, c) => acc + c.debt, 0); const totalOfficesDebt = officesStatus.reduce((acc, o) => acc + o.debt, 0);

    const printTable = (title, tableId) => printContent(title, '', document.getElementById(tableId).outerHTML, STORE_NAME, '', false); 

    const generateItemReport = () => {
      let allSaleItems = []; sales.filter(s => s.currency === settings.currency).forEach(s => { const items = s.items || [{ itemName: s.itemName, qty: s.qty, unitPrice: s.unitPrice || (s.price/s.qty) }]; items.forEach(i => { allSaleItems.push({ id: s.id, receiptNo: s.receiptNo, date: s.date, saleType: s.saleType, itemName: i.itemName, qty: Number(i.qty), price: Number(i.qty) * Number(i.unitPrice) }); }); });
      let filteredSales = allSaleItems; if (itemReportFilter.name) filteredSales = filteredSales.filter(s => s.itemName === itemReportFilter.name); if (itemReportFilter.dateFrom) filteredSales = filteredSales.filter(s => s.date >= itemReportFilter.dateFrom); if (itemReportFilter.dateTo) filteredSales = filteredSales.filter(s => s.date <= itemReportFilter.dateTo);
      let tQty = 0; let tSales = 0; let tCost = 0; const allPurchaseItems = purchases.filter(p => p.currency === settings.currency).flatMap(p => p.items ? p.items.map(pi=>({...pi, pType: p.paymentType})) : [{ itemName: p.itemName, qty: p.qty, price: p.unitPrice || (p.total/p.qty), pType: p.paymentType }]);
      const rows = filteredSales.map(s => { const pItems = allPurchaseItems.filter(p => p.itemName === s.itemName); const totalPQty = pItems.reduce((acc, p) => acc + Number(p.qty), 0); const avgC = totalPQty > 0 ? (pItems.reduce((acc, p) => acc + (Number(p.qty) * Number(p.price || p.unitPrice)), 0) / totalPQty) : 0; const cost = avgC * s.qty; const profit = s.price - cost; tQty += s.qty; tSales += s.price; tCost += cost; return { ...s, avgCost: avgC, totalCost: cost, profit }; });
      return { rows, tQty, tSales, tCost, tProfit: tSales - tCost };
    };
    const itemPerf = generateItemReport();

    const generateStatementData = () => {
      let entries = []; const searchTarget = statementFilter.name.trim(); if (!searchTarget) return { entries: [], name: '', isResolved: false, currency: settings.currency };
      let matchedName = searchTarget; let isCompany = companies.some(c => c.name === matchedName); let isAgent = agents.some(a => a.name === matchedName); let isCustomer = sales.some(s => s.customerName === matchedName && s.saleType !== 'credit' && s.saleType !== 'credit_agent' && s.saleType !== 'credit_company'); let isOffice = offices.some(o => o.name === matchedName);
      if (!isCompany && !isCustomer && !isAgent && !isOffice) { const comp = companies.find(c => c.phone === searchTarget); if (comp) { matchedName = comp.name; isCompany = true; } else { const ag = agents.find(a => a.phone === searchTarget); if (ag) { matchedName = ag.name; isAgent = true; } else { const cust = sales.find(s => s.phone === searchTarget || String(s.receiptNo) === searchTarget); if (cust) { matchedName = cust.customerName; isCustomer = true; } else { const off = offices.find(o => o.phone === searchTarget); if (off) { matchedName = off.name; isOffice = true; } } } } }

      // We only load statement data that matches the CURRENT SYSTEM CURRENCY setting.
      // This is crucial for multi-currency isolation.
      if (isCompany) {
        purchases.filter(p => p.companyName === matchedName && p.paymentType === 'debt' && (p.currency || settings.currency) === settings.currency).forEach(p => entries.push({ date: p.date, id: p.id, type: 'کڕین (قەرز)', desc: `کاڵا: ${(p.items || [{ itemName: p.itemName }]).map(i=>i.itemName).join('، ')}`, note: p.note, debit: 0, credit: p.total, receiptNo: p.receiptNo }));
        sales.filter(s => s.customerName === matchedName && s.saleType === 'credit_company' && (s.currency || settings.currency) === settings.currency).forEach(s => entries.push({ date: s.date, id: s.id, type: 'فرۆشتن (قەرز)', desc: `کاڵا: ${(s.items || [{ itemName: s.itemName }]).map(i=>i.itemName).join('، ')}`, note: s.note, debit: s.price, credit: 0, receiptNo: s.receiptNo }));
        const compId = companies.find(c => c.name === matchedName)?.id;
        capitalTx.filter(tx => tx.type === 'pay_company_debt' && tx.refId === compId && (tx.currency || settings.currency) === settings.currency).forEach(tx => entries.push({ date: tx.date, id: tx.id, type: 'پێدانی قەرز', desc: 'پێدانی پارە بە کۆمپانیا', note: tx.note, debit: Math.abs(tx.amount), credit: 0, receiptNo: tx.receiptNo }));
        capitalTx.filter(tx => tx.type === 'receive_company_payment' && tx.refId === compId && (tx.currency || settings.currency) === settings.currency).forEach(tx => entries.push({ date: tx.date, id: tx.id, type: 'وەرگرتن لە کۆمپانیا', desc: 'گەڕانەوەی پارە', note: tx.note, debit: 0, credit: Math.abs(tx.amount), receiptNo: tx.receiptNo }));
      } else if (isCustomer || isAgent) {
        sales.filter(s => s.customerName === matchedName && (s.currency || settings.currency) === settings.currency).forEach(s => entries.push({ date: s.date, id: s.id, type: s.saleType === 'cash' ? 'فرۆشتن (کاش)' : (s.saleType === 'credit' || s.saleType === 'credit_agent' ? 'فرۆشتن (قەرز)' : 'فرۆشتن (قیست)'), desc: `کاڵا: ${(s.items || [{ itemName: s.itemName }]).map(i=>i.itemName).join('، ')}`, note: s.note, debit: s.price, credit: s.saleType === 'cash' ? s.price : 0, receiptNo: s.receiptNo }));
        const saleIds = sales.filter(s => s.customerName === matchedName).map(s => s.id); const agentId = agents.find(a => a.name === matchedName)?.id;
        capitalTx.filter(tx => (tx.type === 'receive_installment' || tx.type === 'sale_advance') && saleIds.includes(tx.refId) && (tx.currency || settings.currency) === settings.currency).forEach(tx => entries.push({ date: tx.date, id: tx.id, type: tx.type.includes('advance') ? 'پێشەکی' : 'وەرگرتنی پارە', desc: 'وەرگرتنی پارە', note: tx.note, debit: 0, credit: Math.abs(tx.amount), receiptNo: tx.receiptNo }));
        if(agentId) {
            capitalTx.filter(tx => tx.type === 'receive_agent_payment' && tx.refId === agentId && (tx.currency || settings.currency) === settings.currency).forEach(tx => entries.push({ date: tx.date, id: tx.id, type: 'وەرگرتنی پارە', desc: 'وەرگرتن لە بریکار', note: tx.note, debit: 0, credit: Math.abs(tx.amount), receiptNo: tx.receiptNo }));
            capitalTx.filter(tx => tx.type === 'pay_agent_payment' && tx.refId === agentId && (tx.currency || settings.currency) === settings.currency).forEach(tx => entries.push({ date: tx.date, id: tx.id, type: 'پێدانی پارە', desc: 'پێدان بە بریکار', note: tx.note, debit: Math.abs(tx.amount), credit: 0, receiptNo: tx.receiptNo }));
            purchases.filter(p => p.companyId === agentId && p.paymentType === 'debt' && (p.currency || settings.currency) === settings.currency).forEach(p => entries.push({ date: p.date, id: p.id, type: 'کڕین (قەرز)', desc: `کاڵا: ${(p.items || [{ itemName: p.itemName }]).map(i=>i.itemName).join('، ')}`, note: p.note, debit: 0, credit: p.total, receiptNo: p.receiptNo }));
        }
      } else if (isOffice) {
         const officeId = offices.find(o => o.name === matchedName)?.id;
         if (officeId) {
             capitalTx.filter(tx => tx.type === 'receive_office_loan' && tx.refId === officeId && (tx.currency || settings.currency) === settings.currency).forEach(tx => entries.push({ date: tx.date, id: tx.id, type: 'قەرزی حەواڵە', desc: tx.desc, note: tx.note, debit: 0, credit: Math.abs(tx.amount), receiptNo: tx.receiptNo }));
             capitalTx.filter(tx => tx.type === 'pay_office_debt' && tx.refId === officeId && (tx.currency || settings.currency) === settings.currency).forEach(tx => entries.push({ date: tx.date, id: tx.id, type: 'دانەوەی قەرز', desc: 'پێدان بە نوسینگە', note: tx.note, debit: Math.abs(tx.amount), credit: 0, receiptNo: tx.receiptNo }));
         }
      }

      if (statementFilter.dateFrom) entries = entries.filter(e => e.date >= statementFilter.dateFrom); if (statementFilter.dateTo) entries = entries.filter(e => e.date <= statementFilter.dateTo);
      entries.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)); let runningBalance = 0;
      entries = entries.map(e => { runningBalance += (isCompany || isOffice) ? (e.credit - e.debit) : (e.debit - e.credit); return { ...e, balance: runningBalance }; });
      return { entries, name: matchedName, isResolved: isCompany || isCustomer || isAgent || isOffice, currency: settings.currency };
    };

    const statementResult = generateStatementData(); const finalBalance = statementResult.entries.length > 0 ? statementResult.entries[statementResult.entries.length - 1].balance : 0;
    const allCustomersAndAgents = Array.from(new Set([...sales.filter(s=> (s.currency||settings.currency)===settings.currency).map(s => s.customerName), ...agents.map(a=>a.name)]));

    const generateCashboxStatement = () => {
       let entries = [...capitalTx].filter(t => (t.currency || settings.currency) === settings.currency); if (statementFilter.dateFrom) entries = entries.filter(e => e.date >= statementFilter.dateFrom); if (statementFilter.dateTo) entries = entries.filter(e => e.date <= statementFilter.dateTo);
       entries.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)); let runningBalance = 0;
       return entries.map(e => { let am = e.type === 'receive_office_loan' ? 0 : e.amount; runningBalance += am; return { ...e, balance: runningBalance, realAmount: am }; }).filter(e => e.realAmount !== 0);
    };
    const cashboxEntries = generateCashboxStatement(); const cashboxFinalBalance = cashboxEntries.length > 0 ? cashboxEntries[cashboxEntries.length - 1].balance : 0;

    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">ڕاپۆرتەکان و کەشف حساب <span className="text-sm font-normal text-slate-500">(بەپێی دراوی: {currentCurrency.name})</span></h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {[{id:'active_accounts', l:'هەژماری قیستەکان'}, {id:'late', l:'قیستە دواکەوتووەکان'}, {id:'agents_all', l:'بریکارەکان'}, {id:'agents_late', l:'قەرزی دواکەوتووەکان'}, {id:'companies', l:'کۆمپانیاکان'}, {id:'offices', l:'نوسینگەکان'}, ...(hasPermission('capital') ? [{id:'item_perf', l:'فرۆش و قازانجی کاڵا'}, {id:'cashbox', l:'سندوق'}] : []), {id:'statement', l:'کەشف حساب'}].map(b => (
             <button key={b.id} onClick={() => setReportTab(b.id)} className={`px-4 py-2.5 rounded-lg font-semibold transition-colors ${reportTab===b.id?`${b.id==='statement'?'bg-blue-600':currentTheme.main} text-white shadow-md`:'bg-white text-slate-700 border hover:bg-slate-50'}`}>{b.l}</button>
          ))}
        </div>

        {reportTab === 'cashbox' && hasPermission('capital') && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200">
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ${currentTheme.lightBg} p-4 md:p-5 rounded-xl border ${currentTheme.border}`}>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">لە بەرواری</label><input type="date" value={statementFilter.dateFrom} onChange={e=>setStatementFilter({...statementFilter, dateFrom: e.target.value})} className={inpCls} /></div>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">بۆ بەرواری</label><input type="date" value={statementFilter.dateTo} onChange={e=>setStatementFilter({...statementFilter, dateTo: e.target.value})} className={inpCls} /></div>
            </div>
            <button onClick={() => printTable(`ڕاپۆرتی سندوق (${currentCurrency.name})`, 'print-cashbox-area')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium hover:bg-slate-200"><IconPrinter/> چاپکردن</button>
            <div id="print-cashbox-area" className="overflow-x-auto">
              <div className="mb-4 text-center"><h3 className="text-xl font-bold text-slate-800">ڕاپۆرتی سندوق <span className="text-sm">({currentCurrency.name})</span></h3></div>
              <div className={`${currentTheme.main} text-white p-4 rounded-xl mb-4 flex justify-between items-center`}><span className="font-bold">بڕی پارەی ناو سندوق (لەم ماوەیەدا):</span><span className="font-black text-2xl" dir="ltr">{formatMoney(cashboxFinalBalance)}</span></div>
              <table className="w-full text-right border border-slate-200 text-sm min-w-[700px]"><thead className="bg-slate-50"><tr>{['ژ.پ','بەروار','جۆر','وەسف','زیادبوون (داهات)','کەمبوون (خەرجی)','باڵانس'].map(h=><th key={h} className={`p-3 border ${h==='باڵانس'?currentTheme.lightBg:''}`}>{h}</th>)}</tr></thead><tbody>{cashboxEntries.length === 0 && <tr><td colSpan="7" className="p-4 text-center text-slate-500">هیچ مامەڵەیەک نییە لەم بەروارەدا</td></tr>}{cashboxEntries.map((e, idx) => (<tr key={`${e.id}-${idx}`} className="border-b hover:bg-slate-50"><td className="p-3 border text-slate-400 font-bold">{e.receiptNo || '-'}</td><td className="p-3 border text-slate-500" dir="ltr">{e.date}</td><td className="p-3 border font-medium">{e.type}</td><td className="p-3 border">{e.desc} {e.note && <span className="text-slate-400 text-xs mr-2">({e.note})</span>}</td><td className="p-3 border font-bold text-blue-600" dir="ltr">{e.realAmount > 0 ? formatMoney(e.realAmount) : '-'}</td><td className="p-3 border font-bold text-rose-600" dir="ltr">{e.realAmount < 0 ? formatMoney(Math.abs(e.realAmount)) : '-'}</td><td className={`p-3 border font-bold ${currentTheme.lightBg} opacity-80`} dir="ltr">{formatMoney(e.balance)}</td></tr>))}</tbody></table>
            </div>
          </div>
        )}

        {reportTab === 'companies' && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200"><button onClick={() => printTable(`ڕاپۆرتی گشتی کۆمپانیاکان (${currentCurrency.name})`, 'tbl-companies')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium"><IconPrinter/> چاپکردن</button><div id="tbl-companies" className="overflow-x-auto"><div className={`${currentTheme.lightBg} border ${currentTheme.border} p-4 rounded-xl mb-4`}><h3 className={`text-lg font-bold ${currentTheme.text}`}>کۆی گشتی قەرزی کۆمپانیاکان: <span dir="ltr" className="text-xl md:text-2xl">${formatMoney(totalCompanyDebt)}</span></h3></div><table className={`w-full text-right border ${currentTheme.border} min-w-[500px]`}><thead className={`${currentTheme.lightBg} ${currentTheme.text}`}><tr>{['ناوی کۆمپانیا','مۆبایل','ناونیشان','کۆی قەرز'].map(h=><th key={h} className={`p-3 border ${currentTheme.border}`}>{h}</th>)}</tr></thead><tbody>{companiesStatus.map(c => (<tr key={c.id} className="border-b border-slate-200"><td className={`p-3 border ${currentTheme.border} font-semibold`}>{c.name}</td><td className={`p-3 border ${currentTheme.border}`}>{c.phone}</td><td className={`p-3 border ${currentTheme.border}`}>${c.address}</td><td className={`p-3 border ${currentTheme.border} font-bold`} dir="ltr">{c.debt > 0 ? <span className="text-rose-600">لەسەرمانە: {formatMoney(c.debt)}</span> : c.debt < 0 ? <span className="text-blue-600">قەرزارمانن: {formatMoney(Math.abs(c.debt))}</span> : <span className="text-slate-500">{formatMoney(0)}</span>}</td></tr>))}</tbody></table></div></div>
        )}

        {reportTab === 'offices' && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200"><button onClick={() => printTable(`ڕاپۆرتی گشتی نوسینگەکان (${currentCurrency.name})`, 'tbl-offices')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium"><IconPrinter/> چاپکردن</button><div id="tbl-offices" className="overflow-x-auto"><div className={`${currentTheme.lightBg} border ${currentTheme.border} p-4 rounded-xl mb-4`}><h3 className={`text-lg font-bold ${currentTheme.text}`}>کۆی گشتی قەرزی نوسینگەکان: <span dir="ltr" className="text-xl md:text-2xl">{formatMoney(totalOfficesDebt)}</span></h3></div><table className={`w-full text-right border ${currentTheme.border} min-w-[500px]`}><thead className={`${currentTheme.lightBg} ${currentTheme.text}`}><tr>{['ناوی نوسینگە','مۆبایل','ناونیشان','قەرز لەسەرمان'].map(h=><th key={h} className={`p-3 border ${currentTheme.border}`}>{h}</th>)}</tr></thead><tbody>{officesStatus.map(o => (<tr key={o.id} className="border-b border-slate-200"><td className={`p-3 border ${currentTheme.border} font-semibold`}>{o.name}</td><td className={`p-3 border ${currentTheme.border}`}>{o.phone}</td><td className={`p-3 border ${currentTheme.border}`}>${o.address}</td><td className={`p-3 border ${currentTheme.border} text-rose-600 font-bold bg-rose-50/50`} dir="ltr">{formatMoney(o.debt)}</td></tr>))}</tbody></table></div></div>
        )}

        {reportTab === 'item_perf' && hasPermission('capital') && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200">
               <div><label className="block text-sm mb-1 font-bold text-slate-700">ناوی کاڵا</label><select value={itemReportFilter.name} onChange={e=>setItemReportFilter({...itemReportFilter, name: e.target.value})} className={inpCls}><option value="">(سەرجەم کاڵاکان)</option>{definedItems.map(i => <option key={i.id} value={i.name}>{i.brand} - {i.name}</option>)}</select></div>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">لە بەرواری</label><input type="date" value={itemReportFilter.dateFrom} onChange={e=>setItemReportFilter({...itemReportFilter, dateFrom: e.target.value})} className={inpCls} /></div>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">بۆ بەرواری</label><input type="date" value={itemReportFilter.dateTo} onChange={e=>setItemReportFilter({...itemReportFilter, dateTo: e.target.value})} className={inpCls} /></div>
            </div>
            <button onClick={() => printTable(`ڕاپۆرتی فرۆش و قازانجی کاڵاکان (${currentCurrency.name})`, 'tbl-item-perf')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium hover:bg-slate-200"><IconPrinter/> چاپکردن</button>
            <div id="tbl-item-perf" className="overflow-x-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 min-w-[600px]"><div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><p className="text-sm text-slate-500 mb-1">کۆی فرۆشراو (دانە)</p><h3 className="text-xl md:text-2xl font-bold text-slate-800">{itemPerf.tQty}</h3></div><div className="bg-blue-50 p-4 rounded-xl border border-blue-200"><p className="text-sm text-blue-800 mb-1">کۆی داهاتی فرۆشتن</p><h3 className="text-xl md:text-2xl font-bold text-blue-600" dir="ltr">{formatMoney(itemPerf.tSales)}</h3></div><div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><p className="text-sm text-slate-500 mb-1">کۆی تێچووی کاڵاکان</p><h3 className="text-xl md:text-2xl font-bold text-slate-800" dir="ltr">{formatMoney(itemPerf.tCost)}</h3></div><div className={`${currentTheme.lightBg} p-4 rounded-xl border ${currentTheme.border}`}><p className={`text-sm ${currentTheme.text} mb-1`}>پوختەی قازانج</p><h3 className={`text-xl md:text-2xl font-bold ${itemPerf.tProfit >= 0 ? currentTheme.text : 'text-rose-600'}`} dir="ltr">{formatMoney(itemPerf.tProfit)}</h3></div></div>
              <table className="w-full text-right border border-slate-200 text-sm min-w-[700px]"><thead className="bg-slate-50"><tr>{['بەروار','جۆر / ژ.پ','کاڵا','بڕ','تێچووی دانە','کۆی داهات','قازانج / زەرەر'].map(h=><th key={h} className="p-3 border">{h}</th>)}</tr></thead><tbody>{itemPerf.rows.length === 0 && <tr><td colSpan="7" className="p-4 text-center text-slate-500">هیچ داتایەک نییە بەم دراوە</td></tr>}{itemPerf.rows.map(r => (<tr key={`${r.id}-${r.itemName}`} className="border-b hover:bg-slate-50"><td className="p-3 border text-slate-500" dir="ltr">{r.date}</td><td className="p-3 border font-medium text-slate-700">{r.saleType === 'cash' ? 'کاش' : (r.saleType.includes('credit') ? 'قەرز' : 'قیست')} | {r.receiptNo}</td><td className="p-3 border font-bold text-slate-900">{r.itemName}</td><td className="p-3 border">{r.qty}</td><td className="p-3 border text-slate-600" dir="ltr">{formatMoney(r.avgCost)}</td><td className="p-3 border font-bold text-blue-600" dir="ltr">{formatMoney(r.price)}</td><td className={`p-3 border font-bold ${r.profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`} dir="ltr">{formatMoney(r.profit)}</td></tr>))}</tbody></table>
            </div>
          </div>
        )}

        {reportTab === 'active_accounts' && (
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 overflow-x-auto"><button onClick={() => printTable('لیستی هەژماری قیستەکان', 'tbl-active')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium"><IconPrinter/> چاپکردن</button><table id="tbl-active" className="w-full text-right border border-slate-200 min-w-[700px]"><thead className="bg-slate-50"><tr>{['کڕیار','مۆبایل','کاڵا','کۆی گشتی','وەرگیراو','قەرزی ماوە'].map(h=><th key={h} className="p-3 border">{h}</th>)}</tr></thead><tbody>{activeAccounts.map(s => (<tr key={s.id} className="border-b"><td className="p-3 border font-medium">{s.customerName}</td><td className="p-3 border">{s.phone}</td><td className="p-3 border">{(s.items || [{itemName: s.itemName}]).map(i=>i.itemName).join('، ')}</td><td className="p-3 border" dir="ltr">{formatMoney(s.price, s.currency)}</td><td className="p-3 border text-blue-600" dir="ltr">{formatMoney(s.paid, s.currency)}</td><td className="p-3 border font-bold text-slate-900" dir="ltr">{formatMoney(s.balance, s.currency)}</td></tr>))}</tbody></table></div>
        )}

        {reportTab === 'late' && (
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 overflow-x-auto"><button onClick={() => printTable('قیستە دواکەوتووەکان', 'tbl-late')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium"><IconPrinter/> چاپکردن</button><table id="tbl-late" className="w-full text-right border border-rose-200 min-w-[600px]"><thead className="bg-rose-50 text-rose-800"><tr>{['کڕیار','مۆبایل','کۆی بڕی ماوە','بڕی پارەی دواکەوتوو'].map(h=><th key={h} className="p-3 border border-rose-200">{h}</th>)}</tr></thead><tbody>{lateAccounts.map(s => (<tr key={s.id} className="border-b border-rose-100"><td className="p-3 border border-rose-200 font-semibold">{s.customerName}</td><td className="p-3 border border-rose-200">{s.phone}</td><td className="p-3 border border-rose-200" dir="ltr">{formatMoney(s.balance, s.currency)}</td><td className="p-3 border border-rose-200 text-rose-600 font-bold bg-rose-50" dir="ltr">{formatMoney(s.arrears, s.currency)}</td></tr>))}</tbody></table></div>
        )}

        {reportTab === 'agents_all' && (
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 overflow-x-auto"><button onClick={() => printTable(`حسابی گشتی بریکارەکان (${currentCurrency.name})`, 'tbl-agents')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium"><IconPrinter/> چاپکردن</button><table id="tbl-agents" className={`w-full text-right border ${currentTheme.border} min-w-[600px]`}><thead className={`${currentTheme.lightBg} ${currentTheme.text}`}><tr>{['ناوی بریکار','مۆبایل','ناونیشان','کۆی قەرزی لایە'].map(h=><th key={h} className={`p-3 border ${currentTheme.border}`}>{h}</th>)}</tr></thead><tbody>{agentsStatus.map(a => (<tr key={a.id} className="border-b border-slate-200"><td className={`p-3 border ${currentTheme.border} font-semibold`}>{a.name}</td><td className={`p-3 border ${currentTheme.border}`}>{a.phone}</td><td className={`p-3 border ${currentTheme.border}`}>${a.address}</td><td className={`p-3 border ${currentTheme.border} text-orange-600 font-bold bg-orange-50/50`} dir="ltr">{formatMoney(a.debt)}</td></tr>))}</tbody></table></div>
        )}

        {reportTab === 'agents_late' && (
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 overflow-x-auto"><button onClick={() => printTable('قەرزی دواکەوتووەکان', 'tbl-agents-late')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium"><IconPrinter/> چاپکردن</button><table id="tbl-agents-late" className="w-full text-right border border-slate-300 min-w-[600px]"><thead className="bg-slate-100 text-black"><tr>{['پسوڵە / جۆر','ناو','مۆبایل','گەڕاندنەوە','قەرزی ماوە'].map(h=><th key={h} className="p-3 border border-slate-300">{h}</th>)}</tr></thead><tbody>{overdueAgents.map(s => (<tr key={s.id} className="border-b border-slate-200"><td className="p-3 border border-slate-300 font-bold text-slate-500">{s.receiptNo} <span className="text-xs bg-slate-200 px-1 rounded">{s.saleType === 'credit_company' ? 'کۆمپانیا' : 'بریکار'}</span></td><td className="p-3 border border-slate-300 font-semibold">{s.customerName}</td><td className="p-3 border border-slate-300">{s.phone}</td><td className="p-3 border border-slate-300 text-black font-bold" dir="ltr">{s.dueDate}</td><td className="p-3 border border-slate-300 text-rose-600 font-bold bg-rose-50" dir="ltr">{formatMoney(s.balance, s.currency)}</td></tr>))}</tbody></table></div>
        )}

        {reportTab === 'statement' && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200">
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${currentTheme.lightBg} p-4 md:p-5 rounded-xl border ${currentTheme.border}`}>
               <div><label className={`block text-sm mb-1 font-bold ${currentTheme.text}`}>گەڕان</label><div className="flex gap-2"><input type="text" value={statementFilter.name} onChange={e => setStatementFilter({...statementFilter, name: e.target.value})} placeholder="بگەڕێ..." className={inpCls}/><select value="" onChange={e => { if(e.target.value) setStatementFilter({...statementFilter, name: e.target.value}) }} className={`w-12 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:${currentTheme.border} cursor-pointer appearance-none text-center font-bold`}><option value="" disabled>▼</option>{companies.length > 0 && <optgroup label="کۆمپانیاکان">{companies.map(c => <option key={`dl-comp-${c.id}`} value={c.name}>{c.name}</option>)}</optgroup>}{offices.length > 0 && <optgroup label="نوسینگەکان">{offices.map(o => <option key={`dl-off-${o.id}`} value={o.name}>{o.name}</option>)}</optgroup>}{allCustomersAndAgents.length > 0 && <optgroup label="بریکار و کڕیارەکان">{allCustomersAndAgents.map((name, i) => <option key={`dl-all-${i}`} value={name}>{name}</option>)}</optgroup>}</select></div></div>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">لە بەرواری</label><input type="date" value={statementFilter.dateFrom} onChange={e=>setStatementFilter({...statementFilter, dateFrom: e.target.value})} className={inpCls} /></div>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">بۆ بەرواری</label><input type="date" value={statementFilter.dateTo} onChange={e=>setStatementFilter({...statementFilter, dateTo: e.target.value})} className={inpCls} /></div>
            </div>
            {statementResult.isResolved && (
              <div className="overflow-x-auto"><button onClick={() => printTable(`کەشف حسابی: ${statementResult.name} (${statementResult.currency})`, 'print-statement-area')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium hover:bg-slate-200"><IconPrinter/> چاپکردن</button><div id="print-statement-area"><div className="mb-4 text-center"><h3 className="text-xl font-bold text-slate-800">کەشف حسابی: <span className="text-blue-600">{statementResult.name}</span> <span className="text-sm text-slate-500">({statementResult.currency})</span></h3></div><table className="w-full text-right border border-slate-200 text-sm min-w-[700px]"><thead className="bg-slate-50"><tr>{['ژ.پ','بەروار','جۆر','وەسف','قەرز (لەسەری)','پێدان (دراو)','باڵانس'].map(h=><th key={h} className="p-3 border">{h}</th>)}</tr></thead><tbody>{statementResult.entries.length === 0 && <tr><td colSpan="7" className="p-4 text-center text-slate-500">هیچ نییە</td></tr>}{statementResult.entries.map((e, idx) => (<tr key={`${e.id}-${idx}`} className="border-b hover:bg-slate-50"><td className="p-3 border text-slate-400 font-bold">{e.receiptNo || '-'}</td><td className="p-3 border text-slate-500" dir="ltr">{e.date}</td><td className="p-3 border font-medium">{e.type}</td><td className="p-3 border">{e.desc} {e.note && <span className="text-slate-400 text-xs mr-2">({e.note})</span>}</td><td className="p-3 border font-bold text-slate-900" dir="ltr">{e.debit > 0 ? formatMoney(e.debit) : '-'}</td><td className="p-3 border font-bold text-blue-600" dir="ltr">{e.credit > 0 ? formatMoney(e.credit) : '-'}</td><td className={`p-3 border font-bold bg-blue-50/50`} dir="ltr">{formatMoney(e.balance)}</td></tr>))}</tbody></table><div style={{marginTop:'24px',padding:'16px',backgroundColor:'#f8fafc',borderRadius:'8px',border:'2px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'18px',fontWeight:'bold'}}><span style={{color:'#0f172a'}}>کۆتا حسابی ماوە:</span><span dir="ltr" style={{color:'#000',fontSize:'22px'}}>{formatMoney(finalBalance)}</span></div></div></div>
            )}
            {!statementResult.isResolved && statementFilter.name && <div className="p-8 text-center text-black border border-dashed border-slate-300 rounded-xl bg-slate-50">هیچ حسابێک نەدۆزرایەوە بەم ناوە.</div>}
            {!statementFilter.name && <div className="p-8 text-center text-slate-500 border border-dashed rounded-xl">تکایە لە سەرەوە ناو یان مۆبایل بنووسە.</div>}
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => {
      if (loggedAppUser?.role !== 'admin') return null;
      return (
         <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">ڕێکخستنەکانی سیستم</h2>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
               <form onSubmit={handleSaveSettings} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div><label className="block text-sm mb-1 text-slate-700 font-bold">ژمارەی مۆبایل</label><input required name="storePhone" defaultValue={settings.storePhone} className={inpCls} dir="ltr" /></div><div><label className="block text-sm mb-1 text-slate-700 font-bold">ناونیشانی فرۆشگا</label><input required name="storeAddress" defaultValue={settings.storeAddress} className={inpCls} /></div></div>
                  <div className="grid grid-cols-1 gap-5"><div><label className="block text-sm mb-1 text-slate-700 font-bold">لینک (URL) ی واژۆ</label><input name="signatureUrl" defaultValue={settings.signatureUrl} className={inpCls} dir="ltr" /><p className="text-xs text-slate-500 mt-1">بۆ پیشاندانی واژۆ لە کاتی چاپکردندا.</p></div></div>
                  <div><label className="block text-sm mb-2 text-slate-700 font-bold">ڕەنگی سەرەکی سیستم</label><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">{Object.entries(THEMES).map(([key, themeObj]) => (<label key={key} className={`border rounded-xl p-3 cursor-pointer transition-all flex flex-col items-center gap-2 ${settings.themeKey === key ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}><input type="radio" name="themeKey" value={key} defaultChecked={settings.themeKey === key} className="hidden" /><div className={`w-8 h-8 rounded-full ${themeObj.main} shadow-sm border border-slate-300`}></div><span className="text-xs font-bold text-center text-slate-700">{themeObj.name}</span></label>))}</div></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div><label className="block text-sm mb-2 text-slate-700 font-bold">قەبارەی فۆنت</label><select name="fontSize" defaultValue={settings.fontSize} className={inpCls}><option value="text-sm">بچووک</option><option value="text-base">مامناوەند</option><option value="text-lg">گەورە</option></select></div>
                      <div><label className="block text-sm mb-2 text-slate-700 font-bold">دراوی سەرەکی کارپێکراو لە سیستم</label><select name="currency" defaultValue={settings.currency} className={inpCls}>{Object.values(CURRENCIES).map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}</select></div>
                  </div>
                  <div className="pt-4 border-t border-slate-200"><button type="submit" className={`${currentTheme.main} ${currentTheme.hover} text-white px-8 py-3 rounded-xl font-bold shadow-md`}>پاشەکەوتکردن</button></div>
               </form>
            </div>
         </div>
      );
  };

  if (!user) return (<div className="flex h-screen items-center justify-center bg-slate-900 text-emerald-400 font-bold text-xl" dir="rtl"><div className="flex flex-col items-center gap-4"><svg className="animate-spin h-10 w-10 text-emerald-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p>چاوەڕێ بکە...</p></div></div>);

  if (!isLogged) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4" dir="rtl" style={{fontFamily: "'Calibri', sans-serif"}}>
        <div className="bg-slate-800 p-6 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-slate-700">
          <div className="flex flex-col items-center mb-8"><h1 className="text-3xl font-black text-emerald-400 text-center">{STORE_NAME}</h1><p className="text-center text-slate-400 mt-2">چوونەژوورەوەی سیستم</p></div>
          {showForgot ? (
            <div>
              <p className="text-center text-slate-300 mb-6 text-sm">تکایە کۆدی گەڕاندنەوە بنووسە یان داوای بکە</p>
              {!recoveredData ? (
                <form onSubmit={handleRecover} className="space-y-4">
                  <input type="password" value={recoveryKey} onChange={e => setRecoveryKey(e.target.value)} placeholder="کۆدی گەڕاندنەوە..." className="w-full border border-slate-600 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-center bg-slate-900 text-white" dir="ltr"/>
                  {loginError && <p className="text-rose-400 text-sm font-medium text-center">{loginError}</p>}
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">پێشاندانی پاسوۆردەکان</button>
                  <div className="border-t border-slate-700 my-4 pt-4 text-center"><button type="button" onClick={requestPasswordViaWhatsApp} className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold py-3 rounded-xl mb-2">داواکردنی پاسوۆرد لە واتسئەپ</button><button type="button" onClick={() => {setShowForgot(false); setLoginError('');}} className="w-full text-slate-400 hover:text-white text-sm mt-2">گەڕانەوە</button></div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 max-h-60 overflow-y-auto space-y-3">{recoveredData.map((ru, i) => (<div key={i} className="bg-slate-800 p-3 rounded text-left" dir="ltr"><p className="text-xs text-slate-400 mb-1">Role: {ru.role}</p><p className="font-bold text-white">User: <span className="text-emerald-400">{ru.username}</span></p><p className="font-bold text-white">Pass: <span className="text-rose-400">{ru.password}</span></p></div>))}</div>
                  <button type="button" onClick={() => {setShowForgot(false); setRecoveredData(null); setRecoveryKey('');}} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">گەڕانەوە</button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div><label className="block text-sm font-medium text-slate-300 mb-2">ناوی بەکارهێنەر</label><input type="text" value={loginForm.user} onChange={(e) => setLoginForm({...loginForm, user: e.target.value})} className="w-full border border-slate-600 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-900 text-white text-left" dir="ltr"/></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-2">وشەی تێپەڕ</label><input type="password" value={loginForm.pass} onChange={(e) => setLoginForm({...loginForm, pass: e.target.value})} className="w-full border border-slate-600 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-900 text-white text-left" dir="ltr"/></div>
              {loginError && <p className="text-rose-400 bg-rose-950/50 p-3 rounded-lg text-sm text-center">{loginError}</p>}
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold text-lg py-3 rounded-xl shadow-lg hover:bg-emerald-500 mt-2">چوونە ژوورەوە</button>
              <div className="text-center mt-4"><button type="button" onClick={() => setShowForgot(true)} className="text-sm text-slate-400 hover:text-emerald-400">وشەی تێپەڕم بیرچووە؟</button></div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden ${settings.fontSize}`} dir={isMobile ? 'ltr' : 'rtl'} style={{fontFamily: "'Calibri', sans-serif"}}>
      <div className={`${currentTheme.sidebar} text-white p-4 flex justify-between items-center shadow-md z-20 md:hidden`}>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`p-2 ${currentTheme.sidebarHover} rounded-lg`}><IconMenu /></button>
        <div className="flex items-center gap-3"><h1 className={`text-lg font-black ${currentTheme.iconText}`}>{STORE_NAME}</h1></div>
      </div>
      {isMobileMenuOpen && <div className="md:hidden fixed inset-0 bg-slate-900/50 z-40" onClick={() => setIsMobileMenuOpen(false)}></div>}
      <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-full md:w-64 ${currentTheme.sidebar} text-white flex flex-col shadow-2xl z-50 md:border-l ${currentTheme.border}`} dir="rtl">
        <div className="p-6 text-center border-b border-white/10 relative">
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden absolute top-4 left-4 text-white/50 hover:text-white"><IconX /></button>
          <div className="mb-4">{STORE_LOGO ? <img src={STORE_LOGO} alt="Logo" className="w-24 h-24 mx-auto object-contain bg-white/5 p-2 rounded-2xl" /> : <div className="w-24 h-24 mx-auto bg-white/10 rounded-2xl flex items-center justify-center"><IconHome size={40} /></div>}</div>
          <h1 className={`text-2xl font-black ${currentTheme.iconText}`}>{STORE_NAME}</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-2 text-sm md:text-base">
          {MODULES.filter(m => hasPermission(m.id)).map(item => {
             let icon = <IconHome />;
             if(item.id === 'items') icon = <IconBox />;
             if(item.id === 'companies') icon = <IconBuilding />;
             if(item.id === 'agents') icon = <IconAgent />;
             if(item.id === 'offices') icon = <IconOffice />;
             if(item.id === 'purchases') icon = <IconPackage />;
             if(item.id === 'sales') icon = <IconFileText />;
             if(item.id === 'payments') icon = <IconCreditCard />;
             if(item.id === 'inventory') icon = <IconShoppingCart />;
             if(item.id === 'capital') icon = <IconDollarSign />;
             if(item.id === 'reports') icon = <IconList />;
             if(item.id === 'users') icon = <IconUsers />;
             if(item.id === 'settings') icon = <IconSettings />;
             if(item.id === 'inventory_print_price') return null; // this is just a permission, not a view

             return (
              <button key={item.id} onClick={() => { setView(item.id); setEditingId(null); setEditingPaymentId(null); setViewingInstallments(null); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold ${view === item.id ? `${currentTheme.main} text-white shadow-md` : `text-slate-300 ${currentTheme.sidebarHover}`}`}><span className={view === item.id ? 'text-white' : currentTheme.iconText}>{icon}</span> <span>{item.label}</span></button>
             )
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
           <div className="flex items-center gap-3 text-slate-300 mb-3"><div className="bg-white/10 p-2 rounded-full"><IconUser /></div><div><p className="text-xs text-white/50">ژوورەوە وەک</p><p className={`font-bold text-sm ${currentTheme.iconText}`} dir="ltr">{loggedAppUser?.username}</p></div></div>
           <button onClick={() => {setIsLogged(false); setLoggedAppUser(null); setLoginForm({user:'', pass:''}); setIsMobileMenuOpen(false); logAction('چوونەدەرەوە لە سیستم'); }} className="w-full bg-rose-500/10 text-rose-400 py-2 rounded-lg text-sm border border-rose-500/20">دەرچوون</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full" dir="rtl">
        <div className="max-w-6xl mx-auto pb-20 md:pb-0">
          {view === 'dashboard' && hasPermission('dashboard') && renderDashboard()}
          {view === 'items' && hasPermission('items') && renderDefinedItems()}
          {view === 'agents' && hasPermission('agents') && renderAgents()}
          {view === 'offices' && hasPermission('offices') && renderOffices()}
          {view === 'companies' && hasPermission('companies') && renderCompanies()}
          {view === 'purchases' && hasPermission('purchases') && renderPurchases()}
          {view === 'inventory' && hasPermission('inventory') && renderInventory()}
          {view === 'sales' && hasPermission('sales') && renderSales()}
          {view === 'payments' && hasPermission('payments') && renderPayments()}
          {view === 'capital' && hasPermission('capital') && renderCapitalContent()}
          {view === 'reports' && hasPermission('reports') && renderReports()}
          {view === 'users' && hasPermission('users') && renderUsers()}
          {view === 'settings' && hasPermission('settings') && renderSettings()}
        </div>
      </div>
      
      {viewingDocuments && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4 border-b pb-3"><IconDocs/> بەڵگەنامەکانی: {viewingDocuments.customerName}</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto p-2">
              {DOC_TYPES.map(dName => {
                const docItem = selectedDocs.find(d => d.name === dName); const isSelected = !!docItem; const isUploading = uploadingDoc === dName;
                return (
                  <div key={dName} className={`flex items-center justify-between p-3 border rounded-lg ${isSelected ? `${currentTheme.border} ${currentTheme.lightBg}` : 'border-slate-100 hover:bg-slate-50'}`}>
                    <label className="flex items-center gap-3 cursor-pointer flex-1"><input type="checkbox" checked={isSelected} onChange={() => handleDocToggle(dName)} className="w-5 h-5" /><span className="font-bold text-slate-700">{dName}</span></label>
                    {isSelected && (<div className="flex items-center gap-2">{isUploading ? (<span className={`text-xs ${currentTheme.text} animate-pulse font-bold`}>... باردەکرێت</span>) : docItem.fileUrl ? (<span className={`text-xs font-bold ${currentTheme.text} ${currentTheme.lightBg} px-2 py-1 rounded`}>هاوپێچ کرا</span>) : (<label className={`cursor-pointer text-white ${currentTheme.main} ${currentTheme.hover} w-8 h-8 rounded-full flex items-center justify-center shadow-sm`}>+ <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, dName)} /></label>)}</div>)}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between items-center mt-6 gap-3 pt-4 border-t">
              <button onClick={() => setViewingDocuments(null)} className="px-4 py-2.5 bg-slate-100 rounded-xl text-slate-800 font-semibold">داخستن</button>
              <div className="flex gap-2"><button onClick={() => printDocsReceipt(viewingDocuments, selectedDocs)} className="px-4 py-2.5 bg-blue-50 text-blue-800 rounded-xl font-bold flex items-center gap-1"><IconPrinter/> چاپ</button><button onClick={handleSaveDocs} className={`px-5 py-2.5 ${currentTheme.main} text-white rounded-xl font-bold`}>پاشەکەوت</button></div>
            </div>
          </div>
        </div>
      )}

      {modal.show && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">{modal.type === 'confirm' ? 'دڵنیابوونەوە' : 'ئاگاداری'}</h3>
            <p className="text-lg text-slate-700 mb-8">{modal.message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setModal({show:false, type:'', message:'', onConfirm:null})} className="px-5 py-2.5 bg-slate-100 rounded-xl text-slate-800 font-semibold">{modal.type === 'confirm' ? 'پاشگەزبوونەوە' : 'داخستن'}</button>
              {modal.type === 'confirm' && (<button onClick={() => { modal.onConfirm(); setModal({show:false, type:'', message:'', onConfirm:null}); }} className="px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold">بەڵێ دڵنیام</button>)}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
