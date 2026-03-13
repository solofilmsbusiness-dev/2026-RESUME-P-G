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
    position: data?.position || { x: 0, y: 0 }
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const img = new Image();
          img.onload = () => {
            // Cinematic Optimizer: Resize large images to max 2000px while maintaining aspect ratio
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
              // Export as high-quality JPEG to save significant space over PNG
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
              onUpdate({ src: compressedDataUrl, zoom: 1, position: { x: 0, y: 0 } });
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
    if (e.button !== 0) return; // Only left click
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

  return (
    <div 
      className={cn("relative group overflow-hidden select-none", className, isDragging ? "cursor-grabbing" : "cursor-move")}
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
          "w-full h-full object-cover transition-transform duration-75 pointer-events-none",
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

        <div className="w-full max-w-[120px] bg-black/60 backdrop-blur-md p-2 rounded-full flex items-center gap-3 pointer-events-auto border border-white/10">
          <button 
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="p-1 hover:text-film-gold transition-colors"
          >
            <Layers size={14} />
          </button>
          <input 
            type="range" 
            min="1" 
            max="3" 
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
              <div className="mt-8 max-w-xl">
                <p className="text-xl font-light leading-relaxed opacity-80 italic border-l-2 border-film-gold pl-8">
                  "A national production house specializing in high-end commercial visuals, beauty, and product storytelling for global heritage brands."
                </p>
              </div>
            </div>

            {/* Middle Section: The Work (Bento Style) */}
            <div className="flex-1 px-20 pb-10 grid grid-cols-12 gap-6">
              <div className="col-span-8 relative group overflow-hidden rounded-3xl border border-white/5">
                <EditableImage 
                  data={assets.project3} 
                  onUpdate={(updates) => updateAsset('project3', updates)}
                  className="w-full h-full"
                  label="Solo Films Narrative"
                />
                <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/90 to-transparent">
                  <h4 className="text-2xl font-bold uppercase tracking-tighter">Founder / Director / DP</h4>
                  <p className="text-film-gold text-[10px] font-bold uppercase tracking-[0.3em] mt-2">National Commercial Operations</p>
                </div>
              </div>
              
              <div className="col-span-4 flex flex-col gap-6">
                <div className="flex-1 relative rounded-3xl overflow-hidden border border-white/5">
                  <EditableImage 
                    data={assets.product1} 
                    onUpdate={(updates) => updateAsset('product1', updates)}
                    className="w-full h-full"
                    label="Olay Beauty"
                  />
                </div>
                <div className="flex-1 relative rounded-3xl overflow-hidden border border-white/5">
                  <EditableImage 
                    data={assets.product2} 
                    onUpdate={(updates) => updateAsset('product2', updates)}
                    className="w-full h-full"
                    label="Tide Commercial"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Section: Client List & Detail */}
            <div className="px-20 pb-20 grid grid-cols-3 gap-12">
              <div className="col-span-2">
                <div className="flex items-center gap-6 mb-6">
                  <div className="h-[1px] flex-1 bg-white/10" />
                  <span className="text-[10px] uppercase tracking-[0.5em] text-film-gold font-bold">Production Reach</span>
                  <div className="h-[1px] flex-1 bg-white/10" />
                </div>
                <div className="grid grid-cols-4 gap-4 opacity-40 text-[9px] uppercase tracking-widest font-bold text-center">
                  <span>Los Angeles</span>
                  <span>Atlanta</span>
                  <span>New York</span>
                  <span>Chicago</span>
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <p className="text-[10px] font-light opacity-50 leading-relaxed text-right">
                  Directing cinematic productions for global brands including P&G, Olay, Febreze, and Dawn.
                </p>
              </div>
            </div>

            <div className="mt-auto py-8 px-20 border-t border-white/5 flex justify-between items-center opacity-30">
              <p className="text-[10px] tracking-widest uppercase">Cameron Johnson | Solo Films</p>
              <p className="text-[10px] tracking-widest uppercase">Section 02</p>
            </div>
          </div>
        </PageWrapper>

        {/* PAGE 4: TECHNICAL TOOLKIT & ACHIEVEMENTS */}
        <PageWrapper>
          <div className="flex flex-col h-full bg-[#080808]">
            <div className="p-20 pb-10">
              <EditorialHeader title="Portfolio" subtitle="Technical Specs & Industry Recognition" number="03" />
            </div>

            {/* Technical Spec Grid */}
            <div className="px-20 grid grid-cols-12 gap-12 flex-1">
              {/* Left Column: Visuals */}
              <div className="col-span-5 flex flex-col gap-8">
                <div className="aspect-[4/5] relative rounded-[40px] overflow-hidden border border-white/10">
                  <EditableImage 
                    data={assets.project1} 
                    onUpdate={(updates) => updateAsset('project1', updates)}
                    className="w-full h-full"
                    label="Black Music Walk of Fame"
                  />
                </div>
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-film-gold mb-6 flex items-center gap-2">
                    <Award size={14} /> Key Achievements
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-tight">Best iPhone Film</span>
                      <span className="text-[8px] opacity-40 uppercase">UPAA Winner</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-tight">Hoodtorial University</span>
                      <span className="text-[8px] opacity-40 uppercase">25K Platform</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-tight">Music Walk of Fame</span>
                      <span className="text-[8px] opacity-40 uppercase">Archived (CPL)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Toolkit & Education */}
              <div className="col-span-7 flex flex-col gap-12">
                {/* Toolkit - Technical Dashboard Style */}
                <div className="bg-white/5 p-10 rounded-[40px] border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Monitor size={80} />
                  </div>
                  <h4 className="text-xl font-display uppercase tracking-widest text-film-gold mb-10">Technical Toolkit</h4>
                  
                  <div className="space-y-10">
                    <div className="relative pl-6 border-l border-film-gold/30">
                      <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 mb-3">Cinema Systems</p>
                      <p className="text-sm font-light leading-relaxed opacity-90">
                        RED Komodo X • ARRI Alexa Mini LF • Sony FX9/FX6 • DJI Inspire 3 • Canon C500 Mk II
                      </p>
                    </div>
                    
                    <div className="relative pl-6 border-l border-film-gold/30">
                      <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 mb-3">Optics & Light</p>
                      <p className="text-sm font-light leading-relaxed opacity-90">
                        Steadicam • RS4 Pro • Teradek Bolt 6 • Aputure 600D/300D • Nanlite Forza • Tabletop Rigs
                      </p>
                    </div>

                    <div className="relative pl-6 border-l border-film-gold/30">
                      <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 mb-3">Post Pipeline</p>
                      <p className="text-sm font-light leading-relaxed opacity-90">
                        DaVinci Resolve • Premiere Pro • After Effects • Blender • AI-assisted Workflows
                      </p>
                    </div>
                  </div>
                </div>

                {/* Education */}
                <div className="pl-10">
                  <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-film-gold mb-8 flex items-center gap-2">
                    <Layers size={14} /> Academic Foundation
                  </h4>
                  <div className="grid grid-cols-1 gap-8">
                    <div className="flex gap-6 items-start">
                      <div className="w-1 h-1 rounded-full bg-film-gold mt-2" />
                      <div>
                        <p className="text-sm font-bold uppercase tracking-tight">Art Academy of Cincinnati</p>
                        <p className="text-[10px] opacity-40 uppercase tracking-widest">Digital Media Studies</p>
                      </div>
                    </div>
                    <div className="flex gap-6 items-start">
                      <div className="w-1 h-1 rounded-full bg-film-gold mt-2" />
                      <div>
                        <p className="text-sm font-bold uppercase tracking-tight">University of Cincinnati</p>
                        <p className="text-[10px] opacity-40 uppercase tracking-widest">Digital Media & Production</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto py-12 px-20 border-t border-white/5 flex justify-between items-center opacity-30">
              <div className="flex items-center gap-6">
                <Instagram size={14} />
                <span className="text-[10px] tracking-widest uppercase">@Bangoutfilms</span>
              </div>
              <p className="text-[10px] tracking-widest uppercase">Section 03</p>
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
