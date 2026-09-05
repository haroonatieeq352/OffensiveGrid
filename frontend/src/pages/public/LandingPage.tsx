import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Flag,
  Trophy,
  Zap,
  Terminal,
  Lock,
  ArrowRight,
  CheckCircle,
  Globe,
  Wifi,
  Cpu,
  Key,
  Search,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import { DeveloperProfileModal } from '../../components/common/DeveloperProfileModal';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const domainCategories = [
    { title: 'Web Exploitation', icon: Globe, count: '12 Scenarios', desc: 'SQLi, XSS, SSRF, JWT & Authentication Bypasses', color: 'from-blue-500/10 to-indigo-500/10 text-indigo-600' },
    { title: 'Network Forensics', icon: Wifi, count: '8 Scenarios', desc: 'Packet PCAP analysis, exfiltration & protocol carving', color: 'from-cyan-500/10 to-teal-500/10 text-cyan-600' },
    { title: 'Cryptography', icon: Key, count: '10 Scenarios', desc: 'Classical ciphers, RSA weaknesses & hash cracking', color: 'from-amber-500/10 to-orange-500/10 text-amber-600' },
    { title: 'Binary Exploitation', icon: Terminal, count: '6 Scenarios', desc: 'Memory corruption, buffer overflows & shellcoding', color: 'from-rose-500/10 to-pink-500/10 text-rose-600' },
    { title: 'OSINT & Recon', icon: Search, count: '9 Scenarios', desc: 'Threat intelligence, leak analysis & public foot-printing', color: 'from-emerald-500/10 to-green-500/10 text-emerald-600' },
    { title: 'Reverse Engineering', icon: Cpu, count: '7 Scenarios', desc: 'Static analysis, decompilation & keygen crackmes', color: 'from-purple-500/10 to-violet-500/10 text-purple-600' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#DFE5EC] cyber-grid-bg">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 shadow-xs animate-fade-in">
          <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>OffensiveGrid v2.0 — Live Capture The Flag Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none mb-6">
          Elite Cyber Defense & <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-400 to-cyan-400">CTF Training Labs</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Access realistic vulnerable sandbox targets, analyze network dossiers, extract secret flags, and dominate real-time tournament leaderboards.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <Link to={isAuthenticated ? "/scenarios" : "/register"} className="w-full sm:w-auto">
            <Button size="lg" variant="primary" className="w-full sm:w-auto text-base shadow-md shadow-indigo-500/20" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {isAuthenticated ? "Solve CTF Scenarios" : "Start Training Free"}
            </Button>
          </Link>
          <Link to="/leaderboard" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto text-base bg-white dark:bg-slate-900 dark:text-white dark:border-slate-700"
              leftIcon={<Trophy className="w-4 h-4 text-amber-500" />}
            >
              Live Tournament
            </Button>
          </Link>
        </div>

        {/* Live Platform Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { label: 'Tactical Scenarios', value: '50+', icon: Flag },
            { label: 'Active Tournament', value: 'LIVE NOW', icon: Trophy, badge: true },
            { label: 'Trainees Enrolled', value: '1,200+', icon: Shield },
            { label: 'Flag Submissions', value: '18.4K', icon: Zap },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="card-saas p-4 text-left">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  {stat.badge && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{stat.value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
            Multi-Disciplinary Security Scenarios
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Engineered for cyber defense teams, ethical hackers, and CTF tournament competitors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domainCategories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Card key={i} className="card-saas hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="info">{cat.count}</Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{cat.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{cat.desc}</p>
                  <Link to="/scenarios" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1">
                    Explore Challenges <ArrowRight className="w-3 h-3" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Zero Trust Lab Separation Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-slate-900 rounded-2xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-800">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-500/20 text-cyan-400 text-xs font-semibold mb-4">
              <Lock className="w-3.5 h-3.5" />
              Isolated Lab Architecture
            </div>
            <h3 className="text-2xl font-bold tracking-tight mb-3">
              Intentionally Vulnerable. Strictly Isolated.
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every scenario runs inside an isolated sandbox perimeter detached from the core platform database. Train aggressively without security compromises.
            </p>
          </div>
          <Link to={isAuthenticated ? "/scenarios" : "/register"}>
            <Button size="lg" variant="cyber" className="whitespace-nowrap">
              {isAuthenticated ? "Solve CTF Scenarios" : "Create Trainee Account"}
            </Button>
          </Link>
        </div>
      </section>

      {/* Enterprise Platform Architecture & Core Pillars */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-mono uppercase tracking-wider mb-3">
            System Specifications & Architecture
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Engineered for Modern Offensive Operations
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Discover the foundational pillars that make OffensiveGrid the leading reference architecture for cybersecurity labs, academic research, and enterprise penetration testing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {/* Card 1: Purpose & Importance */}
          <div className="card-saas p-6 border-t-4 border-t-indigo-500">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Platform Purpose & Importance</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Bridges the gap between theory and live combat. Provides trainees with authentic, live targets rather than static quizzes, building true tactile penetration testing skills.
            </p>
          </div>

          {/* Card 2: Strategic Impact */}
          <div className="card-saas p-6 border-t-4 border-t-purple-500">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Real-World Strategic Impact</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Enables enterprises to audit candidate skillsets, empowers university students with an award-winning FYP capstone model, and trains red/blue teams against OWASP vectors.
            </p>
          </div>

          {/* Card 3: Architecture & Workflow */}
          <div className="card-saas p-6 border-t-4 border-t-cyan-500">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Architecture & Real-Time Telemetry</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Decoupled React 18 frontend with Django REST Framework backend, ASGI WebSocket Channels broadcasting sub-second live tournament rankings and solves.
            </p>
          </div>

          {/* Card 4: Scoring Engine */}
          <div className="card-saas p-6 border-t-4 border-t-amber-500">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Scoring Engine & Attempt Quotas</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Strict database row-level locking ensures attempt limits are respected. Eliminates automated brute-force fuzzing with precision tie-breakers based on solve timestamps.
            </p>
          </div>

          {/* Card 5: Security Guardrails */}
          <div className="card-saas p-6 border-t-4 border-t-rose-500">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Security Guardrails & Anti-Cheat</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              TOTP Google Authenticator 2FA, zero flag exposure in API payloads, rate-limiting, and sanitized scenario executions protecting environment integrity.
            </p>
          </div>

          {/* Card 6: Hardware Activation Gate */}
          <div className="card-saas p-6 border-t-4 border-t-emerald-500">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Hardware Authorization Gate</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              HMAC-SHA256 machine-bound licensing gate. Keeps the repository discoverable on GitHub while requiring official author approval to operate the platform runtime.
            </p>
          </div>
        </div>

        {/* Founder & Lead Developer Showcase Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              {/* Haroon Atieeq Official Portrait */}
              <div 
                onClick={() => setIsProfileOpen(true)}
                className="relative group shrink-0 cursor-pointer"
                title="Click to view full profile & achievements"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-indigo-400/60 shadow-xl shadow-indigo-500/25 bg-slate-800 transition-all duration-300 group-hover:scale-105 group-hover:border-indigo-400">
                  <img 
                    src="/haroon-atieeq.jpg" 
                    alt="Haroon Atieeq — Junior Penetration Tester" 
                    className="w-full h-full object-cover object-top" 
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                    Founder & Lead Developer
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                    CEH & CCNA Certified
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                  <span>Haroon Atieeq</span>
                  <span className="text-xs font-mono font-normal text-slate-400">(@haroonatieeq352)</span>
                </h3>

                <p className="text-xs sm:text-sm text-indigo-300 font-mono font-medium">
                  Junior Penetration Tester at CSZone Pvt. Ltd  |  VAPT & Application Security
                </p>

                <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                  Offensive Security Engineer and Full-Stack Systems Architect. Selected for a Microsoft-sponsored CVE research study, author of 94-page Enterprise VAPT Playbook, and IEEE-published Best FYP CyberMaze recipient.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" /> cszone.pk
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" /> OWASP WSTG / PTES / NIST
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" /> React & Django 5 Core
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto shrink-0">
              <Button 
                size="md" 
                variant="primary" 
                onClick={() => setIsProfileOpen(true)}
                className="w-full justify-center shadow-lg shadow-indigo-500/25 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              >
                View Full Profile & CV
              </Button>
              <a 
                href="https://www.linkedin.com/in/haroon-atieeque-2b8867378" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button size="md" variant="outline" className="w-full justify-center bg-blue-900/20 border-blue-500/40 text-blue-300 hover:bg-blue-900/40">
                  Connect on LinkedIn
                </Button>
              </a>
              <a 
                href="https://github.com/haroonatieeq352/OffensiveGrid" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button size="md" variant="outline" className="w-full justify-center bg-slate-900/60 border-slate-700 text-white hover:bg-slate-800">
                  Explore GitHub Repo
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Profile Modal */}
      <DeveloperProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />

      <Footer />
    </div>
  );
};
