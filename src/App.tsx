import React, { useRef, useState } from 'react';
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
  Menu
} from 'lucide-react';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  <div className="mb-12 relative">
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
  const resumeRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Initialize assets from localStorage if available
  const [assets, setAssets] = useState(() => {
    const saved = localStorage.getItem('portfolio_assets');
    if (!saved) return ASSETS_INITIAL;
    
    try {
      const parsed = JSON.parse(saved);
      // Migration: If any asset is just a string, wrap it in the new object structure
      const migrated = { ...ASSETS_INITIAL };
      Object.keys(parsed).forEach(key => {
        if (typeof parsed[key] === 'string') {
          migrated[key] = { src: parsed[key], zoom: 1, position: { x: 0, y: 0 } };
        } else {
          migrated[key] = parsed[key];
        }
      });
      return migrated;
    } catch (e) {
      return ASSETS_INITIAL;
    }
  });

  // Persist assets to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('portfolio_assets', JSON.stringify(assets));
  }, [assets]);

  const updateAsset = (key: string, updates: Partial<AssetData>) => {
    setAssets(prev => ({ 
      ...prev, 
      [key]: { ...prev[key], ...updates } 
    }));
  };

  const resetAssets = () => {
    if (window.confirm('Are you sure you want to reset all images to placeholders?')) {
      setAssets(ASSETS_INITIAL);
      localStorage.removeItem('portfolio_assets');
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
            // Ensure transforms are preserved in the clone
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
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 flex flex-col items-center font-sans text-white/90 selection:bg-film-gold selection:text-black">
      {/* Controls */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-6 right-6 z-50 flex gap-4"
      >
        <button
          onClick={resetAssets}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-full font-bold transition-all backdrop-blur-md border border-white/10 cursor-pointer"
        >
          Reset Images
        </button>
        <button
          onClick={downloadPDF}
          disabled={isDownloading}
          className="flex items-center gap-2 bg-film-gold hover:scale-105 active:scale-95 text-black px-8 py-4 rounded-full font-bold transition-all shadow-[0_0_30px_rgba(201,168,79,0.4)] disabled:opacity-50 cursor-pointer"
        >
          {isDownloading ? (
            <span className="animate-pulse flex items-center gap-2">
              <Zap size={18} className="animate-bounce" />
              Processing...
            </span>
          ) : (
            <>
              <Download size={20} />
              Export Portfolio
            </>
          )}
        </button>
      </motion.div>

      {/* Resume Container */}
      <div ref={resumeRef} className="flex flex-col gap-16">
        
        {/* PAGE 1: THE COVER / IDENTITY */}
        <PageWrapper>
          <div className="absolute inset-0">
            <EditableImage 
              data={assets.cover} 
              onUpdate={(updates) => updateAsset('cover', updates)}
              className="w-full h-full"
              alt="Cover Image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cinematic-black via-cinematic-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-cinematic-black/30 pointer-events-none" />
          </div>

          <div className="relative z-10 flex flex-col h-full p-20 pointer-events-none">
            <div className="flex justify-between items-start">
              <div className="bg-film-gold text-black px-4 py-1 font-display text-xl tracking-widest uppercase pointer-events-auto">
                Portfolio Resume
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.5em] opacity-60">Est. 2010</p>
              </div>
            </div>

            <div className="mt-auto mb-16">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-film-gold font-display text-3xl tracking-[0.4em] uppercase mb-2">Director of Photography</p>
                <h1 className="text-[140px] font-display leading-[0.8] tracking-tighter mb-12 uppercase">
                  Cameron<br />
                  <span className="text-white/20 outline-text">Johnson</span>
                </h1>
              </motion.div>
              
              <div className="grid grid-cols-3 gap-12 border-t border-white/10 pt-12">
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
          <div className="flex flex-col h-full bg-[#0a0a0a]">
            <div className="p-20 pb-10">
              <EditorialHeader title="Technical" subtitle="Toolkit & Industry Recognition" number="03" />
            </div>

            <div className="px-20 grid grid-cols-12 gap-12 flex-1 pb-12">
              {/* Left Side: The Hardware Dashboard */}
              <div className="col-span-7 flex flex-col gap-8">
                <div className="bg-[#151619] rounded-[40px] p-12 border border-white/5 shadow-2xl relative overflow-hidden flex-1">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                    <Monitor size={240} />
                  </div>
                  
                  <div className="flex items-center gap-4 mb-12">
                    <div className="w-2 h-2 rounded-full bg-film-gold animate-pulse" />
                    <h4 className="text-xs font-mono uppercase tracking-[0.4em] text-film-gold">System Configuration</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-x-12 gap-y-16">
                    <div className="space-y-4">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 border-b border-white/10 pb-2">01. Cinema Systems</p>
                      <ul className="text-sm font-light space-y-2 opacity-80 leading-relaxed">
                        <li>RED Komodo X [6K]</li>
                        <li>ARRI Alexa Mini LF</li>
                        <li>Sony FX9 / FX6</li>
                        <li>DJI Inspire 3 [8K]</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 border-b border-white/10 pb-2">02. Optics & Light</p>
                      <ul className="text-sm font-light space-y-2 opacity-80 leading-relaxed">
                        <li>Steadicam / RS4 Pro</li>
                        <li>Teradek Bolt 6</li>
                        <li>Aputure 600D / 300D</li>
                        <li>Nanlite Forza Series</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 border-b border-white/10 pb-2">03. Post Pipeline</p>
                      <ul className="text-sm font-light space-y-2 opacity-80 leading-relaxed">
                        <li>DaVinci Resolve [Color]</li>
                        <li>Premiere Pro [Edit]</li>
                        <li>After Effects [VFX]</li>
                        <li>Blender [3D]</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 border-b border-white/10 pb-2">04. Education</p>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-tight">Art Academy of Cincinnati</p>
                          <p className="text-[9px] opacity-40 uppercase">Digital Media Studies</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-tight">University of Cincinnati</p>
                          <p className="text-[9px] opacity-40 uppercase">Digital Media & Production</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Achievements & Visual */}
              <div className="col-span-5 flex flex-col gap-8">
                <div className="flex-1 relative rounded-[40px] overflow-hidden border border-white/10 group">
                  <EditableImage 
                    data={assets.project1} 
                    onUpdate={(updates) => updateAsset('project1', updates)}
                    className="w-full h-full"
                    label="Portfolio Highlight"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 p-10">
                    <p className="text-film-gold text-[10px] font-bold uppercase tracking-[0.4em] mb-2">Technical Execution</p>
                    <h4 className="text-2xl font-display uppercase tracking-tighter text-white">Steadicam Operation | RED Komodo X</h4>
                  </div>
                </div>

                <div className="bg-white/5 rounded-[32px] p-8 border border-white/10">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-film-gold mb-6 flex items-center gap-3">
                    <Award size={14} /> Recognition
                  </h4>
                  <div className="space-y-4">
                    {[
                      { title: "Best iPhone Film", org: "UPAA Winner" },
                      { title: "Hoodtorial University", org: "25K Platform" },
                      { title: "Music Walk of Fame", org: "Archived (CPL)" }
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center group cursor-default">
                        <span className="text-xs font-medium uppercase tracking-tight group-hover:text-film-gold transition-colors">{item.title}</span>
                        <div className="h-[1px] flex-1 mx-4 bg-white/5" />
                        <span className="text-[9px] opacity-30 uppercase font-mono">{item.org}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto py-10 px-20 border-t border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 opacity-40">
                  <Instagram size={14} />
                  <span className="text-[10px] tracking-[0.4em] uppercase font-bold">@Bangoutfilms</span>
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
            <div className="px-20 pt-16 pb-8 flex justify-between items-end">
              <EditorialHeader title="Gallery" subtitle="Visual Narrative & Frame Studies" number="04" />
              <div className="text-right pb-2">
                <p className="text-[10px] tracking-[0.6em] uppercase text-film-gold font-bold">Frame Studies</p>
                <p className="text-[8px] tracking-widest uppercase opacity-30 mt-1">Cinematic Composition</p>
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
                  <div className="absolute bottom-0 left-0 right-0 p-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="bg-film-gold text-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest">Lead Narrative</span>
                      <div className="h-[1px] w-12 bg-white/30" />
                    </div>
                    <h4 className="text-4xl font-display uppercase tracking-tighter text-white">Olay Beauty</h4>
                    <p className="text-film-gold text-[10px] font-bold uppercase tracking-[0.5em] mt-2">Product Cinematography • Texture • Form</p>
                  </div>
                </div>
                <div className="px-10 text-center">
                  <p className="text-[10px] font-bold text-film-gold uppercase tracking-widest mb-1">OLAY — SPEC CAMPAIGN</p>
                  <p className="text-[9px] font-light leading-relaxed opacity-60 max-w-xl mx-auto">
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
                  </div>
                  <div className="px-1">
                    <p className="text-[10px] font-bold text-film-gold uppercase tracking-widest mb-0.5">Cincinnati Black Music Walk of Fame Documentary</p>
                    <p className="text-[8px] font-light leading-tight opacity-60">
                      Feat. Damon Jones, Chief Marketing Officer, Procter & Gamble • Directed by Cameron Johnson Archived by the Cincinnati Public Library.
                    </p>
                  </div>
                </div>

                {/* Febreze Auto */}
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden border border-white/5 shadow-xl group aspect-video">
                    <EditableImage 
                      data={assets.gallery5} 
                      onUpdate={(updates) => updateAsset('gallery5', updates)}
                      className="w-full h-full"
                      label="Febreze Auto | Spec Commercial"
                    />
                  </div>
                  <div className="px-1">
                    <p className="text-[10px] font-bold text-film-gold uppercase tracking-widest mb-0.5">Febreze Auto — Spec Commercial</p>
                    <p className="text-[8px] font-light leading-tight opacity-60">
                      In-vehicle cinematography using practical ambient lighting — dashboard glow, mixed color temperatures — for a cinematic product moment.
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

      {/* Footer Info */}
      <div className="mt-16 text-center text-white/20 text-xs max-w-2xl leading-relaxed">
        <p>© 2026 Cameron Johnson. All Rights Reserved.</p>
        <p className="mt-2 uppercase tracking-[0.4em]">
          Director of Photography | Cinematographer | Visual Production Lead
        </p>
      </div>
    </div>
  );
}
