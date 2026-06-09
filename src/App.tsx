import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Settings, 
  CreditCard, 
  Play, 
  User, 
  Smartphone, 
  Mail, 
  Check, 
  Plus, 
  Trash2, 
  Eye, 
  X,
  Users,
  Shield,
  Ticket,
  Lock,
  LogOut,
  ChevronLeft,
  Video
} from 'lucide-react';
import { useTenant } from './context/TenantContext';
import { CountdownClock } from './components/CountdownClock';
import { LiveWheel } from './components/LiveWheel';
import { TicketSelector } from './components/TicketSelector';
import { DepositUploader } from './components/DepositUploader';
import { TicketVerifier } from './components/TicketVerifier';
import { supabase } from './supabaseClient';
import './App.css';

// Define Interfaces
interface CreatorUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  status: 'active' | 'suspended' | 'pending_verification';
  createdRafflesCount: number;
  activationReceiptUrl?: string;
}

interface Prize {
  id: string;
  name: string;
}

interface Raffle {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  drawDate: string;
  ticketPrice: number;
  currency: string;
  prizes: Prize[];
  creatorId: string; // Linked to a creator
  paymentInfo: {
    bankName: string;
    accountHolder: string;
    bankId: string;
    details: string;
  };
  totalTickets: number;
  status: 'active' | 'drawing' | 'finished';
  winnerTicketId?: string;
  winnerName?: string;
  finishedAt?: string;
  prizeImage?: string;
}

interface TicketRecord {
  id: string;
  tenantId: string;
  raffleId: string;
  ticketNumber: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  paymentStatus: 'pending_verification' | 'verified';
  receiptUrl: string;
}

// Initial Simulated Data (Multi-Tenant)
const INITIAL_CREATORS: CreatorUser[] = [
  { id: 'c-1', tenantId: 'banshee', name: 'Randy Fernández (Banshees RD)', email: 'randy.f@rifas.com', status: 'active', createdRafflesCount: 1 },
  { id: 'c-2', tenantId: 'banshee', name: 'Admin Principal (Banshee)', email: 'admin@rifas.com', status: 'active', createdRafflesCount: 0 },
  { id: 'c-3', tenantId: 'cibao', name: 'Juan Pérez (Sorteos del Cibao)', email: 'juan.p@rifas.com', status: 'active', createdRafflesCount: 1 }
];

const INITIAL_RAFFLE: Raffle = {
  id: 'raffle-1',
  tenantId: 'banshee',
  title: '1er Sorteo de Banshee Exótico',
  description: 'Participa y gana un Banshee Exótico listo para rodar. Cada boleto aumenta tus posibilidades. El Sorteo Oficial comenzará pronto.',
  drawDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), // 48 hours from now
  ticketPrice: 200,
  currency: 'RD$',
  creatorId: 'c-1',
  prizes: [
    { id: 'p1', name: '1er Banshee Exótico Edición Especial' },
    { id: 'p2', name: '2do Premio: Casco Profesional Fox + Guantes' }
  ],
  paymentInfo: {
    bankName: 'Banco BHD & Banreservas',
    accountHolder: 'Randy Fernández',
    bankId: '402-3839670-5',
    details: 'A la hora de hacer la transferencia debes colocar tu nombre completo en el concepto de pago.'
  },
  totalTickets: 1000,
  status: 'active',
  prizeImage: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=60'
};

const CIBAO_MOCK_RAFFLE: Raffle = {
  id: 'raffle-2',
  tenantId: 'cibao',
  title: '1er Sorteo de Jeepeta Cibao',
  description: '¡Llévate a casa esta increíble Jeepeta 4x4 todo terreno lista para la aventura cibaeña! Entregado con todos los papeles al día.',
  drawDate: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString(), // 96 hours from now
  ticketPrice: 500,
  currency: 'RD$',
  creatorId: 'c-3',
  prizes: [
    { id: 'p3', name: 'Jeepeta 4x4 Off-Road Edición Limitada' },
    { id: 'p4', name: 'Premio Adicional: RD$ 50,000 en Efectivo' }
  ],
  paymentInfo: {
    bankName: 'Banco Popular Dominicano',
    accountHolder: 'Juan Pérez',
    bankId: '792-348293-1',
    details: 'Favor colocar el número de cédula en la descripción al transferir y subir comprobante legible.'
  },
  totalTickets: 500,
  status: 'active',
  prizeImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=60'
};

const INITIAL_TICKETS: TicketRecord[] = [
  {
    id: 't-1',
    tenantId: 'banshee',
    raffleId: 'raffle-1',
    ticketNumber: '0254',
    buyerName: 'Carlos Mendoza',
    buyerEmail: 'carlos.m@gmail.com',
    buyerPhone: '809-555-0123',
    paymentStatus: 'verified',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 't-2',
    tenantId: 'banshee',
    raffleId: 'raffle-1',
    ticketNumber: '0876',
    buyerName: 'María Rodríguez',
    buyerEmail: 'maria.r@gmail.com',
    buyerPhone: '829-555-0199',
    paymentStatus: 'pending_verification',
    receiptUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 't-3',
    tenantId: 'cibao',
    raffleId: 'raffle-2',
    ticketNumber: '0124',
    buyerName: 'Luis Gómez',
    buyerEmail: 'luis.g@gmail.com',
    buyerPhone: '809-555-8888',
    paymentStatus: 'verified',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60'
  }
];

function App() {
  const { currentTenant, tenantSlug } = useTenant();

  // Navigation State (client, login, admin, live)
  const [activeTab, setActiveTab] = useState<'client' | 'login' | 'admin' | 'live'>('client');
  
  // Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminRole, setAdminRole] = useState<'super_admin' | 'creator'>('super_admin');
  const [currentCreatorId, setCurrentCreatorId] = useState<string>('c-1');

  // Spectator login-less identification for Live Sorteo
  const [spectatorInput, setSpectatorInput] = useState('');
  const [spectatorIdentified, setSpectatorIdentified] = useState(false);
  const [spectatorInfo, setSpectatorInfo] = useState<{ emailOrPhone: string; name: string } | null>(null);

  // Data State
  const [creators, setCreators] = useState<CreatorUser[]>(() => {
    const saved = localStorage.getItem('rifas_creators');
    return saved ? JSON.parse(saved) : INITIAL_CREATORS;
  });

  const [raffles, setRaffles] = useState<Raffle[]>(() => {
    const saved = localStorage.getItem('rifas_raffles');
    return saved ? JSON.parse(saved) : [INITIAL_RAFFLE, CIBAO_MOCK_RAFFLE];
  });

  const [tickets, setTickets] = useState<TicketRecord[]>(() => {
    const saved = localStorage.getItem('rifas_tickets');
    return saved ? JSON.parse(saved) : INITIAL_TICKETS;
  });

  // Client View States
  const [selectedRaffleId, setSelectedRaffleId] = useState<string>('raffle-1');
  const [clientViewMode, setClientViewMode] = useState<'catalog' | 'detail'>('catalog');
  const [ticketCount, setTicketCount] = useState(1);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [, setReceiptFile] = useState<File | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [generatedNumbers, setGeneratedNumbers] = useState<string[]>([]);

  // Admin / Creator Creation States
  const [newCreatorName, setNewCreatorName] = useState('');
  const [newCreatorEmail, setNewCreatorEmail] = useState('');
  const [showCreatorModal, setShowCreatorModal] = useState(false);

  // Admin View States (New Raffle Form)
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDrawDate, setNewDrawDate] = useState('');
  const [newPrice, setNewPrice] = useState(100);
  const [newCurrency, setNewCurrency] = useState('RD$');
  const [newTotalTickets, setNewTotalTickets] = useState(1000);
  const [newPrizeImage, setNewPrizeImage] = useState('');
  const [newPrizes, setNewPrizes] = useState<string[]>(['']);
  const [newBankName, setNewBankName] = useState('');
  const [newBankHolder, setNewBankHolder] = useState('');
  const [newBankId, setNewBankId] = useState('');
  const [newBankDetails, setNewBankDetails] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Creator Registration & Recovery States
  const [loginMode, setLoginMode] = useState<'login' | 'register' | 'forgot' | 'payment'>('login');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBrandName, setRegBrandName] = useState('');
  const [regBrandSlug, setRegBrandSlug] = useState('');
  const [regPaymentPendingCreator, setRegPaymentPendingCreator] = useState<any | null>(null);

  // Live Draw View States
  const [triggerSpin, setTriggerSpin] = useState(false);
  const [liveDrawingInProgress, setLiveDrawingInProgress] = useState(false);

  // Live Stream States and Helpers
  const [streamMode, setStreamMode] = useState<'none' | 'external' | 'camera'>('none');
  const [externalStreamUrl, setExternalStreamUrl] = useState<string>('https://www.youtube.com/embed/jfKfPfyJRdk');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
    } catch (err) {
      console.error("Error accessing camera/microphone:", err);
      alert("No se pudo acceder a la cámara o micrófono. Por favor verifica tus permisos.");
    }
  };

  const stopLocalStream = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
  };

  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [localStream]);

  // Persistence Sync
  useEffect(() => {
    localStorage.setItem('rifas_creators', JSON.stringify(creators));
  }, [creators]);

  useEffect(() => {
    localStorage.setItem('rifas_raffles', JSON.stringify(raffles));
  }, [raffles]);

  useEffect(() => {
    localStorage.setItem('rifas_tickets', JSON.stringify(tickets));
  }, [tickets]);

  // Sync selectedRaffleId and view mode automatically on brand/tenant swap
  useEffect(() => {
    setClientViewMode('catalog');
    const tr = tenantSlug === 'turifard' ? raffles : raffles.filter(r => r.tenantId === tenantSlug);
    if (tr.length > 0) {
      const hasActive = tr.find(r => r.id === selectedRaffleId);
      if (!hasActive) {
        setSelectedRaffleId(tr[0].id);
      }
    }
  }, [tenantSlug]);

  // Filter dynamic arrays by current active Tenant/Brand
  const tenantRaffles = tenantSlug === 'turifard' ? raffles : raffles.filter(r => r.tenantId === tenantSlug);
  const activeRaffle = tenantRaffles.find(r => r.id === selectedRaffleId) || tenantRaffles[0] || raffles[0];

  const visibleRaffles = !isAdminLoggedIn 
    ? tenantRaffles 
    : tenantRaffles.filter(r => r.creatorId === (adminRole === 'super_admin' ? 'super_admin' : currentCreatorId));

  const adminActiveRaffle = !isAdminLoggedIn 
    ? activeRaffle 
    : (visibleRaffles.find(r => r.id === selectedRaffleId) || visibleRaffles[0] || null);

  // Handle Login Validation
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword.trim();

    // 1. Intentar iniciar sesión usando Supabase Auth si está configurado
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (!error && data?.user) {
          const envAdminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@rifas.com';
          const isSuperAdmin = email === envAdminEmail.toLowerCase();
          
          if (isSuperAdmin) {
            setAdminRole('super_admin');
          } else {
            // Verificar si el usuario registrado existe en la tabla de creadores
            const { data: creatorData } = await supabase
              .from('creators')
              .select('id, status')
              .eq('email', email)
              .single();

            if (creatorData) {
              if (creatorData.status !== 'active') {
                alert('Tu cuenta de creador está pendiente de activación o suspendida. Por favor, contacta al administrador.');
                await supabase.auth.signOut();
                return;
              }
              setAdminRole('creator');
              setCurrentCreatorId(creatorData.id);
            } else {
              setAdminRole('creator');
              setCurrentCreatorId(data.user.id);
            }
          }

          setIsAdminLoggedIn(true);
          setActiveTab('admin');
          setLoginEmail('');
          setLoginPassword('');
          return;
        } else if (error) {
          // Si Supabase devuelve error de credenciales, mostramos alerta directamente
          alert(`Error de autenticación: ${error.message}`);
          return;
        }
      } catch (err) {
        console.error("Error conectando a Supabase Auth:", err);
      }
    }

    // 2. Fallback de credenciales locales si Supabase no está configurado
    const envAdminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@rifas.com';
    const envAdminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    const envCreatorPassword = import.meta.env.VITE_CREATOR_PASSWORD || 'creador123';

    if (email === envAdminEmail.toLowerCase() && password === envAdminPassword) {
      setAdminRole('super_admin');
      setIsAdminLoggedIn(true);
      setActiveTab('admin');
      setLoginEmail('');
      setLoginPassword('');
    } else {
      // Check if matches creators
      const creator = creators.find(c => c.email.toLowerCase() === email);
      if (creator && password === envCreatorPassword) {
        if (creator.status !== 'active') {
          alert('Tu cuenta de creador está pendiente de activación o suspendida. Por favor, contacta al administrador.');
          return;
        }
        setAdminRole('creator');
        setCurrentCreatorId(creator.id);
        setIsAdminLoggedIn(true);
        setActiveTab('admin');
        setLoginEmail('');
        setLoginPassword('');
      } else {
        alert('Credenciales incorrectas de Acceso Administrativo.');
      }
    }
  };

  // Handle Creator Registration Submit
  const handleCreatorRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = regName.trim();
    const email = regEmail.trim().toLowerCase();
    const password = regPassword.trim();
    const brandName = regBrandName.trim();
    const brandSlug = regBrandSlug.trim().toLowerCase() || regBrandName.trim().toLowerCase().replace(/\s+/g, '-');

    if (!name || !email || !password || !brandName) {
      alert('Por favor completa todos los campos.');
      return;
    }

    // Guardar temporalmente los datos para pasar a la pantalla de pago de activación
    setRegPaymentPendingCreator({
      id: `c-reg-${Date.now()}`,
      name,
      email,
      password,
      brandName,
      brandSlug
    });

    setLoginMode('payment');
  };

  // Handle Creator Payment Proof Submit
  const handleCreatorPaymentSubmit = async (receiptUrlStr: string) => {
    if (!regPaymentPendingCreator) return;
    const isSupabaseActive = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

    const newCreator: CreatorUser = {
      id: regPaymentPendingCreator.id,
      tenantId: regPaymentPendingCreator.brandSlug,
      name: regPaymentPendingCreator.name,
      email: regPaymentPendingCreator.email,
      status: 'pending_verification',
      createdRafflesCount: 0,
      activationReceiptUrl: receiptUrlStr
    };

    if (isSupabaseActive) {
      try {
        // 1. Crear el usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: regPaymentPendingCreator.email,
          password: regPaymentPendingCreator.password,
          options: {
            data: {
              name: regPaymentPendingCreator.name,
              role: 'creator'
            }
          }
        });

        if (authError) {
          alert(`Error de registro en Supabase: ${authError.message}`);
          return;
        }

        // 2. Crear Tenant si no existe
        const { error: tenantError } = await supabase
          .from('tenants')
          .insert({
            id: `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
            slug: regPaymentPendingCreator.brandSlug,
            company_name: regPaymentPendingCreator.brandName
          });

        if (tenantError) console.warn("Tenant creation error (might already exist):", tenantError.message);

        // 3. Crear Creator en la tabla creadores
        const { error: creatorError } = await supabase
          .from('creators')
          .insert({
            id: authData.user?.id || newCreator.id,
            tenant_id: null,
            name: regPaymentPendingCreator.name,
            email: regPaymentPendingCreator.email,
            status: 'pending_verification',
            activation_receipt_url: receiptUrlStr
          });

        if (creatorError) console.error("Error insertando creador en BD:", creatorError.message);
      } catch (err) {
        console.error("Error conectando a Supabase durante el registro:", err);
      }
    }

    // Guardar en memoria local
    const updatedCreators = [...creators, newCreator];
    setCreators(updatedCreators);
    localStorage.setItem('rifas_creators', JSON.stringify(updatedCreators));

    alert('¡Registro y pago recibidos con éxito! El administrador de Tu Rifa RD revisará tu comprobante y activará tu cuenta en breve.');
    
    // Resetear formulario de registro
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegBrandName('');
    setRegBrandSlug('');
    setRegPaymentPendingCreator(null);
    setLoginMode('login');
  };

  // Handle Password Recovery request
  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginEmail.trim().toLowerCase();
    if (!email) {
      alert('Por favor ingresa tu correo electrónico.');
      return;
    }

    const isSupabaseActive = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (isSupabaseActive) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '?action=reset-password'
        });
        if (error) {
          alert(`Error enviando correo: ${error.message}`);
          return;
        }
      } catch (err) {
        console.error("Error en restablecimiento de contraseña Supabase:", err);
      }
    }

    alert(`Se ha enviado un enlace para restablecer tu contraseña al correo: ${email}`);
    setLoginMode('login');
  };

  // Super Admin: Aprobar y Activar Creador
  const handleActivateCreator = async (creatorId: string) => {
    const isSupabaseActive = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (isSupabaseActive) {
      try {
        const { error } = await supabase
          .from('creators')
          .update({ status: 'active' })
          .eq('id', creatorId);

        if (error) {
          alert(`Error activando en Supabase: ${error.message}`);
          return;
        }
      } catch (err) {
        console.error("Error activando creador en Supabase:", err);
      }
    }

    const updated = creators.map(c => c.id === creatorId ? { ...c, status: 'active' as const } : c);
    setCreators(updated);
    localStorage.setItem('rifas_creators', JSON.stringify(updated));
    alert('Cuenta de creador activada exitosamente.');
  };

  // Helper: Search tickets by email/phone
  const handleSearchTickets = (query: string): any[] => {
    const q = query.toLowerCase().trim();
    return tickets
      .filter(t => t.raffleId === selectedRaffleId && (t.buyerEmail.toLowerCase().includes(q) || t.buyerPhone.includes(q)))
      .map(t => ({
        ticketNumber: t.ticketNumber,
        paymentStatus: t.paymentStatus,
        buyerName: t.buyerName,
        buyerPhone: t.buyerPhone,
        buyerEmail: t.buyerEmail
      }));
  };

  // Helper: Get tickets specifically owned by identified spectator
  const getSpectatorTickets = (): TicketRecord[] => {
    if (!spectatorInfo || !activeRaffle) return [];
    const q = spectatorInfo.emailOrPhone.toLowerCase().trim();
    return tickets.filter(t => t.raffleId === activeRaffle.id && (t.buyerEmail.toLowerCase() === q || t.buyerPhone === q));
  };

  // Spectator check-in for Sorteo Live
  const handleSpectatorCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (spectatorInput.trim() && activeRaffle) {
      const q = spectatorInput.toLowerCase().trim();
      const matchingTicket = tickets.find(t => t.raffleId === activeRaffle.id && (t.buyerEmail.toLowerCase() === q || t.buyerPhone === q));
      
      setSpectatorInfo({
        emailOrPhone: spectatorInput,
        name: matchingTicket ? matchingTicket.buyerName : 'Espectador Invitado'
      });
      setSpectatorIdentified(true);
    }
  };

  // Helper: Generate digital ticket numbers
  const generateTicketNumbers = (count: number): string[] => {
    if (!activeRaffle) return [];
    const numbers: string[] = [];
    for (let i = 0; i < count; i++) {
      const num = Math.floor(Math.random() * activeRaffle.totalTickets);
      numbers.push(num.toString().padStart(4, '0'));
    }
    return numbers;
  };

  // Handle purchase submission
  const handlePurchaseSubmit = () => {
    if (!activeRaffle) return;
    if (!buyerName || !buyerEmail || !buyerPhone) {
      alert('Por favor completa todos tus datos personales.');
      return;
    }

    const newTicketNumbers = generateTicketNumbers(ticketCount);
    const newRecords = newTicketNumbers.map(num => ({
      id: `t-${Date.now()}-${Math.random()}`,
      tenantId: tenantSlug,
      raffleId: activeRaffle.id,
      ticketNumber: num,
      buyerName,
      buyerEmail,
      buyerPhone,
      paymentStatus: 'pending_verification' as const,
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60'
    }));

    setTickets(prev => [...prev, ...newRecords]);
    setGeneratedNumbers(newTicketNumbers);
    setPurchaseSuccess(true);

    // Reset Form
    setBuyerName('');
    setBuyerEmail('');
    setBuyerPhone('');
    setReceiptFile(null);
    setTicketCount(1);
  };

  // Super Admin: Create a new creator user
  const handleCreateCreator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCreatorName || !newCreatorEmail) return;

    const newCreator: CreatorUser = {
      id: `creator-${Date.now()}`,
      tenantId: tenantSlug,
      name: newCreatorName,
      email: newCreatorEmail,
      status: 'active',
      createdRafflesCount: 0
    };

    setCreators(prev => [...prev, newCreator]);
    setNewCreatorName('');
    setNewCreatorEmail('');
    setShowCreatorModal(false);
    alert('¡Creador registrado con éxito! Ahora tiene permisos para crear sus propias rifas.');
  };

  // Create Raffle Action
  const handleCreateRaffle = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredPrizes = newPrizes.filter(p => p.trim() !== '');
    if (filteredPrizes.length === 0) {
      alert('La rifa debe tener al menos 1 premio.');
      return;
    }

    const newRaffle: Raffle = {
      id: `raffle-${Date.now()}`,
      tenantId: tenantSlug,
      title: newTitle,
      description: newDesc,
      drawDate: newDrawDate ? new Date(newDrawDate).toISOString() : new Date(Date.now() + 1000 * 60 * 60 * 240).toISOString(),
      ticketPrice: newPrice,
      currency: newCurrency,
      creatorId: adminRole === 'super_admin' ? 'super_admin' : currentCreatorId,
      prizes: filteredPrizes.map((p, idx) => ({ id: `prize-${idx}-${Date.now()}`, name: p })),
      paymentInfo: {
        bankName: newBankName,
        accountHolder: newBankHolder,
        bankId: newBankId,
        details: newBankDetails
      },
      totalTickets: newTotalTickets || 1000,
      status: 'active',
      prizeImage: newPrizeImage.trim() || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=60'
    };

    setRaffles(prev => [...prev, newRaffle]);
    setSelectedRaffleId(newRaffle.id);
    setShowCreateModal(false);
    
    // Update creator raffle count
    if (adminRole === 'creator') {
      setCreators(prev => prev.map(c => {
        if (c.id === currentCreatorId) {
          return { ...c, createdRafflesCount: c.createdRafflesCount + 1 };
        }
        return c;
      }));
    }

    // Clear Form
    setNewTitle('');
    setNewDesc('');
    setNewDrawDate('');
    setNewPrice(100);
    setNewTotalTickets(1000);
    setNewPrizeImage('');
    setNewPrizes(['']);
    setNewBankName('');
    setNewBankHolder('');
    setNewBankId('');
    setNewBankDetails('');
  };

  // Confirm/Verify Payment
  const handleVerifyPayment = (ticketId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, paymentStatus: 'verified' };
      }
      return t;
    }));
  };

  // Reject / Delete Pending Ticket
  const handleDeleteTicket = (ticketId: string) => {
    if (window.confirm('¿Deseas rechazar este comprobante y eliminar la reservación de boleto?')) {
      setTickets(prev => prev.filter(t => t.id !== ticketId));
    }
  };

  // Start Sorteo Live Trigger
  const handleStartLiveDraw = () => {
    if (!activeRaffle) return;
    setRaffles(prev => prev.map(r => {
      if (r.id === activeRaffle.id) {
        return { ...r, status: 'drawing' };
      }
      return r;
    }));
    setActiveTab('live');
  };

  // Finish Sorteo (Spin Roulette Complete)
  const handleWheelComplete = (winner: any) => {
    if (!activeRaffle) return;
    setRaffles(prev => prev.map(r => {
      if (r.id === activeRaffle.id) {
        return {
          ...r,
          status: 'finished',
          winnerTicketId: winner.id,
          winnerName: winner.name,
          finishedAt: new Date().toISOString()
        };
      }
      return r;
    }));
    setTriggerSpin(false);
    setLiveDrawingInProgress(false);
  };

  // Extract participants for the Live Draw Wheel
  const liveParticipants = activeRaffle
    ? tickets
        .filter(t => t.raffleId === activeRaffle.id && t.paymentStatus === 'verified')
        .map(t => ({
          id: t.id,
          name: t.buyerName,
          ticketNumber: t.ticketNumber
        }))
    : [];

  return (
    <div className="app-container font-sans text-white bg-bg-primary min-h-screen">
      {/* Header Logo */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-bg-tertiary pb-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-yellow-300 to-amber-500">
            <Trophy size={26} className="text-dark-bg" />
          </div>
          <div className="text-left">
            <h1 className="text-gold font-orbitron font-extrabold text-2xl tracking-wider m-0 leading-none">{currentTenant.companyName.toUpperCase()}</h1>
            <span className="text-[10px] font-rajdhani font-bold tracking-widest text-text-muted uppercase">Cumpliendo Sueños</span>
          </div>
        </div>

        {/* Global Navigation Tabs - Conditionally showing Login or Consola Admin */}
        <nav className="flex items-center gap-2 p-1.5 rounded-xl bg-bg-secondary border border-bg-tertiary">
          <button
            onClick={() => setActiveTab('client')}
            className={`px-4 py-2 rounded-lg font-bold text-sm tracking-wider transition-all duration-150 uppercase font-heading ${activeTab === 'client' ? 'bg-accent-gold text-bg-primary' : 'text-text-secondary hover:text-white'}`}
          >
            Cliente
          </button>
          
          {/* SECURE SPEC: Toggle Tab Label depending on Logged-in state */}
          {!isAdminLoggedIn ? (
            <button
              onClick={() => setActiveTab('login')}
              className={`px-4 py-2 rounded-lg font-bold text-sm tracking-wider transition-all duration-150 uppercase flex items-center gap-1.5 font-heading ${activeTab === 'login' ? 'bg-accent-gold text-bg-primary' : 'text-text-secondary hover:text-white'}`}
            >
              <Lock size={14} /> Iniciar Sesión
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-lg font-bold text-sm tracking-wider transition-all duration-150 uppercase flex items-center gap-1.5 font-heading ${activeTab === 'admin' ? 'bg-accent-gold text-bg-primary' : 'text-text-secondary hover:text-white'}`}
            >
              <Settings size={14} /> Consola Admin
            </button>
          )}

          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 rounded-lg font-bold text-sm tracking-wider transition-all duration-150 uppercase flex items-center gap-1.5 font-heading ${activeTab === 'live' ? 'bg-accent-gold text-bg-primary' : 'text-text-secondary hover:text-white'}`}
          >
            <Play size={14} /> Sorteo Vivo
          </button>
        </nav>
      </header>

      {/* Main Portals Content */}
      <main className="flex-grow">
        
        {/* ==================== PORTAL DEL CLIENTE ==================== */}
        {activeTab === 'client' && (
          <div className="flex flex-col gap-8">
            {clientViewMode === 'catalog' ? (
              <div className="flex flex-col gap-8">
                {/* Hero Catalog Banner */}
                <div className="glass-panel p-8 rounded-3xl relative overflow-hidden border border-bg-tertiary text-left flex flex-col justify-center min-h-[220px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/95 via-bg-primary/80 to-transparent z-10" />
                  <div className="absolute right-0 top-0 w-1/2 h-full opacity-30 z-0">
                    <img 
                      src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60" 
                      alt="Gaming Banner" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="relative z-20 max-w-xl flex flex-col items-start">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-accent-gold px-3 py-1 rounded-full bg-accent-gold-muted border border-accent-gold-border mb-4 font-rajdhani">
                      Plataforma Oficial
                    </span>
                    <h2 className="text-3xl md:text-5xl font-orbitron font-extrabold text-white mb-2 uppercase tracking-wide">
                      Sorteos Disponibles
                    </h2>
                    <p className="text-sm text-text-secondary leading-relaxed font-sans">
                      Explora y elige uno de nuestros sorteos activos de {currentTenant.companyName}. ¡Adquiere tus boletos digitalmente de manera rápida y segura!
                    </p>
                  </div>
                </div>

                {/* Grid of Raffles */}
                {tenantRaffles.length === 0 ? (
                  <div className="glass-panel p-12 rounded-3xl border border-bg-tertiary text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center border border-bg-tertiary text-text-muted">
                      <Trophy size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-orbitron text-white uppercase">No hay sorteos activos</h3>
                      <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">Vuelve más tarde para ver nuevos sorteos disponibles en esta marca.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                    {tenantRaffles.map((raffle) => {
                      const soldCount = tickets.filter(t => t.raffleId === raffle.id && t.paymentStatus === 'verified').length;
                      const progressPercent = Math.min(100, Math.round((soldCount / raffle.totalTickets) * 100));

                      return (
                        <div 
                          key={raffle.id}
                          className="glass-panel rounded-2xl overflow-hidden border border-bg-tertiary flex flex-col text-left group hover:border-accent-gold-border transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
                        >
                          {/* Image wrapper */}
                          <div className="relative aspect-[16/10] overflow-hidden bg-bg-primary border-b border-bg-tertiary">
                            <img 
                              src={raffle.prizeImage || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=60'} 
                              alt={raffle.title} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute top-3 left-3 z-10">
                              {raffle.status === 'active' ? (
                                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 px-2.5 py-1 rounded bg-emerald-950/90 border border-emerald-500/40 font-rajdhani flex items-center gap-1 shadow-md">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  Activo
                                </span>
                              ) : raffle.status === 'drawing' ? (
                                <span className="text-[10px] uppercase font-black tracking-widest text-red-400 px-2.5 py-1 rounded bg-red-950/90 border border-red-500/40 font-rajdhani flex items-center gap-1 animate-pulse shadow-md">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                  Sorteando
                                </span>
                              ) : (
                                <span className="text-[10px] uppercase font-black tracking-widest text-text-muted px-2.5 py-1 rounded bg-bg-secondary/90 border border-bg-tertiary font-rajdhani shadow-md">
                                  Finalizado
                                </span>
                              )}
                            </div>
                            <div className="absolute bottom-3 right-3 z-10 bg-bg-primary/95 px-3 py-1 rounded border border-bg-tertiary text-xs font-black text-accent-gold font-orbitron shadow-md">
                              {raffle.currency}{raffle.ticketPrice.toLocaleString()} / Boleto
                            </div>
                          </div>

                          {/* Info details */}
                          <div className="p-6 flex flex-col flex-grow gap-4 justify-between">
                            <div>
                              <h3 className="text-lg font-orbitron font-extrabold text-white mb-2 line-clamp-1 group-hover:text-accent-gold transition-colors duration-200">
                                {raffle.title}
                              </h3>
                              <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mb-4">
                                {raffle.description}
                              </p>

                              {/* Prizes preview */}
                              <div className="flex flex-col gap-1.5 mb-4 bg-bg-secondary/50 p-3 rounded-xl border border-border-color-light">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-rajdhani">Premios principales:</span>
                                <div className="flex flex-col gap-1">
                                  {raffle.prizes.slice(0, 2).map((p, idx) => (
                                    <span key={p.id} className="text-xs text-white truncate flex items-center gap-1.5 font-sans">
                                      <Trophy size={12} className="text-accent-gold min-w-[12px]" />
                                      <strong className="text-[11px] text-text-muted">{idx === 0 ? '🏆 1er' : `${idx + 1}º`}:</strong> {p.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-4 border-t border-bg-tertiary pt-4">
                              {/* Progress bar */}
                              <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center text-[10px] text-text-muted font-rajdhani">
                                  <span>PROGRESO DE VENTAS</span>
                                  <span className="font-bold text-white">{soldCount} / {raffle.totalTickets} ({progressPercent}%)</span>
                                </div>
                                <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden border border-bg-tertiary p-0.5">
                                  <div 
                                    className="h-full rounded-full transition-all duration-500" 
                                    style={{ 
                                      width: `${progressPercent}%`,
                                      background: 'var(--accent-gold)'
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Call to action */}
                              <button
                                onClick={() => {
                                  setSelectedRaffleId(raffle.id);
                                  setClientViewMode('detail');
                                }}
                                className="w-full py-2.5 rounded-xl bg-bg-secondary border border-bg-tertiary hover:bg-accent-gold hover:text-bg-primary hover:border-accent-gold text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 font-heading text-center"
                              >
                                {raffle.status === 'finished' ? 'Ver Resultados' : 'Participar ahora'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Back button */}
                <button
                  onClick={() => setClientViewMode('catalog')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-secondary hover:bg-bg-tertiary border border-border-color-light text-xs font-bold text-text-secondary hover:text-white transition-all self-start font-heading"
                >
                  <ChevronLeft size={14} /> Volver a Sorteos
                </button>

                {/* Raffle Details Header */}
                <div className="glass-panel p-8 rounded-3xl relative overflow-hidden border border-bg-tertiary">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    {/* Left Column: Raffle Text Info */}
                    <div className="md:col-span-7 text-left flex flex-col items-start justify-center">
                      <span className="text-xs uppercase font-extrabold tracking-widest text-accent-gold px-3 py-1 rounded-full bg-accent-gold-muted border border-accent-gold-border mb-4 font-rajdhani">
                        Sorteo Oficial
                      </span>
                      <h2 className="text-3xl md:text-4xl font-orbitron font-extrabold text-white mb-2">{activeRaffle.title}</h2>
                      <p className="text-sm text-text-secondary leading-relaxed mb-6">{activeRaffle.description}</p>
                      
                      {/* Prizes List */}
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 font-rajdhani">Premios en Juego</h4>
                      <div className="flex flex-wrap items-center gap-3 w-full">
                        {activeRaffle.prizes.map((p, idx) => (
                          <span key={p.id} className="text-xs font-semibold px-4 py-2 rounded-lg bg-bg-secondary border border-border-color-light flex items-center gap-1.5 font-sans">
                            <Trophy size={13} style={{ color: 'var(--accent-gold)' }} />
                            {idx === 0 ? '🏆 1er Premio: ' : `${idx + 1}º Premio: `} {p.name}
                          </span>
                        ))}
                      </div>

                      {/* Show Winner block if raffle is finished */}
                      {activeRaffle.status === 'finished' && (
                        <div className="mt-6 p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 max-w-md w-full glow-gold">
                          <h4 className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider font-rajdhani">🎉 Sorteo Finalizado (Boleto Ganador)</h4>
                          <h3 className="text-4xl font-black text-white mt-2 font-orbitron">#{tickets.find(t => t.id === activeRaffle.winnerTicketId)?.ticketNumber}</h3>
                          <p className="text-sm font-semibold text-white mt-1">{activeRaffle.winnerName}</p>
                          <p className="text-[10px] text-emerald-500 mt-2 font-rajdhani">Este sorteo se cerrará permanentemente en 15 días.</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Beautiful Prize Image */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center">
                      <div className="relative w-full max-w-[340px] aspect-[4/3] rounded-2xl overflow-hidden border border-bg-tertiary shadow-xl glow-gold group">
                        <img 
                          src={activeRaffle.prizeImage || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=60'} 
                          alt={activeRaffle.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/95 via-transparent to-transparent flex items-end p-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-accent-gold font-rajdhani bg-bg-secondary/90 px-3 py-1 rounded border border-bg-tertiary">
                            Premio Principal
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Countdown / Live alert */}
                <div className="text-center">
                  {activeRaffle.status === 'active' ? (
                    <div className="flex flex-col items-center">
                      <h4 className="text-xs uppercase font-bold tracking-widest text-text-muted mb-2 font-rajdhani">TIEMPO RESTANTE PARA EL SORTEO</h4>
                      <CountdownClock targetDate={activeRaffle.drawDate} />
                    </div>
                  ) : activeRaffle.status === 'drawing' ? (
                    <div className="glass-panel p-6 rounded-2xl max-w-md mx-auto border border-red-500/30 text-center animate-pulse glow-gold">
                      <h3 className="text-lg font-bold text-red-500 flex items-center justify-center gap-2 font-heading">
                        <Play size={18} className="fill-current" /> ¡SORTEO EN VIVO EN PROCESO!
                      </h3>
                      <p className="text-xs text-text-secondary mt-1 mb-3">El creador está girando la ruleta. ¡Únete para ver en vivo el resultado!</p>
                      <button 
                        onClick={() => setActiveTab('live')}
                        className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-wider text-white font-heading"
                      >
                        Entrar al Sorteo
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Client Main Form Section */}
                {activeRaffle.status === 'active' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-4 w-full">
                    
                    {/* Left Side: Ticket selector and Progressive Bar */}
                    <div className="flex flex-col gap-6 w-full">
                      <TicketSelector 
                        ticketPrice={activeRaffle.ticketPrice}
                        currency={activeRaffle.currency}
                        selectedCount={ticketCount}
                        onChange={(count) => setTicketCount(count)}
                        soldTicketsCount={tickets.filter(t => t.raffleId === activeRaffle.id && t.paymentStatus === 'verified').length}
                        totalTicketsCount={activeRaffle.totalTickets}
                      />

                      {/* Payment Methods Details */}
                      <div className="glass-panel p-6 rounded-2xl border border-bg-tertiary text-left flex flex-col gap-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 font-heading">
                          <CreditCard size={18} style={{ color: 'var(--accent-gold)' }} /> MODOS DE PAGO Y DETALLES
                        </h3>
                        <div className="flex flex-col gap-2">
                          <div className="p-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-sm">
                            <span className="text-xs text-text-muted block">Banco/Canal</span>
                            <strong className="text-white text-base block">{activeRaffle.paymentInfo.bankName}</strong>
                          </div>
                          <div className="p-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-sm">
                            <span className="text-xs text-text-muted block">Titular de la cuenta</span>
                            <strong className="text-white text-base block">{activeRaffle.paymentInfo.accountHolder}</strong>
                          </div>
                          <div className="p-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-sm">
                            <span className="text-xs text-text-muted block">Número de cuenta / Cédula / RNC</span>
                            <strong className="text-white text-lg font-bold block text-gold-gradient font-orbitron">{activeRaffle.paymentInfo.bankId}</strong>
                          </div>
                        </div>
                        <p className="text-xs text-text-muted italic leading-relaxed border-t border-bg-tertiary pt-3">
                          💡 {activeRaffle.paymentInfo.details}
                        </p>
                      </div>
                    </div>

                    {/* Right Side: Data form & receipt upload */}
                    <div className="glass-panel p-8 rounded-2xl border border-bg-tertiary text-left flex flex-col gap-6 w-full">
                      <h3 className="text-lg font-bold uppercase tracking-wide text-white border-b border-bg-tertiary pb-3 font-heading">
                        COMPLETA TU ADQUISICIÓN
                      </h3>

                      {purchaseSuccess ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center gap-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl">
                          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Check size={32} />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-white font-heading">¡Boletos Reservados!</h4>
                            <p className="text-xs text-text-secondary mt-1">Hemos registrado tu reservación y comprobante. Una vez el administrador valide el depósito bancario, te enviaremos una confirmación de pago por correo.</p>
                          </div>

                          {/* Display reserved ticket numbers */}
                          <div className="w-full flex flex-wrap justify-center gap-2 mt-2">
                            {generatedNumbers.map((num, i) => (
                              <span key={i} className="text-base font-extrabold px-3 py-1.5 rounded-lg bg-bg-secondary border border-bg-tertiary text-gold-gradient font-orbitron">
                                #{num}
                              </span>
                            ))}
                          </div>

                          <button
                            onClick={() => setPurchaseSuccess(false)}
                            className="mt-4 px-4 py-2.5 rounded-xl border border-bg-tertiary text-xs font-semibold text-white hover:bg-bg-secondary"
                          >
                            Comprar más boletos
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {/* Name input */}
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1 font-rajdhani">
                              <User size={13} /> Nombres y Apellidos *
                            </label>
                            <input
                              type="text"
                              value={buyerName}
                              onChange={(e) => setBuyerName(e.target.value)}
                              placeholder="Tu nombre completo"
                              className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                            />
                          </div>

                          {/* Phone input */}
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1 font-rajdhani">
                              <Smartphone size={13} /> Teléfono (WhatsApp) *
                            </label>
                            <input
                              type="text"
                              value={buyerPhone}
                              onChange={(e) => setBuyerPhone(e.target.value)}
                              placeholder="WhatsApp, ej. 8095551234"
                              className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                            />
                          </div>

                          {/* Email input */}
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1 font-rajdhani">
                              <Mail size={13} /> Correo Electrónico *
                            </label>
                            <input
                              type="email"
                              value={buyerEmail}
                              onChange={(e) => setBuyerEmail(e.target.value)}
                              placeholder="tu.correo@ejemplo.com"
                              className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                            />
                          </div>

                          {/* Deposit Uploader */}
                          <DepositUploader 
                            onFileSelect={(file) => setReceiptFile(file)}
                            onSubmit={() => {
                              if (!buyerName || !buyerEmail || !buyerPhone) {
                                alert('Por favor completa todos tus datos personales.');
                                return;
                              }
                              setShowConfirmModal(true);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ticket Checker section at bottom */}
            <div className="border-t border-bg-tertiary pt-12 mt-4">
              <TicketVerifier onSearch={handleSearchTickets} />
            </div>
          </div>
        )}

        {/* ==================== PORTAL DE LOGIN (SECURE FORM) ==================== */}
        {activeTab === 'login' && !isAdminLoggedIn && (
          <div className="flex flex-col gap-8 animate-fadeIn">
            <div className="glass-panel p-8 rounded-3xl border border-bg-tertiary max-w-md mx-auto flex flex-col gap-6 shadow-2xl mt-6 w-full">
              
              {loginMode === 'login' && (
                <>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center glow-gold" style={{ background: 'linear-gradient(135deg, #f3cf65 0%, #d4af37 100%)' }}>
                      <Lock size={22} className="text-bg-primary" />
                    </div>
                    <h2 className="text-2xl font-orbitron font-extrabold text-white uppercase tracking-tight mt-2">Acceso Administrativo</h2>
                    <p className="text-xs text-text-secondary font-rajdhani">Ingresa tus credenciales autorizadas.</p>
                  </div>

                  <form onSubmit={handleAdminLogin} className="flex flex-col gap-4 text-left">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Correo Electrónico</label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="admin@rifas.com"
                        className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Contraseña</label>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl font-bold tracking-wider text-xs uppercase hover:scale-[1.02] transition-all cursor-pointer glow-gold font-heading mt-2"
                      style={{
                        background: 'linear-gradient(135deg, #f3cf65 0%, #d4af37 100%)',
                        color: 'var(--bg-primary)'
                      }}
                    >
                      Iniciar Sesión
                    </button>
                  </form>

                  <div className="flex flex-col gap-2 mt-2 text-center text-xs font-rajdhani border-t border-bg-tertiary pt-4">
                    <button 
                      onClick={() => setLoginMode('register')}
                      className="text-accent-gold hover:underline font-bold uppercase tracking-wider text-[10px]"
                    >
                      🚀 Registrarme como Creador de Rifas
                    </button>
                    <button 
                      onClick={() => setLoginMode('forgot')}
                      className="text-text-muted hover:text-white"
                    >
                      ¿Olvidaste tu contraseña? Restablecer aquí
                    </button>
                  </div>
                </>
              )}

              {loginMode === 'register' && (
                <>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-bg-secondary border border-bg-tertiary text-accent-gold shadow-md">
                      <Plus size={22} />
                    </div>
                    <h2 className="text-2xl font-orbitron font-extrabold text-white uppercase tracking-tight mt-2">Crear Cuenta Creador</h2>
                    <p className="text-xs text-text-secondary font-rajdhani">Regístrate y activa tu marca en Tu Rifa RD.</p>
                  </div>

                  <form onSubmit={handleCreatorRegister} className="flex flex-col gap-4 text-left">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Tu Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Nombres y Apellidos"
                        className="w-full py-2.5 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="tu.correo@ejemplo.com"
                        className="w-full py-2.5 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Contraseña Segura *</label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full py-2.5 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Nombre de tu Marca / Empresa *</label>
                      <input
                        type="text"
                        required
                        value={regBrandName}
                        onChange={(e) => setRegBrandName(e.target.value)}
                        placeholder="ej: Banshee, Cibao Rifa"
                        className="w-full py-2.5 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Slug de la Marca (Opcional)</label>
                      <input
                        type="text"
                        value={regBrandSlug}
                        onChange={(e) => setRegBrandSlug(e.target.value)}
                        placeholder="ej: banshee (para tu URL ?brand=banshee)"
                        className="w-full py-2.5 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl font-bold tracking-wider text-xs uppercase hover:scale-[1.02] transition-all cursor-pointer font-heading mt-2"
                      style={{
                        background: 'linear-gradient(135deg, #f3cf65 0%, #d4af37 100%)',
                        color: 'var(--bg-primary)'
                      }}
                    >
                      Paso Siguiente: Pago de Activación
                    </button>
                  </form>

                  <div className="text-center mt-2 border-t border-bg-tertiary pt-4">
                    <button 
                      onClick={() => setLoginMode('login')}
                      className="text-xs text-text-muted hover:text-white"
                    >
                      ← Volver a iniciar sesión
                    </button>
                  </div>
                </>
              )}

              {loginMode === 'forgot' && (
                <>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-bg-secondary border border-bg-tertiary text-accent-gold shadow-md">
                      <Mail size={20} />
                    </div>
                    <h2 className="text-2xl font-orbitron font-extrabold text-white uppercase tracking-tight mt-2">Recuperar Contraseña</h2>
                    <p className="text-xs text-text-secondary font-rajdhani">Ingresa tu correo registrado para recibir un enlace de restablecimiento.</p>
                  </div>

                  <form onSubmit={handlePasswordRecovery} className="flex flex-col gap-4 text-left">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Tu Correo Electrónico</label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="tu.correo@ejemplo.com"
                        className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl font-bold tracking-wider text-xs uppercase hover:scale-[1.02] transition-all cursor-pointer font-heading mt-2"
                      style={{
                        background: 'linear-gradient(135deg, #f3cf65 0%, #d4af37 100%)',
                        color: 'var(--bg-primary)'
                      }}
                    >
                      Enviar Enlace
                    </button>
                  </form>

                  <div className="text-center mt-2 border-t border-bg-tertiary pt-4">
                    <button 
                      onClick={() => setLoginMode('login')}
                      className="text-xs text-text-muted hover:text-white"
                    >
                      ← Volver a iniciar sesión
                    </button>
                  </div>
                </>
              )}

              {loginMode === 'payment' && (
                <>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-bg-secondary border border-bg-tertiary text-accent-gold shadow-md">
                      <CreditCard size={20} />
                    </div>
                    <h2 className="text-2xl font-orbitron font-extrabold text-white uppercase tracking-tight mt-2">Pago de Suscripción</h2>
                    <p className="text-xs text-text-secondary font-rajdhani">Para activar tu cuenta de creador de rifas, realiza el pago de activación.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-bg-primary border border-bg-tertiary text-left flex flex-col gap-3 font-sans text-xs">
                    <div className="flex justify-between border-b border-bg-tertiary pb-2">
                      <span className="text-text-muted">Costo de Activación:</span>
                      <strong className="text-white text-sm font-orbitron">RD$ 2,500.00</strong>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-text-muted font-rajdhani uppercase font-bold text-[10px]">Cuentas de Depósito Tu Rifa RD:</span>
                      <div className="p-2 rounded bg-bg-secondary border border-bg-tertiary mt-1">
                        <span className="text-text-muted block text-[10px]">Banco Popular</span>
                        <strong className="text-white block text-sm font-orbitron">792-348293-1</strong>
                        <span className="text-[10px] text-text-muted block">Titular: Randy Fernández</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-accent-gold italic">💡 Realiza la transferencia y sube una captura legible del comprobante abajo.</p>
                  </div>

                  <div className="flex flex-col gap-2 text-left">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani flex items-center gap-1">
                      Comprobante de Pago *
                    </label>
                    <DepositUploader 
                      onFileSelect={() => {}}
                      onSubmit={() => {
                        // Simulación rápida de URL de comprobante
                        const mockUrl = 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500';
                        handleCreatorPaymentSubmit(mockUrl);
                      }}
                    />
                  </div>

                  <div className="text-center mt-2 border-t border-bg-tertiary pt-4">
                    <button 
                      onClick={() => {
                        setRegPaymentPendingCreator(null);
                        setLoginMode('register');
                      }}
                      className="text-xs text-text-muted hover:text-white"
                    >
                      ← Volver al registro
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        )}

        {/* ==================== PORTAL DE ADMINISTRACIÓN (AUTHENTICATED) ==================== */}
        {activeTab === 'admin' && isAdminLoggedIn && (
          <div className="flex flex-col gap-8 animate-fadeIn text-left">
            
            {/* Active Session Top Bar with Sign Out */}
            <div className="glass-panel p-4 rounded-2xl border border-bg-tertiary flex flex-col md:flex-row justify-between items-center gap-4 bg-bg-secondary w-full">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-accent-gold" />
                <span className="text-xs font-bold uppercase tracking-wider text-white font-rajdhani">
                  Sesión activa como: <strong className="text-accent-gold">{adminRole === 'super_admin' ? 'Super Admin (Dueño)' : 'Creador Autorizado'}</strong>
                  {adminRole === 'creator' && ` (${creators.find(c => c.id === currentCreatorId)?.name})`}
                </span>
              </div>
              
              <button
                onClick={() => {
                  setIsAdminLoggedIn(false);
                  setActiveTab('client');
                }}
                className="px-3.5 py-1.5 rounded-lg border border-red-500/20 text-red-400 bg-red-950/20 hover:bg-red-950/50 text-xs font-bold flex items-center gap-1.5 transition-all font-heading"
              >
                <LogOut size={13} /> Cerrar Sesión
              </button>
            </div>

            {/* SUPER ADMIN BOARD: Creators Management */}
            {adminRole === 'super_admin' && (
              <div className="flex flex-col gap-6 w-full">
                <div className="glass-panel p-6 rounded-2xl border border-bg-tertiary">
                  <div className="flex justify-between items-center border-b border-bg-tertiary pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 font-heading">
                      <Users size={18} style={{ color: 'var(--accent-gold)' }} /> GESTIÓN DE CREADORES (PERMISOS DE RIFAS)
                    </h3>
                    <button
                      onClick={() => setShowCreatorModal(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-accent-gold-muted border border-accent-gold-border text-xs font-bold text-accent-gold flex items-center gap-1 hover:bg-accent-gold hover:text-bg-primary transition-all font-heading"
                    >
                      <Plus size={14} /> Registrar Creador
                    </button>
                  </div>

                  <div className="overflow-x-auto mt-4 font-sans">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-bg-tertiary text-xs text-text-muted uppercase">
                          <th className="py-2.5 px-4">Nombre del Creador</th>
                          <th className="py-2.5 px-4">Email de Acceso</th>
                          <th className="py-2.5 px-4 text-center">Rifas Creadas</th>
                          <th className="py-2.5 px-4">Estado</th>
                          <th className="py-2.5 px-4 text-center">Permisos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {creators.map(c => (
                          <tr key={c.id} className="border-b border-bg-tertiary text-sm hover:bg-bg-tertiary transition-all">
                            <td className="py-3 px-4 font-bold text-white">
                              {c.name}
                              <span className="text-[10px] text-text-muted block font-rajdhani font-medium tracking-wide">MARCA: {c.tenantId.toUpperCase()}</span>
                            </td>
                            <td className="py-3 px-4 text-text-secondary">{c.email}</td>
                            <td className="py-3 px-4 font-semibold text-center">{c.createdRafflesCount}</td>
                            <td className="py-3 px-4">
                              {c.status === 'active' ? (
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                                  Activo (Autorizado)
                                </span>
                              ) : c.status === 'pending_verification' ? (
                                <div className="flex flex-col gap-1 items-start">
                                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 animate-pulse font-rajdhani">
                                    Pendiente de Activación
                                  </span>
                                  {c.activationReceiptUrl && (
                                    <button
                                      onClick={() => setSelectedReceiptUrl(c.activationReceiptUrl || null)}
                                      className="text-[10px] text-accent-gold hover:underline font-rajdhani mt-0.5"
                                    >
                                      📄 Ver Comprobante
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800">
                                  Suspendido
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {c.status === 'pending_verification' ? (
                                <button
                                  onClick={() => handleActivateCreator(c.id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all font-heading"
                                >
                                  Activar Cuenta
                                </button>
                              ) : (
                                <span className="text-xs text-text-muted italic">Acceso Habilitado</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SUPER ADMIN BOARD: Financial Oversight (Platform cut from other creators' active/finished raffles) */}
                <div className="glass-panel p-6 rounded-2xl border border-bg-tertiary">
                  <h3 className="text-base font-bold text-white border-b border-bg-tertiary pb-3 flex items-center gap-2 font-heading">
                    <span>💰 CONTROL DE COMISIONES (RIFAS DE CREADORES)</span>
                  </h3>
                  <div className="overflow-x-auto mt-4 font-sans">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-bg-tertiary text-xs text-text-muted uppercase">
                          <th className="py-2.5 px-4">Sorteo</th>
                          <th className="py-2.5 px-4">Creador</th>
                          <th className="py-2.5 px-4 text-center">Boletos Vendidos</th>
                          <th className="py-2.5 px-4 text-right">Recaudación Total</th>
                          <th className="py-2.5 px-4 text-right text-accent-gold">Comisión (15%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {raffles.filter(r => r.creatorId !== 'super_admin').length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-text-muted italic text-xs">
                              No hay sorteos de otros creadores registrados aún.
                            </td>
                          </tr>
                        ) : (
                          raffles.filter(r => r.creatorId !== 'super_admin').map(r => {
                            const creator = creators.find(c => c.id === r.creatorId);
                            const confirmedTicketsCount = tickets.filter(t => t.raffleId === r.id && t.paymentStatus === 'verified').length;
                            const totalRevenue = confirmedTicketsCount * r.ticketPrice;
                            const platformCut = totalRevenue * 0.15;
                            return (
                              <tr key={r.id} className="border-b border-bg-tertiary text-sm hover:bg-bg-tertiary transition-all">
                                <td className="py-3 px-4 font-bold text-white">{r.title}</td>
                                <td className="py-3 px-4 text-text-secondary">{creator ? creator.name : 'Creador Desconocido'}</td>
                                <td className="py-3 px-4 text-center font-bold text-emerald-400">{confirmedTicketsCount}</td>
                                <td className="py-3 px-4 text-right font-semibold text-white">{r.currency}{totalRevenue.toLocaleString()}</td>
                                <td className="py-3 px-4 text-right font-black text-accent-gold">{r.currency}{platformCut.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {adminActiveRaffle ? (
              <>
                {/* Admin Stats Overview */}
                <div className={`grid grid-cols-1 ${adminRole === 'super_admin' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 w-full`}>
                  <div className="glass-panel p-6 rounded-2xl border border-bg-tertiary">
                    <span className="text-xs text-text-muted uppercase tracking-wider block font-rajdhani">Boletos por Comprobar</span>
                    <strong className="text-3xl font-black text-amber-500 block mt-1 font-orbitron">
                      {tickets.filter(t => t.raffleId === adminActiveRaffle.id && t.paymentStatus === 'pending_verification').length}
                    </strong>
                  </div>
                  <div className="glass-panel p-6 rounded-2xl border border-bg-tertiary">
                    <span className="text-xs text-text-muted uppercase tracking-wider block font-rajdhani">Boletos Confirmados</span>
                    <strong className="text-3xl font-black text-emerald-500 block mt-1 font-orbitron">
                      {tickets.filter(t => t.raffleId === adminActiveRaffle.id && t.paymentStatus === 'verified').length}
                    </strong>
                  </div>
                  <div className="glass-panel p-6 rounded-2xl border border-bg-tertiary">
                    <span className="text-xs text-text-muted uppercase tracking-wider block font-rajdhani">Recaudación Estimada</span>
                    <strong className="text-3xl font-black text-gold-gradient block mt-1 font-orbitron">
                      {adminActiveRaffle.currency}{ (tickets.filter(t => t.raffleId === adminActiveRaffle.id && t.paymentStatus === 'verified').length * adminActiveRaffle.ticketPrice).toLocaleString() }
                    </strong>
                  </div>
                  {adminRole === 'super_admin' && (
                    <div className="glass-panel p-6 rounded-2xl border border-bg-tertiary bg-gradient-to-br from-bg-secondary via-bg-secondary to-accent-gold-muted/10 glow-gold">
                      <span className="text-xs text-accent-gold uppercase tracking-wider block font-rajdhani font-extrabold">Tu Comisión Rifa (15%)</span>
                      <strong className="text-3xl font-black text-gold-gradient block mt-1 font-orbitron">
                        {adminActiveRaffle.currency}{ ((tickets.filter(t => t.raffleId === adminActiveRaffle.id && t.paymentStatus === 'verified').length * adminActiveRaffle.ticketPrice) * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
                      </strong>
                    </div>
                  )}
                </div>

                {/* Header section with Creator actions */}
                <div className="flex justify-between items-center gap-4 mt-2">
                  <div>
                    <h2 className="text-2xl font-orbitron font-extrabold text-white uppercase">Panel del Sorteo</h2>
                    <p className="text-xs text-text-secondary mt-1 font-rajdhani">Administra comprobantes, crea nuevos sorteos y arranca el sorteo en vivo.</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-bg-secondary hover:bg-bg-tertiary border border-bg-tertiary text-xs font-bold text-white flex items-center gap-2 font-heading"
                    >
                      <Plus size={14} /> Nueva Rifa
                    </button>

                    {adminActiveRaffle.status === 'active' && (
                      <button
                        onClick={handleStartLiveDraw}
                        disabled={liveParticipants.length === 0}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 font-heading ${
                          liveParticipants.length > 0 
                            ? 'glow-gold text-bg-primary hover:scale-[1.02] cursor-pointer' 
                            : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
                        }`}
                        style={{
                          background: liveParticipants.length > 0 ? 'linear-gradient(135deg, #f3cf65 0%, #d4af37 100%)' : 'var(--bg-tertiary)'
                        }}
                      >
                        <Play size={13} className="fill-current" /> Iniciar Sorteo en Vivo
                      </button>
                    )}
                  </div>
                </div>

                {/* List of active/finished raffles selector */}
                <div className="flex flex-wrap items-center gap-2 border-b border-bg-tertiary pb-4">
                  <span className="text-xs font-semibold text-text-muted uppercase mr-2 font-rajdhani">Sorteo Activo:</span>
                  {visibleRaffles.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRaffleId(r.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 font-sans ${r.id === selectedRaffleId ? 'bg-accent-gold-muted border border-accent-gold text-accent-gold' : 'bg-bg-secondary border border-bg-tertiary text-text-secondary'}`}
                    >
                      {r.title} ({r.status === 'finished' ? 'Terminado' : r.status === 'drawing' ? 'En vivo' : 'Activo'})
                    </button>
                  ))}
                </div>

                {/* Pagos a Comprobar Dashboard */}
                <div className="glass-panel p-6 rounded-2xl border border-bg-tertiary w-full">
                  <h3 className="text-lg font-bold text-white border-b border-bg-tertiary pb-3 flex items-center justify-between font-heading">
                    <span>📂 PAGOS A COMPROBAR</span>
                    <span className="text-xs bg-bg-tertiary px-3 py-1 rounded-full text-text-secondary font-bold font-rajdhani">
                      {tickets.filter(t => t.raffleId === adminActiveRaffle.id && t.paymentStatus === 'pending_verification').length} Pendientes
                    </span>
                  </h3>

                  {tickets.filter(t => t.raffleId === adminActiveRaffle.id).length === 0 ? (
                    <div className="py-12 text-center text-text-secondary font-sans">
                      No hay transacciones registradas para este sorteo.
                    </div>
                  ) : (
                    <div className="overflow-x-auto mt-4 font-sans w-full">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-bg-tertiary text-xs text-text-muted uppercase">
                            <th className="py-3 px-4">Boleto</th>
                            <th className="py-3 px-4">Cliente</th>
                            <th className="py-3 px-4">WhatsApp / Correo</th>
                            <th className="py-3 px-4">Comprobante</th>
                            <th className="py-3 px-4 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.filter(t => t.raffleId === adminActiveRaffle.id).map(ticket => (
                            <tr key={ticket.id} className="border-b border-bg-tertiary text-sm hover:bg-[rgba(255,255,255,0.01)] transition-all">
                              <td className="py-4 px-4 font-extrabold text-white text-base">#{ticket.ticketNumber}</td>
                              <td className="py-4 px-4 font-semibold text-white">{ticket.buyerName}</td>
                              <td className="py-4 px-4">
                                <span className="block text-white text-xs">{ticket.buyerPhone}</span>
                                <span className="block text-text-muted text-xs">{ticket.buyerEmail}</span>
                              </td>
                              <td className="py-4 px-4">
                                <button
                                  type="button"
                                  onClick={() => setSelectedReceiptUrl(ticket.receiptUrl)}
                                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-bg-tertiary border border-bg-tertiary text-accent-gold flex items-center gap-1.5 hover:bg-bg-secondary transition-all"
                                >
                                  <Eye size={12} /> Ver Captura
                                </button>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center justify-center gap-2">
                                  {ticket.paymentStatus === 'pending_verification' ? (
                                    <>
                                      <button
                                        onClick={() => handleVerifyPayment(ticket.id)}
                                        className="p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-400"
                                        title="Confirmar Pago"
                                      >
                                        <Check size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTicket(ticket.id)}
                                        className="p-2 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-400"
                                        title="Rechazar Comprobante"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-xs font-semibold text-emerald-400 px-3 py-1 rounded-full bg-emerald-950/30 border border-emerald-950 flex items-center gap-1">
                                      <Check size={12} /> Validado
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-6 w-full">
                {/* Header section with Creator actions */}
                <div className="flex justify-between items-center gap-4 mt-2">
                  <div>
                    <h2 className="text-2xl font-orbitron font-extrabold text-white uppercase">Panel del Sorteo</h2>
                    <p className="text-xs text-text-secondary mt-1 font-rajdhani">Administra comprobantes, crea nuevos sorteos y arranca el sorteo en vivo.</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-bg-secondary hover:bg-bg-tertiary border border-bg-tertiary text-xs font-bold text-white flex items-center gap-2 font-heading"
                    >
                      <Plus size={14} /> Nueva Rifa
                    </button>
                  </div>
                </div>

                <div className="glass-panel p-12 rounded-2xl border border-bg-tertiary text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-bg-secondary border border-bg-tertiary">
                    <Shield size={20} className="text-accent-gold" />
                  </div>
                  <h4 className="text-base font-bold text-white font-heading">ÁREA OPERATIVA DE ADMINISTRADOR vacía</h4>
                  <p className="text-xs text-text-secondary max-w-sm">No has creado ningún sorteo bajo tu cuenta de administrador. Las rifas de otros creadores son gestionadas por ellos de manera independiente.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-bg-primary hover:scale-[1.02] cursor-pointer font-heading glow-gold"
                    style={{ background: 'linear-gradient(135deg, #f3cf65 0%, #d4af37 100%)' }}
                  >
                    Crear Mi Primer Sorteo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== PORTAL DE SORTEO EN VIVO ==================== */}
        {activeTab === 'live' && (
          <div className="flex flex-col gap-8 animate-fadeIn text-center w-full">
            
            {/* Login-less entry check-in for Spectator */}
            {!spectatorIdentified ? (
              <div className="glass-panel p-8 rounded-2xl border border-bg-tertiary max-w-md mx-auto text-center flex flex-col items-center gap-6 mt-6 w-full">
                <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse bg-accent-gold-muted border border-accent-gold-border">
                  <Play size={28} style={{ color: 'var(--accent-gold)' }} className="fill-current" />
                </div>
                <div>
                  <h2 className="text-2xl font-orbitron font-extrabold text-white uppercase tracking-tight">Acceso Sorteo En Vivo</h2>
                  <p className="text-xs text-text-secondary mt-1 font-rajdhani">Ingresa tu correo o teléfono registrado para ver el directo, tus boletos y el sorteo en tiempo real.</p>
                </div>

                <form onSubmit={handleSpectatorCheckIn} className="w-full flex flex-col gap-4 text-left">
                  <input
                    type="text"
                    required
                    value={spectatorInput}
                    onChange={(e) => setSpectatorInput(e.target.value)}
                    placeholder="Correo o Teléfono (WhatsApp)..."
                    className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                  />

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-bold tracking-wider text-xs uppercase hover:scale-[1.02] cursor-pointer font-heading"
                    style={{
                      background: 'linear-gradient(135deg, #f3cf65 0%, #d4af37 100%)',
                      color: 'var(--bg-primary)'
                    }}
                  >
                    Ingresar a la Transmisión
                  </button>
                </form>
              </div>
            ) : (
              // Identified Spectator screen!
              <div className="flex flex-col gap-8 w-full">
                {/* Identified Top Bar */}
                <div className="glass-panel p-4 rounded-2xl border border-bg-tertiary flex flex-col md:flex-row justify-between items-center gap-4 bg-bg-secondary text-left w-full">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-accent-gold" />
                    <span className="text-xs font-bold text-white font-rajdhani">Espectador: {spectatorInfo?.name} ({spectatorInfo?.emailOrPhone})</span>
                  </div>
                  <button
                    onClick={() => {
                      setSpectatorIdentified(false);
                      setSpectatorInfo(null);
                    }}
                    className="text-[10px] uppercase font-bold tracking-widest text-text-muted hover:text-white font-rajdhani"
                  >
                    Salir de transmisión
                  </button>
                </div>

                {/* Sorteo Details Panel */}
                <div className="glass-panel p-6 rounded-2xl border border-bg-tertiary max-w-lg mx-auto flex flex-col items-center">
                  <span className="text-xs font-extrabold uppercase px-3.5 py-1 rounded-full bg-red-950/50 text-red-400 border border-red-800/50 animate-pulse flex items-center gap-1 mb-2 font-rajdhani">
                    <Play size={10} className="fill-current" /> Sorteo en Vivo
                  </span>
                  <h2 className="text-2xl font-orbitron font-extrabold text-white uppercase">{activeRaffle.title}</h2>
                  <p className="text-xs text-text-secondary mt-1 font-rajdhani">Sincronización interactiva de boletos validados. ¡Gira la ruleta y anuncia el ganador!</p>
                </div>

                {/* Selector de Transmisión en Vivo */}
                <div className="glass-panel p-5 rounded-2xl border border-bg-tertiary flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bg-secondary text-left w-full">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-text-muted font-rajdhani uppercase font-extrabold tracking-wider">Modo de Transmisión</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <button
                        onClick={() => {
                          setStreamMode('none');
                          stopLocalStream();
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all border ${
                          streamMode === 'none'
                            ? 'bg-accent-gold-muted border-accent-gold text-accent-gold'
                            : 'bg-bg-primary border-bg-tertiary text-text-secondary hover:text-white'
                        }`}
                      >
                        Sin Video (Solo Sorteo)
                      </button>
                      <button
                        onClick={() => {
                          setStreamMode('external');
                          stopLocalStream();
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all border ${
                          streamMode === 'external'
                            ? 'bg-accent-gold-muted border-accent-gold text-accent-gold'
                            : 'bg-bg-primary border-bg-tertiary text-text-secondary hover:text-white'
                        }`}
                      >
                        YouTube / Twitch / Kick
                      </button>
                      <button
                        onClick={() => {
                          setStreamMode('camera');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all border ${
                          streamMode === 'camera'
                            ? 'bg-accent-gold-muted border-accent-gold text-accent-gold'
                            : 'bg-bg-primary border-bg-tertiary text-text-secondary hover:text-white'
                        }`}
                      >
                        {isAdminLoggedIn ? 'Transmitir Mi Cámara Web' : 'Cámara del Organizador'}
                      </button>
                    </div>
                  </div>

                  {/* Configuración de link externo (Solo para creadores/admin) */}
                  {isAdminLoggedIn && streamMode === 'external' && (
                    <div className="flex flex-col gap-1 w-full md:w-auto flex-1 md:flex-none md:max-w-md">
                      <span className="text-[10px] text-text-muted font-rajdhani uppercase font-extrabold tracking-wider">URL de Inserción (Embed)</span>
                      <input
                        type="text"
                        value={externalStreamUrl}
                        onChange={(e) => setExternalStreamUrl(e.target.value)}
                        placeholder="ej: https://www.youtube.com/embed/XXXXXX"
                        className="w-full py-2 px-3 rounded-lg border bg-bg-primary text-white text-xs border-bg-tertiary focus:outline-none focus:border-accent-gold"
                      />
                    </div>
                  )}

                  {/* Botones de Captura local (WebRTC) */}
                  {streamMode === 'camera' && (
                    <div className="flex flex-col gap-1">
                      {isAdminLoggedIn ? (
                        <>
                          <span className="text-[10px] text-text-muted font-rajdhani uppercase font-extrabold tracking-wider">Control de Video</span>
                          {!localStream ? (
                            <button
                              onClick={startLocalStream}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white uppercase tracking-wider font-heading"
                            >
                              Activar Mi Cámara
                            </button>
                          ) : (
                            <button
                              onClick={stopLocalStream}
                              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white uppercase tracking-wider font-heading animate-pulse"
                            >
                              Apagar Cámara
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Transmisión Directa Activa</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Reproductor de Video de Transmisión */}
                {streamMode !== 'none' && (
                  <div className="glass-panel p-4 rounded-3xl border border-bg-tertiary w-full max-w-4xl mx-auto overflow-hidden bg-black/40 shadow-2xl">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-accent-gold mb-3 flex items-center gap-1.5 justify-center font-heading">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                      SEÑAL DE VIDEO EN DIRECTO
                    </h3>
                    <div className="relative aspect-video w-full max-h-[380px] rounded-2xl overflow-hidden bg-bg-primary border border-bg-tertiary flex items-center justify-center">
                      {streamMode === 'external' ? (
                        <iframe
                          src={externalStreamUrl}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          title="Live Stream"
                        ></iframe>
                      ) : streamMode === 'camera' ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-bg-secondary">
                          <video
                            autoPlay
                            playsInline
                            muted={isAdminLoggedIn} // Mute creator locally to avoid feedback echo
                            className="w-full h-full object-cover"
                            ref={(ref) => {
                              if (ref) {
                                // If admin, attach local webcam stream
                                if (isAdminLoggedIn && localStream) {
                                  ref.srcObject = localStream;
                                } else if (!isAdminLoggedIn) {
                                  // For spectator demonstration, use direct camera loop to simulate the streamer's direct room feed
                                  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                                    .then(s => { ref.srcObject = s; })
                                    .catch(() => { ref.srcObject = null; });
                                } else {
                                  ref.srcObject = null;
                                }
                              }
                            }}
                          />
                          {isAdminLoggedIn && !localStream && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
                              <span className="w-10 h-10 rounded-full bg-accent-gold-muted border border-accent-gold-border flex items-center justify-center text-accent-gold animate-pulse">
                                <Video size={18} />
                              </span>
                              <span className="text-xs text-text-secondary font-rajdhani">Haz clic en "Activar Mi Cámara" para comenzar la transmisión...</span>
                            </div>
                          )}
                          {!isAdminLoggedIn && (
                            <span className="absolute bottom-4 left-4 text-[10px] bg-emerald-600 text-white font-bold px-2.5 py-1 rounded shadow-lg uppercase font-rajdhani flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Directo Directo (WebRTC)
                            </span>
                          )}
                          {isAdminLoggedIn && localStream && (
                            <span className="absolute bottom-4 left-4 text-[10px] bg-red-600 text-white font-bold px-2.5 py-1 rounded shadow-lg uppercase font-rajdhani flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Transmitiendo en Vivo
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Main Spectator live layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-2 w-full">
                  
                  {/* Left Column: Personalized Visitor Tickets */}
                  <div className="glass-panel p-6 rounded-2xl border border-bg-tertiary text-left flex flex-col gap-4 w-full">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-bg-tertiary pb-2 flex items-center gap-1.5 font-heading">
                      <Ticket size={16} style={{ color: 'var(--accent-gold)' }} /> TUS BOLETOS ADQUIRIDOS
                    </h3>
                    
                    <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-2 font-sans">
                      {getSpectatorTickets().length === 0 ? (
                        <div className="p-4 rounded-xl bg-bg-secondary/50 border border-bg-tertiary text-center">
                          <p className="text-xs text-text-muted italic">No tienes boletos registrados en esta rifa.</p>
                          <button
                            onClick={() => setActiveTab('client')}
                            className="mt-3 px-3 py-1.5 rounded-lg bg-bg-tertiary text-xs font-bold text-accent-gold hover:text-white"
                          >
                            Ir a adquirir boletos
                          </button>
                        </div>
                      ) : (
                        getSpectatorTickets().map(t => (
                          <div 
                            key={t.id} 
                            className="p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold bg-bg-secondary"
                            style={{
                              borderColor: t.paymentStatus === 'verified' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'
                            }}
                          >
                            <span className="text-white">#{t.ticketNumber}</span>
                            <span>
                              {t.paymentStatus === 'verified' ? (
                                <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900">Validado</span>
                              ) : (
                                <span className="text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900">Pendiente</span>
                              )}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Center Column: Live Wheel (Roulette) */}
                  <div className="glass-panel p-6 rounded-2xl border border-bg-tertiary flex flex-col items-center justify-center w-full">
                    <LiveWheel 
                      participants={liveParticipants}
                      onDrawComplete={handleWheelComplete}
                      triggerSpin={triggerSpin}
                    />

                    {/* Admin Actions Panel inside Live (Only visible if logged in as Admin/Creator) */}
                    {activeRaffle.status !== 'finished' && isAdminLoggedIn && (
                      <button
                        onClick={() => {
                          setTriggerSpin(true);
                          setLiveDrawingInProgress(true);
                        }}
                        disabled={liveParticipants.length === 0 || liveDrawingInProgress}
                        className={`mt-4 px-8 py-4 rounded-xl font-bold tracking-widest text-sm transition-all duration-150 uppercase shadow-lg font-heading ${
                          liveParticipants.length > 0 && !liveDrawingInProgress
                            ? 'glow-gold text-bg-primary hover:scale-[1.02] cursor-pointer'
                            : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
                        }`}
                        style={{
                          background: liveParticipants.length > 0 && !liveDrawingInProgress ? 'linear-gradient(135deg, #f3cf65 0%, #d4af37 100%)' : 'var(--bg-tertiary)'
                        }}
                      >
                        GIRAR RULETA 🎡
                      </button>
                    )}

                    {activeRaffle.status === 'drawing' && liveDrawingInProgress && (
                      <div className="mt-4 px-4 py-2 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-400 font-semibold animate-pulse uppercase tracking-wider font-rajdhani">
                        🎡 Sorteo en Curso - ¡Mucha Suerte!
                      </div>
                    )}
                  </div>

                  {/* Right Column: Prizes in Play */}
                  <div className="glass-panel p-6 rounded-2xl border border-bg-tertiary text-left flex flex-col gap-4 w-full">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-bg-tertiary pb-2 font-heading">
                      🎁 PREMIOS EN JUEGO
                    </h3>
                    <div className="flex flex-col gap-3 font-sans">
                      {activeRaffle.prizes.map((p, index) => (
                        <div key={p.id} className="p-4 rounded-xl bg-bg-secondary border border-bg-tertiary flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-gold-muted)', border: '1px solid var(--accent-gold-border)' }}>
                            <Trophy size={18} style={{ color: 'var(--accent-gold)' }} />
                          </div>
                          <div className="flex-1">
                            <span className="text-[10px] text-text-muted block font-semibold uppercase">{index === 0 ? 'Primer Lugar' : `Premio Secundario #${index + 1}`}</span>
                            <strong className="text-sm text-white">{p.name}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="mt-16 pt-8 border-t border-bg-tertiary flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted font-sans">
        <div>
          <span>© 2026 RIFA2RD. Todos los derechos reservados.</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="hover:text-white cursor-pointer transition-colors">Términos</span>
          <span className="hover:text-white cursor-pointer transition-colors">Privacidad</span>
          <span className="hover:text-white cursor-pointer transition-colors">Soporte</span>
        </div>
      </footer>

      {/* ==================== SUPER ADMIN: CREATE CREATOR MODAL ==================== */}
      {showCreatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-bg-tertiary flex flex-col shadow-2xl animate-fadeIn">
            <div className="p-5 border-b border-bg-tertiary flex justify-between items-center bg-bg-secondary rounded-t-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
                <Users size={18} className="text-accent-gold" /> Registrar Creador
              </h3>
              <button onClick={() => setShowCreatorModal(false)} className="text-text-muted hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCreator} className="p-6 flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Nombre del Creador *</label>
                <input 
                  type="text" 
                  required
                  value={newCreatorName}
                  onChange={(e) => setNewCreatorName(e.target.value)}
                  placeholder="ej. Juan Pérez (Sorteos del Cibao)"
                  className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Email de Acceso *</label>
                <input 
                  type="email" 
                  required
                  value={newCreatorEmail}
                  onChange={(e) => setNewCreatorEmail(e.target.value)}
                  placeholder="juan.perez@ejemplo.com"
                  className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold tracking-wider text-xs uppercase mt-2 hover:scale-[1.01] cursor-pointer font-heading"
                style={{
                  background: 'linear-gradient(135deg, #f3cf65 0%, #d4af37 100%)',
                  color: 'var(--bg-primary)'
                }}
              >
                Autorizar y Guardar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CREATE NEW RAFFLE MODAL ==================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-bg-tertiary flex flex-col max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            {/* Modal Header */}
            <div className="p-5 border-b border-bg-tertiary flex justify-between items-center bg-bg-secondary rounded-t-2xl">
              <h3 className="text-lg font-bold text-white font-heading">Crear Nueva Rifa</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-text-muted hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateRaffle} className="p-6 flex flex-col gap-5 text-left">
              {/* Title & Desc */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Título de la Rifa *</label>
                <input 
                  type="text" 
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="ej. Sorteo de Banshee Exótico #2"
                  className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Descripción *</label>
                <textarea 
                  required
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detalles sobre el sorteo, reglas, condiciones..."
                  className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold resize-none"
                />
              </div>

              {/* Price, Currency & Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Precio del Boleto *</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Divisa *</label>
                  <input 
                    type="text" 
                    required
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Fecha del Sorteo *</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={newDrawDate}
                    onChange={(e) => setNewDrawDate(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                  />
                </div>
              </div>

              {/* Ticket Quantity & Prize Image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Cantidad Total de Boletos *</label>
                  <input 
                    type="number" 
                    required
                    min={10}
                    value={newTotalTickets}
                    onChange={(e) => setNewTotalTickets(Number(e.target.value))}
                    placeholder="ej. 1000"
                    className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Imagen del Premio Principal (URL)</label>
                  <input 
                    type="text" 
                    value={newPrizeImage}
                    onChange={(e) => setNewPrizeImage(e.target.value)}
                    placeholder="ej. https://images.unsplash.com/... o vacío para usar predeterminada"
                    className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                  />
                </div>
              </div>

              {/* Dynamic Prizes list */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani font-bold">Premios *</label>
                  <button
                    type="button"
                    onClick={() => setNewPrizes(p => [...p, ''])}
                    className="text-xs font-bold text-accent-gold hover:underline flex items-center gap-1 font-heading"
                  >
                    <Plus size={12} /> Agregar Premio
                  </button>
                </div>
                
                {newPrizes.map((p, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      required
                      value={p}
                      onChange={(e) => {
                        const next = [...newPrizes];
                        next[idx] = e.target.value;
                        setNewPrizes(next);
                      }}
                      placeholder={`ej. Premio #${idx + 1}`}
                      className="flex-grow py-2.5 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                    />
                    {newPrizes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNewPrizes(p => p.filter((_, i) => i !== idx))}
                        className="p-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-950/20"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Payment details form for the raffle */}
              <div className="border-t border-bg-tertiary pt-4 mt-2 flex flex-col gap-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-accent-gold font-heading">Detalles de Cobro Bancario</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Nombre del Banco</label>
                    <input 
                      type="text" 
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      placeholder="ej. Banco BHD"
                      className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Titular de la Cuenta</label>
                    <input 
                      type="text" 
                      value={newBankHolder}
                      onChange={(e) => setNewBankHolder(e.target.value)}
                      placeholder="ej. Randy Fernández"
                      className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Número de Cuenta / Cédula</label>
                  <input 
                    type="text" 
                    value={newBankId}
                    onChange={(e) => setNewBankId(e.target.value)}
                    placeholder="ej. 40238396705"
                    className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-rajdhani">Instrucciones Adicionales</label>
                  <input 
                    type="text" 
                    value={newBankDetails}
                    onChange={(e) => setNewBankDetails(e.target.value)}
                    placeholder="ej. Poner nombre en la descripción al transferir"
                    className="w-full py-3 px-4 rounded-xl border bg-bg-primary text-white text-sm border-bg-tertiary focus:outline-none focus:border-accent-gold"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 rounded-xl font-bold tracking-wider text-sm transition-all duration-150 uppercase mt-4 hover:scale-[1.01] cursor-pointer shadow-lg font-heading"
                style={{
                  background: 'linear-gradient(135deg, #f3cf65 0%, #d4af37 100%)',
                  color: 'var(--bg-primary)'
                }}
              >
                Guardar e Inicializar Rifa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== RECEIPTS LIGHTBOX MODAL ==================== */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedReceiptUrl(null)}>
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img src={selectedReceiptUrl} alt="Comprobante ampliado" className="max-w-full max-h-[80vh] rounded-xl object-contain border border-bg-tertiary" />
            <button 
              onClick={() => setSelectedReceiptUrl(null)} 
              className="absolute -top-12 right-0 text-white hover:text-accent-gold flex items-center gap-1 font-bold uppercase tracking-wider text-xs bg-bg-secondary py-2 px-4 rounded-xl border border-bg-tertiary"
            >
              <X size={16} /> Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ==================== PURCHASE CONFIRMATION MODAL ==================== */}
      {showConfirmModal && activeRaffle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-bg-tertiary flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-bg-tertiary flex justify-between items-center bg-bg-secondary rounded-t-3xl">
              <h3 className="text-lg font-bold text-white font-heading tracking-wide uppercase">Valida tu Adquisición</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-text-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-4 text-left font-sans">
              <div className="p-4 rounded-xl bg-bg-secondary/40 border border-bg-tertiary text-xs flex flex-col gap-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-bg-tertiary/40">
                  <span className="text-text-muted uppercase tracking-wider font-semibold font-rajdhani">Cliente</span>
                  <span className="text-white font-bold text-sm">{buyerName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-bg-tertiary/40">
                  <span className="text-text-muted uppercase tracking-wider font-semibold font-rajdhani">WhatsApp</span>
                  <span className="text-white font-semibold">{buyerPhone}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-bg-tertiary/40">
                  <span className="text-text-muted uppercase tracking-wider font-semibold font-rajdhani">Correo</span>
                  <span className="text-white font-semibold">{buyerEmail}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-bg-tertiary/40">
                  <span className="text-text-muted uppercase tracking-wider font-semibold font-rajdhani">Boletos a Reservar</span>
                  <span className="text-accent-gold font-extrabold text-base font-orbitron">{ticketCount} {ticketCount === 1 ? 'Boleto' : 'Boletos'}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-text-muted uppercase tracking-wider font-semibold font-rajdhani">Monto a Transferir</span>
                  <span className="text-white font-black text-xl font-orbitron text-gold-gradient">{activeRaffle.currency}{(ticketCount * activeRaffle.ticketPrice).toLocaleString()}</span>
                </div>
              </div>

              {/* Security Hint */}
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-300 leading-relaxed font-sans">
                ⚠️ <strong>AVISO IMPORTANTE:</strong> Declaro que los datos personales coinciden con mi cuenta y que la captura de depósito adjunta corresponde exactamente al monto total a pagar.
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 rounded-xl border border-bg-tertiary text-xs font-bold text-white hover:bg-bg-secondary transition-all font-heading uppercase"
                >
                  Editar Datos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handlePurchaseSubmit();
                    setShowConfirmModal(false);
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-bg-primary hover:scale-[1.02] transition-all font-heading glow-gold"
                  style={{ background: 'linear-gradient(135deg, #f3cf65 0%, #d4af37 100%)' }}
                >
                  Sí, Enviar Compra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
