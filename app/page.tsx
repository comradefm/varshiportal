"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  BookOpen,
  Users,
  Video,
  FileText,
  ChevronRight,
  MapPin,
  Star,
  CheckCircle2,
  Menu,
  X,
  PlayCircle,
  GraduationCap,
  Award,
  Download,
  Smartphone,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Quote
} from "lucide-react";

export default function Home() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // We no longer automatically redirect so the public can see this page.
  // However, we do change the "Login" button text based on auth state.

  const navLinks = [
    { name: "Batches", href: "#" },
    { name: "Vidyapeeth", href: "#" },
    { name: "Results", href: "#" },
    { name: "Study Material", href: "#" },
    { name: "About Us", href: "#" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-indigo-500 selection:text-white">
      
      {/* 1. NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">Study<span className="text-indigo-600">Portal</span></span>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.href} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
                  {link.name}
                </Link>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden md:flex items-center">
              {loading ? (
                <div className="w-24 h-9 bg-slate-200 animate-pulse rounded-full" />
              ) : user ? (
                <Link 
                  href={userData?.username ? "/dashboard" : "/setup"}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition shadow-md shadow-indigo-200"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link 
                  href="/login"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition shadow-md shadow-indigo-200"
                >
                  Login / Register
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-600 hover:text-slate-900"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="block text-sm font-medium text-slate-600 hover:text-indigo-600">
                {link.name}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-100">
              <Link 
                href={user ? (userData?.username ? "/dashboard" : "/setup") : "/login"}
                className="block text-center w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                {user ? "Dashboard" : "Login / Register"}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative w-full bg-[#0a1930] pt-20 pb-24 overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] rounded-full bg-indigo-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm shadow-sm mb-8">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-emerald-100 tracking-wide uppercase">New NEET Batches Available</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 max-w-4xl leading-tight">
            India's most <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Trusted</span> & Affordable <br className="hidden md:block" /> Educational Platform
          </h1>
          
          <p className="text-lg text-slate-300 mb-10 max-w-2xl leading-relaxed">
            Unlock your true potential with structured courses, top-tier faculty, and a community of millions. Your journey to academic excellence starts here.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link 
              href="/login"
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-base transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              Start Learning Now <ChevronRight className="w-5 h-5" />
            </Link>
            <button className="px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-full font-semibold text-base transition flex items-center gap-2 backdrop-blur-sm">
              <PlayCircle className="w-5 h-5 text-indigo-400" /> Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* 3. KEY STATS ROW */}
      <section className="relative z-20 -mt-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-8 flex flex-wrap justify-between gap-6">
          <div className="flex flex-col items-center flex-1 min-w-[120px]">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-3">
              <Video className="w-6 h-6" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900">50k+</h4>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider text-center pt-1">Video Lectures</p>
          </div>
          <div className="hidden md:block w-px bg-slate-100" />
          <div className="flex flex-col items-center flex-1 min-w-[120px]">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900">14k+</h4>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider text-center pt-1">Mock Tests</p>
          </div>
          <div className="hidden md:block w-px bg-slate-100" />
          <div className="flex flex-col items-center flex-1 min-w-[120px]">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900">10k+</h4>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider text-center pt-1">PDF Notes</p>
          </div>
          <div className="hidden md:block w-px bg-slate-100" />
          <div className="flex flex-col items-center flex-1 min-w-[120px]">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-3">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900">24k+</h4>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider text-center pt-1">Selections</p>
          </div>
        </div>
      </section>

      {/* 4. EXAM CATEGORIES */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Exam Categories</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">Find your path to success. We offer expertly structured courses carefully designed to crack India's toughest examinations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="group relative bg-white border border-slate-200 hover:border-indigo-300 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-rose-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10 w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="relative z-10 text-xl font-bold text-slate-900 mb-2">NEET UG</h3>
            <p className="relative z-10 text-sm text-slate-500 mb-6">Physical, Organic, Inorganic Chemistry, Physics, and Biology.</p>
            <div className="relative z-10 flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
              Explore Batches <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-white border border-slate-200 hover:border-indigo-300 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-amber-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10 w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="relative z-10 text-xl font-bold text-slate-900 mb-2">IIT JEE</h3>
            <p className="relative z-10 text-sm text-slate-500 mb-6">Mains and Advanced preparation with full structured syllabus.</p>
            <div className="relative z-10 flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
              Explore Batches <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-white border border-slate-200 hover:border-indigo-300 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-emerald-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10 w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="relative z-10 text-xl font-bold text-slate-900 mb-2">Class 12 Boards</h3>
            <p className="relative z-10 text-sm text-slate-500 mb-6">Secure your fundamentals with our foundational board courses.</p>
            <div className="relative z-10 flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
              Explore Batches <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="group relative bg-white border border-slate-200 hover:border-indigo-300 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-cyan-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10 w-12 h-12 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center mb-6">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="relative z-10 text-xl font-bold text-slate-900 mb-2">CUET | NDA</h3>
            <p className="relative z-10 text-sm text-slate-500 mb-6">Get into central universities and defensive academies with ease.</p>
            <div className="relative z-10 flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
              Explore Batches <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
        
        <div className="mt-10 text-center">
          <button className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline underline-offset-4">
            View all categories
          </button>
        </div>
      </section>

      {/* 5. OFFLINE CENTERS (VIDYAPEETH) */}
      <section className="relative py-24 bg-slate-900 overflow-hidden">
        {/* Mock background image texture */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-slate-900 to-black mix-blend-overlay" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore Tech-Enabled Offline Vidyapeeth</h2>
          <p className="text-slate-400 mb-10">Real-world classrooms providing the same trusted curriculum alongside instant doubt solving via the StudyPortal app.</p>
          
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/10">
            <p className="text-sm font-semibold text-slate-300 mb-6 uppercase tracking-wider">Find a center near you</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer">
                <MapPin className="w-5 h-5 text-rose-400" />
                <span className="font-semibold">Delhi</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer">
                <MapPin className="w-5 h-5 text-amber-400" />
                <span className="font-semibold">Kota</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold">Patna</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <span className="font-semibold">Pune</span>
              </div>
            </div>
            <button className="mt-8 bg-white text-slate-900 hover:bg-slate-100 px-8 py-3 rounded-full font-bold text-sm transition">
              Explore All Centers
            </button>
          </div>
        </div>
      </section>

      {/* 6. TRUSTED STATS / ACADEMIC EXCELLENCE */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">A Platform Trusted by Students</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">We measure our success by the success of our students. See why millions choose StudyPortal every year.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <div className="bg-gradient-to-br from-orange-50 to-rose-50 p-8 rounded-3xl text-center border border-rose-100">
            <h3 className="text-3xl font-extrabold text-rose-600 mb-2">1.3 Million+</h3>
            <p className="text-sm font-semibold text-slate-700">Happy Students</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-3xl text-center border border-indigo-100">
            <h3 className="text-3xl font-extrabold text-indigo-600 mb-2">24000+</h3>
            <p className="text-sm font-semibold text-slate-700">Selections</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-3xl text-center border border-emerald-100">
            <h3 className="text-3xl font-extrabold text-emerald-600 mb-2">14000+</h3>
            <p className="text-sm font-semibold text-slate-700">Mock Tests Taken</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl text-center border border-purple-100">
            <h3 className="text-3xl font-extrabold text-purple-600 mb-2">50000+</h3>
            <p className="text-sm font-semibold text-slate-700">Video Lectures</p>
          </div>
        </div>

        {/* RESULTS TOPPER WALL */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Academic Excellence & Results</h2>
          <p className="text-slate-500">Unstoppable minds driving spectacular results in 2023.</p>
        </div>

        <div className="w-full bg-[#1b263b] rounded-3xl overflow-hidden relative shadow-2xl">
          {/* Mock Topper Banner */}
          <div className="px-6 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between text-white border-b border-white/10">
             <div className="mb-8 md:mb-0 md:w-1/2 text-center md:text-left md:pl-10">
                <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-500/30">Congratulations</div>
                <h3 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">Our Wall of UPSC, JEE & NEET Toppers</h3>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-md mx-auto md:mx-0">Consistent dedication and our precise curriculum forged top rankers this year. Join them on the wall of fame.</p>
             </div>
             <div className="w-full md:w-1/2 flex items-center justify-center p-4">
                <div className="grid grid-cols-3 gap-4">
                   {/* Dummy Topper Profiles */}
                   {[1, 14, 56, 89, 102, 215].map((rank, i) => (
                      <div key={i} className="flex flex-col items-center">
                         <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-700 border-2 border-indigo-400 flex items-center justify-center mb-2 shadow-lg relative overflow-hidden">
                           <Users className="w-8 h-8 text-slate-500 opacity-50" />
                           <div className="absolute bottom-0 w-full bg-indigo-500/80 text-[9px] font-bold text-center py-0.5 backdrop-blur-sm">AIR {rank}</div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
          <div className="bg-indigo-600 w-full text-center py-3">
             <span className="font-bold text-white tracking-widest uppercase text-xs md:text-sm shadow-sm">2024 Selections Ongoing</span>
          </div>
        </div>
      </section>

      {/* 7. APP DOWNLOAD CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-24">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[3rem] p-8 md:p-14 border border-indigo-100 flex flex-col md:flex-row items-center justify-between shadow-xl shadow-indigo-100/50">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
              Join <span className="text-indigo-600">15 Million+</span> students on the app today
            </h2>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" /> Watch Live & Recorded Classes
              </li>
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" /> Download PDF Notes & DPPs offline
              </li>
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" /> Private Study Partner Messaging
              </li>
            </ul>
            <div className="flex gap-4">
              <button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-3 flex items-center gap-3 transition">
                <Download className="w-6 h-6" />
                <div className="text-left">
                  <p className="text-[10px] leading-tight text-slate-300">GET IT ON</p>
                  <p className="text-sm font-bold leading-tight">Google Play</p>
                </div>
              </button>
              <button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-3 flex items-center gap-3 transition">
                <Smartphone className="w-6 h-6" />
                <div className="text-left">
                  <p className="text-[10px] leading-tight text-slate-300">Download on the</p>
                  <p className="text-sm font-bold leading-tight">App Store</p>
                </div>
              </button>
            </div>
          </div>
          {/* Mock Phone Frame */}
          <div className="md:w-1/3 flex justify-center">
             <div className="w-64 h-[400px] bg-slate-900 rounded-[2.5rem] border-[8px] border-slate-900 shadow-2xl relative overflow-hidden flex flex-col">
               <div className="absolute top-0 w-full h-6 bg-slate-900 z-20 flex justify-center rounded-t-3xl"><div className="w-20 h-4 bg-black rounded-b-xl"></div></div>
               <div className="flex-1 bg-slate-50 mt-4 rounded-3xl p-4 overflow-hidden relative">
                  <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center opacity-50">
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-widest text-center px-4">Modern Mobile UI Inside</span>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIALS */}
      <section className="bg-white py-24 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">What Our <span className="text-rose-500">Toppers</span> Say</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Real experiences from students who transformed their preparations with our highly dedicated platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Aditi S.", target: "NEET UG", text: "The dedicated Organic Chemistry nodes and daily assignments literally pushed my score from 450 to 680+. The private partner study system kept me strictly accountable!" },
              { name: "Rahul M.", target: "JEE Advanced", text: "I couldn't afford massive physical coaching fees. The structured batches here provided me with the absolute exact, if not better, quality of education." },
              { name: "Priya K.", target: "Class 12 Boards", text: "Loved the instant access to DPPs and mock tests. It felt like playing a game where tracking progress motivated me every single day. Secured 95% easily." }
            ].map((testi, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-3xl p-8 relative">
                <Quote className="absolute top-6 right-6 w-8 h-8 text-indigo-200" />
                <div className="flex gap-1 text-amber-400 mb-6">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <p className="text-slate-700 mb-8 leading-relaxed">"{testi.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex justify-center items-center font-bold text-slate-400">{testi.name.charAt(0)}</div>
                  <div>
                    <p className="font-bold text-slate-900">{testi.name}</p>
                    <p className="text-xs text-indigo-600 font-semibold">{testi.target}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. STUDY RESOURCES */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Study Resources</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">Access our highly curated, open-source vault of materials covering every fundamental and advanced topic.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
           <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 flex flex-col items-center text-center cursor-pointer hover:-translate-y-2 transition-transform duration-300">
             <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
               <BookOpen className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-3">Previous Year Papers</h3>
             <p className="text-sm text-slate-600">Solve actual exam papers from the last 15 years to identify exact testing patterns.</p>
           </div>
           <div className="bg-amber-50 rounded-3xl p-8 border border-amber-100 flex flex-col items-center text-center cursor-pointer hover:-translate-y-2 transition-transform duration-300">
             <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
               <FileText className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-3">Daily Practice Problems</h3>
             <p className="text-sm text-slate-600">Sharpen your concepts daily with highly targeted, micro-learning assignments.</p>
           </div>
           <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100 flex flex-col items-center text-center cursor-pointer hover:-translate-y-2 transition-transform duration-300">
             <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
               <Award className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-3">NCERT Solutions</h3>
             <p className="text-sm text-slate-600">Line-by-line detailed solutions and analyses for critical NCERT textbook problems.</p>
           </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-[#0a0f1d] pt-20 pb-10 border-t border-[#1a1a2e] text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight text-white">Study<span className="text-indigo-500">Portal</span></span>
              </div>
              <p className="mb-6 max-w-sm">We provide an incredible learning experience mapping the gap between top-tier education and absolute affordability. Crack any exam with us.</p>
              
              <div className="flex items-center gap-4 mb-6">
                <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white font-semibold transition flex items-center gap-2">
                  <Download className="w-4 h-4" /> Android App
                </button>
              </div>

              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition"><Facebook className="w-4 h-4" /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition"><Twitter className="w-4 h-4" /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition"><Instagram className="w-4 h-4" /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition"><Youtube className="w-4 h-4" /></a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-indigo-400 transition">About Us</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Careers</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Terms & Conditions</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide">Popular Exams</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-indigo-400 transition">IIT JEE</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">NEET UG</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Class 12 Boards</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">CUET</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">NDA</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide">Study Material</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-indigo-400 transition">NCERT Solutions</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Previous Year Papers</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Reference Books</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Formula Sheets</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Video Lectures</a></li>
              </ul>
            </div>

          </div>

          <div className="border-t border-[#1a1a2e] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold tracking-wide">
            <p>&copy; {new Date().getFullYear()} StudyPortal Technologies. All Rights Reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
