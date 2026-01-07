import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChefHat, Sparkles, Wheat, Egg, Milk, Cookie, Croissant, Cake, Utensils, IceCream, Candy, PartyPopper, Instagram, Phone } from "lucide-react";
import GallerySection from "@/components/GallerySection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-32 md:w-40 md:h-40">
            <Image
              src="/logo.png"
              alt="Bakes & More Logo"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 128px, 160px"
              loading="eager"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-serif font-bold text-[#B03050] tracking-widest uppercase hidden md:block">Bakes & More</span>
            <span className="hidden md:block text-4xl text-slate-400 font-['Great_Vibes'] transform -rotate-3 translate-x-4">By Hafsaa</span>
          </div>
        </div>
        <nav className="flex items-center gap-6">
          {/* Admin Link Removed */}

          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com/bakesandmore_byhafsaa"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white text-[#B03050] rounded-full shadow-sm hover:bg-pink-50 hover:scale-110 transition-all"
              title="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://wa.me/2349015670411"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white text-green-600 rounded-full shadow-sm hover:bg-green-50 hover:scale-110 transition-all"
              title="WhatsApp"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-pink-100 rounded-full blur-3xl opacity-50 -z-10" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-yellow-100 rounded-full blur-3xl opacity-50 -z-10" />

        {/* Floating Ingredients */}
        <div className="absolute top-20 left-20 text-slate-300 animate-float opacity-40">
          <Wheat className="w-12 h-12" />
        </div>
        <div className="absolute top-40 right-20 text-slate-300 animate-float-delayed opacity-40">
          <Egg className="w-10 h-10" />
        </div>
        <div className="absolute bottom-32 left-32 text-slate-300 animate-float-slow opacity-40">
          <Milk className="w-12 h-12" />
        </div>
        <div className="absolute bottom-20 right-40 text-slate-300 animate-float opacity-40">
          <Cookie className="w-10 h-10" />
        </div>
        <div className="absolute top-1/3 right-1/4 text-slate-200 animate-float-slow opacity-30 -z-10">
          <Croissant className="w-16 h-16" />
        </div>
        <div className="absolute bottom-1/3 left-1/4 text-slate-200 animate-float-delayed opacity-30 -z-10">
          <Cake className="w-14 h-14" />
        </div>

        {/* Additional Icons */}
        <div className="absolute top-10 left-1/2 text-slate-200 animate-float-slow opacity-30">
          <Utensils className="w-8 h-8" />
        </div>
        <div className="absolute bottom-10 left-10 text-slate-300 animate-float-delayed opacity-40">
          <IceCream className="w-12 h-12" />
        </div>
        <div className="absolute top-1/2 right-10 text-slate-200 animate-float opacity-30">
          <Candy className="w-10 h-10" />
        </div>
        <div className="absolute top-32 left-1/3 text-slate-200 animate-float-delayed opacity-20">
          <PartyPopper className="w-14 h-14" />
        </div>
        <div className="absolute bottom-1/4 right-1/3 text-slate-200 animate-float-slow opacity-25">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="max-w-4xl mx-auto space-y-8 z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">

          <h1 className="text-6xl md:text-8xl font-serif text-slate-800 leading-tight">
            Baking Sweet <br />
            <span className="text-[#B03050] italic font-['Great_Vibes'] pr-4">Memories</span>
          </h1>

          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Handcrafted with love and the finest ingredients. Experience the joy of premium baking for your special moments.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/order" className="group relative px-8 py-4 bg-[#B03050] text-white rounded-full font-bold text-lg shadow-xl shadow-pink-200 hover:bg-[#902040] hover:scale-105 transition-all overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                <ChefHat className="w-6 h-6" />
                Place Order <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </Link>

            <a href="/public-gallery" className="px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all">
              View Gallery
            </a>
          </div>
        </div>
      </main>

      {/* Gallery Section */}
      <GallerySection />

      {/* Footer */}
      <footer className="p-6 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Bakes & More. All rights reserved.</p>
      </footer>
    </div>
  );
}
