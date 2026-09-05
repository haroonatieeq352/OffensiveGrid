import React from 'react';
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

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

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

      <Footer />
    </div>
  );
};
