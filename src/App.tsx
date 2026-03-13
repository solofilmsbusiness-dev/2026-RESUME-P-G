import * as React from 'react';
import { useRef, useState, useEffect } from 'react';
import { 
  Download, 
  Mail, 
  Globe, 
  Instagram, 
  Camera, 
  Film, 
  Award, 
  MapPin, 
  Phone,
  ChevronRight,
  Play,
  Layers,
  Monitor,
  Zap,
  ExternalLink,
  Menu,
  Printer,
  LogIn,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  getDocFromServer,
  Timestamp,
  collection,
  query
} from 'firebase/firestore';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    const { hasError, error } = (this as any).state;
    if (hasError) {
      let message = "Something went wrong.";
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.error.includes('insufficient permissions')) {
          message = "You don't have permission to perform this action. Please make sure you are logged in.";
        }
      } catch (e) {}

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
          <div className="max-w-md bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-xl">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Application Error</h2>
            <p className="text-white/60 text-sm mb-6">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-film-gold text-black px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

interface AssetData {
  src: string;
  zoom: number;
  position: { x: number; y: number };
  fit?: 'cover' | 'contain';
}

const ASSETS_INITIAL: Record<string, AssetData> = {
  cover: { src: "https://picsum.photos/seed/cinematic/1920/1080", zoom: 1, position: { x: 0, y: 0 } },
  product1: { src: "https://picsum.photos/seed/skincare/1280/720", zoom: 1, position: { x: 0, y: 0 } },
  product2: { src: "https://picsum.photos/seed/laundry/1280/720", zoom: 1, position: { x: 0, y: 0 } },
  product3: { src: "https://picsum.photos/seed/fresh/1280/720", zoom: 1, position: { x: 0, y: 0 } },
  product4: { src: "https://picsum.photos/seed/clean/1280/720", zoom: 1, position: { x: 0, y: 0 } },
  project1: { src: "https://picsum.photos/seed/documentary/1280/720", zoom: 1, position: { x: 0, y: 0 } },
  project2: { src: "https://picsum.photos/seed/celebration/1280/720", zoom: 1, position: { x: 0, y: 0 } },
  project3: { src: "https://picsum.photos/seed/music/1280/720", zoom: 1, position: { x: 0, y: 0 } },
  project4: { src: "https://picsum.photos/seed/university/1280/720", zoom: 1, position: { x: 0, y: 0 } },
  project5: { src: "https://picsum.photos/seed/home/1280/720", zoom: 1, position: { x: 0, y: 0 } },
  gallery1: { src: "https://picsum.photos/seed/cinemag1/1280/720", zoom: 1, position: { x: 0, y: 0 } },
  gallery2: { src: "https://picsum.photos/seed/cinemag2/1280/720", zoom: 1, position: { x: 0, y: 0 } },
  gallery3: { src: "https://picsum.photos/seed/cinemag3/1280/720", zoom: 1, position: { x: 0, y: 0 } },
  gallery4: { src: "https://picsum.photos/seed/cinemag4/1280/720", zoom: 1, position: { x: 0, y: 0 } },
  gallery5: { src: "https://picsum.photos/seed/cinemag5/1280/720", zoom: 1, position: { x: 0, y: 0 } },
  gallery6: { src: "https://picsum.photos/seed/cinemag6/1280/720", zoom: 1, position: { x: 0, y: 0 } },
};

const PageWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("w-[794px] h-[1123px] bg-cinematic-black relative overflow-hidden flex flex-col shadow-2xl resume-page", className)}>
    {children}
  </div>
);

const EditorialHeader = ({ title, subtitle, number }: { title: string, subtitle?: string, number: string }) => (
  <div className="mb-8 relative">
    <div className="absolute -top-8 -left-4 text-[120px] font-display text-white/5 leading-none select-none">
      {number}
    </div>
    <div className="relative z-10">
      <h2 className="text-6xl font-display uppercase tracking-tight text-white leading-none">{title}</h2>
      {subtitle && <p className="text-film-gold font-display text-lg tracking-[0.4em] uppercase mt-2">{subtitle}</p>}
    </div>
  </div>
);

const EditableImage = ({ 
  data,
  onUpdate, 
  className, 
  alt,
  label
}: { 
  data: AssetData, 
  onUpdate: (updates: Partial<AssetData>) => void, 
  className?: string,
  alt?: string,
  label?: string
}) => {
  const [isOver, setIsOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Defensive check for data structure
  const safeData = {
    src: data?.src || "https://picsum.photos/seed/error/1280/720",
    zoom: data?.zoom || 1,
    position: data?.position || { x: 0, y: 0 },
    fit: data?.fit || 'cover'
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const img = new Image();
          img.onload = () => {
            const MAX_WIDTH = 2000;
            const MAX_HEIGHT = 2000;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
              onUpdate({ src: compressedDataUrl, zoom: 1, position: { x: 0, y: 0 }, fit: 'cover' });
            }
          };
          img.src = event.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - safeData.position.x, y: e.clientY - safeData.position.y });
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    onUpdate({ 
      position: { 
        x: e.clientX - dragStart.x, 
        y: e.clientY - dragStart.y 
      } 
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const toggleFit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ fit: safeData.fit === 'cover' ? 'contain' : 'cover' });
  };

  const resetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ position: { x: 0, y: 0 }, zoom: 1 });
  };

  return (
    <div 
      className={cn("relative group overflow-hidden select-none bg-black/20", className, isDragging ? "cursor-grabbing" : "cursor-move")}
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/tiff" 
        onChange={handleFileChange}
      />
      <img 
        src={safeData.src} 
        alt={alt || "Editable Image"} 
        className={cn(
          "w-full h-full transition-transform duration-75 pointer-events-none",
          safeData.fit === 'cover' ? "object-cover" : "object-contain",
          isOver && "opacity-50"
        )}
        style={{
          transform: `scale(${safeData.zoom}) translate(${safeData.position.x / safeData.zoom}px, ${safeData.position.y / safeData.zoom}px)`
        }}
        referrerPolicy="no-referrer"
      />
      
      {/* Controls Overlay */}
      <div className={cn(
        "absolute inset-0 flex flex-col items-center justify-between bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-4 pointer-events-none",
        (isOver || isDragging) && "opacity-100"
      )}>
        <div className="flex flex-col items-center">
          <Camera size={20} className="text-film-gold mb-1" />
          <p className="text-[8px] font-bold uppercase tracking-widest text-white">Drag to Pan • Drop to Replace</p>
        </div>

        <div className="w-full max-w-[180px] bg-black/60 backdrop-blur-md p-2 rounded-full flex items-center gap-2 pointer-events-auto border border-white/10">
          <button 
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="p-1.5 hover:text-film-gold transition-colors"
            title="Upload Image"
          >
            <Layers size={14} />
          </button>
          <button 
            onClick={toggleFit}
            className={cn("p-1.5 transition-colors", safeData.fit === 'contain' ? "text-film-gold" : "hover:text-film-gold")}
            title={safeData.fit === 'cover' ? "Switch to Fit" : "Switch to Fill"}
          >
            <Monitor size={14} />
          </button>
          <button 
            onClick={resetPosition}
            className="p-1.5 hover:text-film-gold transition-colors"
            title="Reset Position"
          >
            <Zap size={14} />
          </button>
          <div className="h-4 w-[1px] bg-white/20 mx-1" />
          <input 
            type="range" 
            min="0.1" 
            max="5" 
            step="0.01" 
            value={safeData.zoom}
            onChange={(e) => onUpdate({ zoom: parseFloat(e.target.value) })}
            className="flex-1 accent-film-gold h-1"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {label && <p className="text-[8px] uppercase tracking-widest text-film-gold font-bold">{label}</p>}
      </div>

      {isOver && (
        <div className="absolute inset-0 border-2 border-dashed border-film-gold m-2 rounded-lg pointer-events-none" />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const resumeRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [assets, setAssets] = useState<Record<string, AssetData>>(ASSETS_INITIAL);

  // Connection Test
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!user) {
      setAssets(ASSETS_INITIAL);
      return;
    }

    const assetsPath = `portfolios/${user.uid}/assets`;
    const q = query(collection(db, assetsPath));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const remoteAssets: Record<string, AssetData> = { ...ASSETS_INITIAL };
        snapshot.forEach((doc) => {
          remoteAssets[doc.id] = doc.data() as AssetData;
        });
        setAssets(remoteAssets);
      } else {
        // If no assets exist yet, we don't need to do anything, 
        // the local state is already ASSETS_INITIAL
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, assetsPath);
    });

    return () => unsubscribe();
  }, [user]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = () => signOut(auth);

  const updateAsset = async (key: string, updates: Partial<AssetData>) => {
    if (!user) return;

    const currentAsset = assets[key] || ASSETS_INITIAL[key];
    const updatedAsset = { ...currentAsset, ...updates };
    
    // Update local state immediately for responsiveness
    setAssets(prev => ({
      ...prev,
      [key]: updatedAsset
    }));

    const path = `portfolios/${user.uid}/assets/${key}`;
    setIsSaving(true);
    try {
      await setDoc(doc(db, path), {
        ...updatedAsset,
        updatedAt: Timestamp.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const resetAssets = async () => {
    if (!user) return;
    if (confirm('Are you sure you want to reset all images to placeholders?')) {
      setIsSaving(true);
      try {
        // We'll just update the local state and let the user re-upload if they want.
        // Or we could delete the docs, but overwriting is easier.
        const batchPromises = Object.keys(ASSETS_INITIAL).map(key => {
          const path = `portfolios/${user.uid}/assets/${key}`;
          return setDoc(doc(db, path), {
            ...ASSETS_INITIAL[key],
            updatedAt: Timestamp.now()
          });
        });
        await Promise.all(batchPromises);
        setAssets(ASSETS_INITIAL);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `portfolios/${user.uid}/assets`);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const downloadPDF = async () => {
    if (!resumeRef.current) return;
    setIsDownloading(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = resumeRef.current.querySelectorAll('.resume-page');

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#0B0B0B',
          onclone: (clonedDoc) => {
            const clonedPages = clonedDoc.querySelectorAll('.resume-page');
            const targetPage = clonedPages[i] as HTMLElement;
            if (targetPage) {
              targetPage.style.display = 'flex';
            }
          }
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save('Cameron_Johnson_Cinematic_Portfolio.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 flex flex-col items-center font-sans text-white/90 selection:bg-film-gold selection:text-black">
      {/* Auth Overlay */}
      <AnimatePresence>
        {!user && isAuthReady && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full text-center">
              <div className="w-20 h-20 bg-film-gold/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-film-gold/20 shadow-[0_0_50px_rgba(201,168,79,0.1)]">
                <Film className="w-10 h-10 text-film-gold" />
              </div>
              <h1 className="text-4xl font-display uppercase tracking-tight text-white mb-4">Cinematic Portfolio</h1>
              <p className="text-white/60 mb-10 leading-relaxed">
                To save your custom images and ensure your portfolio persists across all devices, please sign in with your Google account.
              </p>
              <button 
                onClick={login}
                className="w-full bg-film-gold text-black py-4 rounded-full font-bold uppercase tracking-[0.2em] text-sm shadow-[0_0_30px_rgba(201,168,79,0.3)] hover:shadow-[0_0_50px_rgba(201,168,79,0.5)] transition-all duration-500 flex items-center justify-center gap-3 group"
              >
                <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                Sign in with Google
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Controls */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-[210mm] mb-8 flex justify-between items-center px-4"
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h2 className="text-film-gold font-display text-lg tracking-[0.2em] uppercase">Export Controls</h2>
            <AnimatePresence>
              {isSaving && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-2 px-2 py-0.5 bg-film-gold/10 border border-film-gold/20 rounded text-[8px] font-bold uppercase tracking-widest text-film-gold"
                >
                  <div className="w-1.5 h-1.5 bg-film-gold rounded-full animate-pulse" />
                  Saving...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">Optimized for A4 Print & Digital Distribution</p>
        </div>
        
        <div className="flex items-center gap-4">
          {user && (
            <button 
              onClick={logout}
              className="p-3 text-white/40 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors px-4 py-2 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest"
          >
            <Printer size={14} />
            Print
          </button>
          <button
            onClick={downloadPDF}
            disabled={isDownloading}
            className={cn(
              "flex items-center gap-3 bg-film-gold hover:scale-105 active:scale-95 text-black px-10 py-5 rounded-full font-bold uppercase text-xs tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(201,168,79,0.4)] disabled:opacity-50 cursor-pointer",
              isDownloading && "animate-pulse"
            )}
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download size={18} />
                Download PDF
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Resume Container */}
      <div ref={resumeRef} className="flex flex-col gap-16">
        
        {/* PAGE 1: THE COVER / IDENTITY */}
        <PageWrapper className="group/page">
          {/* Cinematic Film Frame Elements */}
          <div className="absolute inset-0 z-20 pointer-events-none border-[1px] border-white/10 m-4 rounded-sm" />
          <div className="absolute inset-x-0 top-0 z-20 pointer-events-none flex justify-between px-8 py-2 opacity-20">
            <div className="flex gap-4 items-center">
              <div className="w-1 h-1 bg-white rounded-full" />
              <p className="text-[8px] font-mono tracking-widest uppercase">REC • 00:00:00:00</p>
            </div>
            <p className="text-[8px] font-mono tracking-widest uppercase">24 FPS • 8K RAW</p>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none flex justify-between px-8 py-2 opacity-20">
            <p className="text-[8px] font-mono tracking-widest uppercase">ISO 800 • 5600K</p>
            <div className="flex gap-4 items-center">
              <p className="text-[8px] font-mono tracking-widest uppercase">STBY • 100%</p>
              <div className="w-1 h-1 bg-white rounded-full" />
            </div>
          </div>
          
          {/* Corner Crop Marks */}
          <div className="absolute top-8 left-8 w-8 h-8 border-t border-l border-white/20 z-20 pointer-events-none" />
          <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-white/20 z-20 pointer-events-none" />
          <div className="absolute bottom-8 left-8 w-8 h-8 border-b border-l border-white/20 z-20 pointer-events-none" />
          <div className="absolute bottom-8 right-8 w-8 h-8 border-b border-r border-white/20 z-20 pointer-events-none" />

          <div className="absolute inset-0">
            <EditableImage 
              data={assets.cover} 
              onUpdate={(updates) => updateAsset('cover', updates)}
              className="w-full h-full"
              alt="Cover Image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cinematic-black via-cinematic-black/60 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-cinematic-black/40 pointer-events-none" />
          </div>

          <div className="absolute inset-0 z-10 flex flex-col p-20 pointer-events-none">
            <div className="flex justify-between items-start">
              <div className="bg-film-gold text-black px-6 py-2 font-display text-xl tracking-[0.3em] uppercase pointer-events-auto shadow-[0_0_20px_rgba(201,168,79,0.3)]">
                Portfolio Resume
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.6em] text-film-gold font-bold">Cameron Johnson</p>
                <p className="text-[8px] uppercase tracking-[0.5em] opacity-40 mt-1">Visual Production Lead</p>
              </div>
            </div>

            <div className="mt-auto mb-16">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-[1px] w-12 bg-film-gold" />
                  <p className="text-film-gold font-display text-2xl tracking-[0.5em] uppercase">Director of Photography</p>
                </div>
                <h1 className="text-[150px] font-display leading-[0.75] tracking-tighter mb-12 uppercase">
                  Cameron<br />
                  <span className="text-white/10 outline-text-heavy">Johnson</span>
                </h1>
                <p className="text-xl font-light tracking-[0.2em] text-white/60 max-w-xl leading-relaxed uppercase">
                  Crafting cinematic narratives through <span className="text-white">light, motion, and visual architecture</span>.
                </p>
              </motion.div>
              
              <div className="grid grid-cols-3 gap-12 border-t border-white/10 mt-16 pt-12">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-film-gold font-bold mb-2">Location</span>
                  <span className="text-xl font-light">Cincinnati, OH</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-film-gold font-bold mb-2">Experience</span>
                  <span className="text-xl font-light">15+ Years</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-film-gold font-bold mb-2">Reach</span>
                  <span className="text-xl font-light">Millions of Views</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Mail size={16} className="text-film-gold" />
                  <span className="text-sm font-light tracking-wide">camerondjohnson@yahoo.com</span>
                </div>
                <div className="flex items-center gap-4">
                  <Globe size={16} className="text-film-gold" />
                  <span className="text-sm font-light tracking-wide">solofilmsofficial.com</span>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex items-center gap-6 pointer-events-auto">
                <div className="text-center border-r border-white/10 pr-6">
                  <p className="text-film-gold font-display text-3xl">25K</p>
                  <p className="text-[8px] uppercase tracking-widest opacity-50">Instagram</p>
                </div>
                <div className="flex items-center gap-3">
                  <Play size={20} className="text-film-gold fill-film-gold" />
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest">View Showreel</p>
                    <p className="text-[8px] opacity-40 uppercase">vimeo.com/solofilmsofficial</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <style dangerouslySetInnerHTML={{ __html: `
            .outline-text {
              -webkit-text-stroke: 1px rgba(255,255,255,0.3);
              color: transparent;
            }
            .outline-text-heavy {
              -webkit-text-stroke: 2px rgba(255,255,255,0.1);
              color: transparent;
            }
          `}} />
        </PageWrapper>

        {/* PAGE 2: THE VISION & LEADERSHIP */}
        <PageWrapper>
          <div className="p-20 flex flex-col h-full bg-[#080808]">
            <EditorialHeader title="The Vision" subtitle="Production Leadership & Creative Strategy" number="01" />
            
            <div className="grid grid-cols-12 gap-16 mb-20">
              <div className="col-span-7">
                <p className="text-3xl font-light leading-tight opacity-90 mb-8 italic text-film-gold">
                  "Leading cinematic production and creative direction across broadcast, digital, and social platforms."
                </p>
                <p className="text-base font-light leading-relaxed opacity-70 mb-8">
                  Director of Photography and visual storyteller with 15+ years producing cinematic content across commercial, music video, documentary, and branded media. 
                </p>
                <div className="flex items-center gap-4 text-xs font-bold tracking-[0.2em] uppercase text-white/40">
                  <Zap size={14} className="text-film-gold" />
                  Representation: Independent
                </div>
              </div>
              <div className="col-span-5">
                <div className="bg-white/5 border-l-4 border-film-gold p-8 rounded-r-2xl">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-film-gold mb-6">Commercial Clients</h4>
                  <ul className="grid grid-cols-1 gap-3 text-[11px] font-light opacity-80">
                    <li className="flex items-center gap-3"><ChevronRight size={12} className="text-film-gold" /> Procter & Gamble</li>
                    <li className="flex items-center gap-3"><ChevronRight size={12} className="text-film-gold" /> Urban League of GSO</li>
                    <li className="flex items-center gap-3"><ChevronRight size={12} className="text-film-gold" /> Mercy Health</li>
                    <li className="flex items-center gap-3"><ChevronRight size={12} className="text-film-gold" /> Planned Parenthood</li>
                    <li className="flex items-center gap-3"><ChevronRight size={12} className="text-film-gold" /> City of Cincinnati</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-display tracking-widest uppercase text-film-gold mb-10 flex items-center gap-4">
                <Monitor size={20} /> Institutional Leadership
              </h3>
              
              <div className="relative pl-12 border-l border-white/10">
                <div className="absolute -left-[3px] top-0 w-[6px] h-24 bg-film-gold" />
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-2xl font-bold uppercase tracking-tighter">Supervisor, Film Department</h4>
                    <p className="text-film-gold text-sm font-bold uppercase tracking-widest mt-1">Miami University | 2023 — Present</p>
                  </div>
                  <span className="bg-white/5 px-3 py-1 rounded text-[10px] font-mono opacity-50 uppercase">Oxford, OH</span>
                </div>
                
                <div className="grid grid-cols-2 gap-12 mt-8">
                  <ul className="text-xs font-light opacity-70 space-y-3 list-disc ml-4">
                    <li>Direct creative strategy and cinematic production for university campaigns and broadcast media</li>
                    <li>Design lighting systems, shot architecture, and production workflows for campus storytelling</li>
                    <li>Recruit and manage freelance cinematographers, camera assistants, and production crews</li>
                  </ul>
                  <ul className="text-xs font-light opacity-70 space-y-3 list-disc ml-4">
                    <li>Manage cinema systems including RED Komodo X, ARRI Alexa Mini LF, and Sony FX9/FX6</li>
                    <li>Produced campaign visuals featuring President Crawford, Sean McVay, and Brian Niccol</li>
                    <li>Mentor students and nonprofit collaborators on professional production techniques</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-12 border-t border-white/5 flex justify-between items-center opacity-30">
              <p className="text-[10px] tracking-widest uppercase">Cameron Johnson | Cinematic Portfolio</p>
              <p className="text-[10px] tracking-widest uppercase">Section 01</p>
            </div>
          </div>
        </PageWrapper>

        {/* PAGE 3: SOLO FILMS & BRANDED CONTENT */}
        <PageWrapper>
          <div className="flex flex-col h-full bg-[#080808]">
            {/* Top Section: Brand Identity */}
            <div className="p-20 pb-10">
              <EditorialHeader title="Solo Films" subtitle="Commercial & Branded Production" number="02" />
              <div className="mt-6 flex items-center gap-8">
                <div className="h-[1px] w-24 bg-film-gold" />
                <p className="text-sm font-bold uppercase tracking-[0.4em] text-white/40">Spec Campaign Showcase</p>
              </div>
            </div>

            {/* Bento Grid for Spec Campaigns */}
            <div className="px-20 grid grid-cols-12 gap-8 flex-1 pb-12">
              {/* Tide - The Hero Slot */}
              <div className="col-span-12 relative group rounded-[40px] overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] aspect-video">
                <EditableImage 
                  data={assets.product2} 
                  onUpdate={(updates) => updateAsset('product2', updates)}
                  className="w-full h-full"
                  label="Tide | Spec Campaign"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-12 pointer-events-none">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="bg-film-gold text-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest">Featured</span>
                    <div className="h-[1px] w-12 bg-white/30" />
                  </div>
                  <h4 className="text-5xl font-display uppercase tracking-tighter text-white">Tide Pods</h4>
                  <p className="text-film-gold text-sm font-bold uppercase tracking-[0.5em] mt-3">Macro • Micro Color • Product Cinematography</p>
                </div>
              </div>
              
              {/* Olay & Febreze - Secondary Bento Slots */}
              <div className="col-span-6 relative group rounded-[32px] overflow-hidden border border-white/10 shadow-2xl aspect-video">
                <EditableImage 
                  data={assets.product1} 
                  onUpdate={(updates) => updateAsset('product1', updates)}
                  className="w-full h-full"
                  label="Olay | Spec Campaign"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-8 pointer-events-none">
                  <h4 className="text-2xl font-display uppercase tracking-tighter text-white">Olay Beauty</h4>
                  <p className="text-film-gold text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Skin Narrative • Texture</p>
                </div>
              </div>

              <div className="col-span-6 relative group rounded-[32px] overflow-hidden border border-white/10 shadow-2xl aspect-video">
                <EditableImage 
                  data={assets.product3} 
                  onUpdate={(updates) => updateAsset('product3', updates)}
                  className="w-full h-full"
                  label="Febreze | Spec Campaign"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-8 pointer-events-none">
                  <h4 className="text-2xl font-display uppercase tracking-tighter text-white">Febreze</h4>
                  <p className="text-film-gold text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Atmospheric Branded Content</p>
                </div>
              </div>
            </div>

            {/* Bottom Section: Client Detail */}
            <div className="px-20 pb-16 flex justify-between items-end">
              <div className="max-w-md">
                <p className="text-xs font-light opacity-50 leading-relaxed italic">
                  "Directing cinematic productions for global brands including P&G, Olay, Febreze, and Dawn. Specialized in high-speed tabletop and beauty cinematography."
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] tracking-[0.5em] uppercase text-film-gold font-bold mb-2">Solo Films</p>
                <p className="text-[9px] tracking-widest uppercase opacity-30">Production House | Section 02</p>
              </div>
            </div>
          </div>
        </PageWrapper>

        {/* PAGE 4: TECHNICAL TOOLKIT & ACHIEVEMENTS */}
        <PageWrapper>
          <div className="flex flex-col h-full bg-[#0a0a0a] relative">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#C9A84F 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            
            <div className="p-16 pb-8 relative z-10">
              <EditorialHeader title="Technical" subtitle="Toolkit & Industry Recognition" number="03" />
            </div>

            <div className="px-16 grid grid-cols-12 gap-8 flex-1 pb-10 relative z-10">
              {/* Left Side: The Hardware Dashboard */}
              <div className="col-span-7 flex flex-col gap-8">
                <div className="bg-[#111215] rounded-[40px] p-10 border border-white/5 shadow-2xl relative overflow-hidden flex-1 flex flex-col">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                    <Monitor size={240} />
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-film-gold/20 to-transparent" />
                  
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-film-gold shadow-[0_0_10px_rgba(201,168,79,0.8)]" />
                      <h4 className="text-xs font-mono uppercase tracking-[0.4em] text-film-gold">Technical Proficiencies</h4>
                    </div>
                    <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Active Status: Optimal</div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-12 gap-y-8 flex-1">
                    <div className="space-y-4 group">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                        <Camera size={14} className="text-film-gold/50" />
                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">01. Camera Systems</p>
                      </div>
                      <ul className="text-[11px] font-light space-y-2 opacity-80 leading-relaxed">
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-film-gold/30 rounded-full" /> RED Komodo X / V-RAPTOR XL</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-film-gold/30 rounded-full" /> ARRI Alexa Mini LF / Alexa 35</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-film-gold/30 rounded-full" /> Sony A7SIII / FX9 / FX6 / FX3</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-film-gold/30 rounded-full" /> Canon C500 Mk II</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-film-gold/30 rounded-full" /> DJI Inspire 3 / Mavic 3 Cine</li>
                      </ul>
                    </div>

                    <div className="space-y-4 group">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                        <Zap size={14} className="text-film-gold/50" />
                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">02. Camera Support</p>
                      </div>
                      <ul className="text-[11px] font-light space-y-2 opacity-80 leading-relaxed">
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-film-gold/30 rounded-full" /> Steadicam systems</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-film-gold/30 rounded-full" /> DJI RS4 Pro gimbal</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-film-gold/30 rounded-full" /> EasyRig Vario 5</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-film-gold/30 rounded-full" /> Tilta Nucleus-M wireless focus</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-film-gold/30 rounded-full" /> Teradek Bolt 6 / SmallHD Ultra</li>
                      </ul>
                    </div>

                    <div className="col-span-2 space-y-4 group">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                        <Layers size={14} className="text-film-gold/50" />
                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">03. Lighting & Tabletop Architecture</p>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <ul className="text-[11px] font-light space-y-2 opacity-80 leading-relaxed">
                          <li className="flex items-center gap-2"><div className="w-1 h-1 bg-film-gold/30 rounded-full" /> Aputure 600D / 300D series</li>
                          <li className="flex items-center gap-2"><div className="w-1 h-1 bg-film-gold/30 rounded-full" /> Nanlite Forza series</li>
                          <li className="flex items-start gap-2">
                            <div className="w-1 h-1 bg-film-gold/30 rounded-full mt-1.5 shrink-0" /> 
                            <span>High-speed tabletop lighting for product, beauty, and lifestyle</span>
                          </li>
                        </ul>
                        <ul className="text-[11px] font-light space-y-2 opacity-80 leading-relaxed">
                          <li className="flex items-start gap-2">
                            <div className="w-1 h-1 bg-film-gold/30 rounded-full mt-1.5 shrink-0" /> 
                            <span>Custom tabletop rigs for liquids, reflective packaging, and textiles</span>
                          </li>
                          <li className="flex items-center gap-2"><div className="w-1 h-1 bg-film-gold/30 rounded-full" /> Precision light shaping & texture control</li>
                        </ul>
                      </div>
                    </div>

                    <div className="col-span-2 space-y-3 group">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                        <Award size={14} className="text-film-gold/50" />
                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">04. Education</p>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <div className="relative pl-4 border-l border-film-gold/20">
                            <p className="text-xs font-bold uppercase tracking-tight">University of Cincinnati</p>
                            <p className="text-[9px] opacity-40 uppercase tracking-widest mt-1">Audio Video Production</p>
                          </div>
                          <div className="relative pl-4 border-l border-film-gold/20">
                            <p className="text-xs font-bold uppercase tracking-tight">Art Academy of Cincinnati</p>
                            <p className="text-[9px] opacity-40 uppercase tracking-widest mt-1">Digital Media Studies</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="relative pl-4 border-l border-film-gold/20">
                            <p className="text-xs font-bold uppercase tracking-tight">School for Creative & Performing Arts — Cincinnati, OH</p>
                            <p className="text-[9px] opacity-40 uppercase tracking-widest mt-1">Fine Arts, Digital Art, Color Theory, Art History</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Achievements & Visual */}
              <div className="col-span-5 flex flex-col gap-8">
                <div className="flex-1 relative rounded-[40px] overflow-hidden border border-white/10 group shadow-2xl">
                  <EditableImage 
                    data={assets.project1} 
                    onUpdate={(updates) => updateAsset('project1', updates)}
                    className="w-full h-full"
                    label="Portfolio Highlight"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 p-10 pointer-events-none">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-[1px] w-8 bg-film-gold" />
                      <p className="text-film-gold text-[10px] font-bold uppercase tracking-[0.4em]">Technical Execution</p>
                    </div>
                    <h4 className="text-2xl font-display uppercase tracking-tighter text-white leading-tight">Steadicam Operation<br />RED Komodo X</h4>
                  </div>
                </div>

                <div className="bg-[#151619] rounded-[32px] p-10 border border-white/5 shadow-xl relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 opacity-[0.05]">
                    <Award size={100} className="text-film-gold" />
                  </div>
                  
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.5em] text-film-gold mb-8 flex items-center gap-3 relative z-10">
                    <Award size={14} /> Industry Recognition
                  </h4>
                  <div className="space-y-6 relative z-10">
                    {[
                      { title: "Best iPhone Film", org: "UPAA Winner", year: "2025" },
                      { title: "Hoodtorial University", org: "25K Online Platform", year: "2025" },
                      { title: "Music Walk of Fame", org: "25K Platform Archived by the Cincinnati Public Library", year: "2025" },
                      { title: "Founded Solo Films", org: "Nationally active production company across LA, ATL, NYC, Chicago, Miami & Cincinnati.", year: "2010" }
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col gap-1 group cursor-default">
                        <div className="flex justify-between items-end">
                          <span className="text-sm font-bold uppercase tracking-tight group-hover:text-film-gold transition-colors duration-300">{item.title}</span>
                          <span className="text-[8px] font-mono text-film-gold/40">{item.year}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-[1px] w-4 bg-white/10" />
                          <span className="text-[9px] opacity-30 uppercase tracking-widest font-mono">{item.org}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto py-8 px-16 border-t border-white/5 flex justify-between items-center relative z-10">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 opacity-40">
                  <Globe size={14} />
                  <span className="text-[10px] tracking-[0.4em] uppercase font-bold">solofilmsofficial.com</span>
                </div>
                <div className="h-4 w-[1px] bg-white/10" />
                <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-bold">Technical Specs | Section 03</p>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-film-gold/40" />)}
              </div>
            </div>
          </div>
        </PageWrapper>

        {/* PAGE 5: CINEMATIC GALLERY */}
        <PageWrapper>
          <div className="flex flex-col h-full bg-[#080808] overflow-hidden">
            <div className="px-20 pt-16 pb-4 flex justify-between items-end">
              <EditorialHeader title="Gallery" subtitle="Visual Narrative & Frame Studies" number="04" />
              <div className="text-right pb-2">
                <p className="text-[10px] tracking-[0.6em] uppercase text-film-gold font-bold">Frame Studies</p>
                <p className="text-[8px] tracking-widest uppercase opacity-30 mt-1">Cinematic Composition</p>
              </div>
            </div>

            <div className="px-20 mb-6">
              <div className="flex items-center gap-8">
                <div className="h-[1px] w-24 bg-film-gold" />
                <p className="text-sm font-bold uppercase tracking-[0.4em] text-white/40">Cinematic Frame Study</p>
              </div>
            </div>

            {/* 16:9 Editorial Grid */}
            <div className="px-20 flex-1 flex flex-col gap-6 pb-12">
              {/* Large Hero Image Section */}
              <div className="space-y-4">
                <div className="relative rounded-[32px] overflow-hidden border border-white/5 shadow-2xl group aspect-video mx-auto w-[90%]">
                  <EditableImage 
                    data={assets.gallery1} 
                    onUpdate={(updates) => updateAsset('gallery1', updates)}
                    className="w-full h-full"
                    label="Hero Frame Study"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-12 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-[1px] w-12 bg-film-gold" />
                      <p className="text-xs font-bold uppercase tracking-[0.4em] text-film-gold">Lead Narrative Study</p>
                    </div>
                    <h4 className="text-5xl font-display uppercase tracking-tighter text-white leading-none">Olay Beauty</h4>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.6em] mt-4">Cinematic Texture • Lighting Architecture</p>
                  </div>
                </div>
                <div className="px-10 text-center">
                  <p className="text-sm font-bold uppercase tracking-[0.4em] text-film-gold mb-2">Olay — Cinematic Study</p>
                  <p className="text-[10px] font-light leading-relaxed opacity-60 max-w-xl mx-auto uppercase tracking-widest">
                    Beauty & personal care product cinematography. Controlled ambient lighting highlighting product texture, color, and form.
                  </p>
                </div>
              </div>

              {/* 2x2 Grid Below */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {/* Swine City */}
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden border border-white/5 shadow-xl group aspect-video">
                    <EditableImage 
                      data={assets.gallery2} 
                      onUpdate={(updates) => updateAsset('gallery2', updates)}
                      className="w-full h-full"
                      label="Swine City Brewing Co."
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-[1px] w-8 bg-film-gold" />
                        <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-film-gold">Lifestyle</p>
                      </div>
                      <h4 className="text-xl font-display uppercase tracking-tighter text-white leading-none">Swine City</h4>
                    </div>
                  </div>
                  <div className="px-1">
                    <p className="text-[10px] font-bold text-film-gold uppercase tracking-widest mb-0.5">Swine City Brewing Co.</p>
                    <p className="text-[8px] font-light leading-tight opacity-60">
                      Lifestyle Campaign — On-location cinematography. Shallow depth of field, natural autumn light, product-forward composition.
                    </p>
                  </div>
                </div>

                {/* Urban League */}
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden border border-white/5 shadow-xl group aspect-video">
                    <EditableImage 
                      data={assets.gallery3} 
                      onUpdate={(updates) => updateAsset('gallery3', updates)}
                      className="w-full h-full"
                      label="Urban League × P&G"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-[1px] w-8 bg-film-gold" />
                        <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-film-gold">Community</p>
                      </div>
                      <h4 className="text-xl font-display uppercase tracking-tighter text-white leading-none">Urban League</h4>
                    </div>
                  </div>
                  <div className="px-1">
                    <p className="text-[10px] font-bold text-film-gold uppercase tracking-widest mb-0.5">Urban League × P&G</p>
                    <p className="text-[8px] font-light leading-tight opacity-60">
                      Juneteenth Campaign Series — On-location community brand storytelling. Natural light, urban environment, human-centered narrative.
                    </p>
                  </div>
                </div>

                {/* Cincinnati Black Music Walk of Fame */}
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden border border-white/5 shadow-xl group aspect-video">
                    <EditableImage 
                      data={assets.gallery4} 
                      onUpdate={(updates) => updateAsset('gallery4', updates)}
                      className="w-full h-full"
                      label="Black Music Walk of Fame"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-[1px] w-8 bg-film-gold" />
                        <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-film-gold">Documentary</p>
                      </div>
                      <h4 className="text-xl font-display uppercase tracking-tighter text-white leading-none">Walk of Fame</h4>
                    </div>
                  </div>
                  <div className="px-1">
                    <p className="text-[10px] font-bold text-film-gold uppercase tracking-widest mb-0.5">Cincinnati Black Music Walk of Fame Documentary</p>
                    <p className="text-[8px] font-light leading-tight opacity-60">
                      Feat. Damon Jones | Directed by Cameron Johnson • Archived by the Cincinnati Public Library
                    </p>
                  </div>
                </div>

                {/* Swiffer Spec Commercial */}
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden border border-white/5 shadow-xl group aspect-video">
                    <EditableImage 
                      data={assets.gallery5} 
                      onUpdate={(updates) => updateAsset('gallery5', updates)}
                      className="w-full h-full"
                      label="Swiffer | Spec Commercial"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-[1px] w-8 bg-film-gold" />
                        <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-film-gold">Spec Campaign</p>
                      </div>
                      <h4 className="text-xl font-display uppercase tracking-tighter text-white leading-none">Swiffer Spec</h4>
                    </div>
                  </div>
                  <div className="px-1">
                    <p className="text-[10px] font-bold text-film-gold uppercase tracking-widest mb-0.5">Urban League × P&G — Swiffer Spec Commercial</p>
                    <p className="text-[8px] font-light leading-tight opacity-60">
                      Product cinematography for the Urban League and P&G collaboration. Highlighting texture and form through controlled studio lighting.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto py-8 px-20 border-t border-white/5 flex justify-between items-center opacity-30">
              <p className="text-[10px] tracking-widest uppercase">Visual Narrative | Gallery</p>
              <div className="flex gap-4">
                <span className="text-[10px] tracking-widest uppercase">04 / 04</span>
              </div>
            </div>
          </div>
        </PageWrapper>
      </div>

      {/* Floating Controls */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          <button
            onClick={downloadPDF}
            disabled={isDownloading}
            className={cn(
              "group flex items-center gap-3 px-6 py-3 bg-film-gold text-black rounded-full font-bold uppercase text-[10px] tracking-[0.2em] shadow-[0_0_20px_rgba(201,168,79,0.3)] hover:shadow-[0_0_30px_rgba(201,168,79,0.5)] transition-all duration-300",
              isDownloading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isDownloading ? (
              <>
                <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download size={14} />
                Download PDF
              </>
            )}
          </button>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => window.print()}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/60 hover:text-white transition-all duration-300 backdrop-blur-md"
              title="Print Portfolio"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={() => window.open(window.location.href, '_blank')}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/60 hover:text-white transition-all duration-300 backdrop-blur-md"
              title="Open in New Tab"
            >
              <ExternalLink size={18} />
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
              }}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/60 hover:text-white transition-all duration-300 backdrop-blur-md"
              title="Copy Share Link"
            >
              <Globe size={18} />
            </button>
            <button
              onClick={resetAssets}
              className="p-3 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-full text-white/40 hover:text-red-400 transition-all duration-300 backdrop-blur-md"
              title="Reset All Images"
            >
              <Zap size={18} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Footer Info */}
      <div className="mt-16 text-center text-white/20 text-xs max-w-2xl leading-relaxed">
        <p>© 2026 Cameron Johnson. All Rights Reserved.</p>
        <p className="mt-2 uppercase tracking-[0.4em]">
          Director of Photography | Cinematographer | Visual Production Lead
        </p>
      </div>
      {/* Floating Action Button */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 no-print"
      >
        <button
          onClick={downloadPDF}
          disabled={isDownloading}
          className="w-16 h-16 bg-film-gold text-black rounded-full shadow-[0_0_30px_rgba(201,168,79,0.5)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative"
        >
          {isDownloading ? (
            <div className="w-6 h-6 border-3 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <Download size={24} />
          )}
          <span className="absolute right-full mr-4 px-3 py-1 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
            Export PDF
          </span>
        </button>
      </motion.div>
    </div>
  );
}
