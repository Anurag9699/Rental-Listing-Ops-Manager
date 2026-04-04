import { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface ImageCarouselProps {
    images: string[];
    className?: string;
}

export default function ImageCarousel({ images = [], className = '' }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Filter out undefined/null/empty strings just in case
    const validImages = images?.filter(Boolean) || [];

    if (validImages.length === 0) {
        return (
            <div className={`bg-slate-100 flex flex-col items-center justify-center text-slate-400 ${className}`}>
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs font-medium">No images</span>
            </div>
        );
    }

    const next = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % validImages.length);
    };

    const prev = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    };

    return (
        <div className={`relative group overflow-hidden ${className}`}>
            <img 
                src={validImages[currentIndex]} 
                alt={`Property view ${currentIndex + 1}`} 
                className="w-full h-full object-cover transition-opacity duration-300"
            />
            
            {validImages.length > 1 && (
                <>
                    <button 
                        onClick={prev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                        <ChevronLeft className="w-4 h-4 -ml-0.5" />
                    </button>
                    <button 
                        onClick={next}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                        <ChevronRight className="w-4 h-4 ml-0.5" />
                    </button>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                        {validImages.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white scale-110' : 'bg-white/50'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
