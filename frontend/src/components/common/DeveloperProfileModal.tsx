import React, { useState } from 'react';
import {
  X,
  Shield,
  Award,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  FileText,
  Terminal,
  Code2,
  Globe,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface DeveloperProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperProfileModal: React.FC<DeveloperProfileModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'experience' | 'projects' | 'skills' | 'certifications'>('summary');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-indigo-500/30 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col text-white relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header: Profile Hero */}
        <div className="relative z-10 p-5 sm:p-8 bg-slate-900/90 border-b border-slate-800/80 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Portrait with Glowing Cyber Frame */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-indigo-400/50 shadow-xl shadow-indigo-500/20 bg-slate-800">
                <img 
                  src="/haroon-atieeq.jpg" 
                  alt="Haroon Atieeq" 
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105" 
                />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            </div>

            {/* Profile Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                  Haroon Atieeq
                </h2>
                <Badge variant="success" className="text-[10px] uppercase font-mono tracking-wider">
                  VAPT Specialist
                </Badge>
              </div>

              <p className="text-sm font-semibold text-indigo-400 font-mono">
                Junior Penetration Tester  |  VAPT & Application Security
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" /> Bahawalpur, Punjab, Pakistan
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" /> CSZone Pvt. Limited
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" /> BS Cyber Security
                </span>
              </div>

              {/* Action Links */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
                <a
                  href="https://www.linkedin.com/in/haroon-atieeque-2b8867378"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5 text-blue-400" /> LinkedIn
                </a>
                <a
                  href="https://github.com/haroonatieeq352"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Github className="w-3.5 h-3.5 text-indigo-400" /> GitHub
                </a>
                <a
                  href="mailto:haroonatieeq6@gmail.com"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-400" /> Contact Email
                </a>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            aria-label="Close Profile Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="relative z-10 px-5 sm:px-8 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none py-2">
          {[
            { id: 'summary', label: 'Summary & Methodologies', icon: FileText },
            { id: 'experience', label: 'Work Experience', icon: Briefcase },
            { id: 'projects', label: 'Key Projects', icon: Layers },
            { id: 'skills', label: 'Technical Skills', icon: Terminal },
            { id: 'certifications', label: 'Certifications & Honors', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="relative z-10 p-5 sm:p-8 overflow-y-auto space-y-6 text-slate-300 text-sm leading-relaxed">
          {/* TAB 1: SUMMARY & FRAMEWORKS */}
          {activeTab === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Professional Summary
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  Junior Penetration Tester at <strong>CSZone Pvt. Limited</strong>, conducting comprehensive Vulnerability Assessment and Penetration Testing (VAPT) engagements for international clients. Testing workflows follow rigorous <strong>OWASP WSTG, PTES, and NIST SP 800-115</strong> methodologies, with risk findings mapped to <strong>OWASP Top 10, ISO 27001, NIST SP 800-53, and GDPR</strong>.
                </p>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  Holds a <strong>BS in Cyber Security and Digital Forensics</strong> from The Islamia University of Bahawalpur and is <strong>CEH certified</strong>. Selected for a prestigious <strong>Microsoft-sponsored threat intelligence research study</strong> on Upwork/Lifted focused on CVE analysis. Also operates as an independent VAPT consultant delivering API and web application security assessments.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Enterprise VAPT Standards & Methodologies
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="card-saas p-4 text-left">
                    <div className="font-bold text-white text-xs mb-1">Testing Standards</div>
                    <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                      <li>OWASP Web Security Testing Guide (WSTG)</li>
                      <li>Penetration Testing Execution Standard (PTES)</li>
                      <li>NIST SP 800-115 (Technical Guide)</li>
                    </ul>
                  </div>

                  <div className="card-saas p-4 text-left">
                    <div className="font-bold text-white text-xs mb-1">Compliance & Risk Mapping</div>
                    <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                      <li>OWASP Top 10 (Web & API)</li>
                      <li>ISO/IEC 27001 Security Controls</li>
                      <li>NIST SP 800-53 & GDPR Impact Analysis</li>
                    </ul>
                  </div>

                  <div className="card-saas p-4 text-left">
                    <div className="font-bold text-white text-xs mb-1">Scoring & Threat Mapping</div>
                    <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                      <li>CVSS 3.1 Severity Scoring</li>
                      <li>MITRE ATT&CK Framework Mapping</li>
                    </ul>
                  </div>

                  <div className="card-saas p-4 text-left">
                    <div className="font-bold text-white text-xs mb-1">Reporting Pipelines</div>
                    <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                      <li>Automated Python (ReportLab) pipelines</li>
                      <li>Node.js docx client deliverables</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFESSIONAL EXPERIENCE */}
          {activeTab === 'experience' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {[
                {
                  role: 'Junior Penetration Tester',
                  company: 'CSZone Pvt. Limited',
                  date: 'Current',
                  badge: 'Active Role',
                  badgeColor: 'success',
                  bullets: [
                    'Conducting VAPT engagements for international clients across web applications, REST APIs, and authentication flows.',
                    'Applying OWASP WSTG, PTES, and NIST SP 800-115 methodology across the entire testing lifecycle.',
                    'Mapping technical vulnerabilities to business risks, OWASP Top 10, ISO 27001, and NIST SP 800-53 compliance standards.',
                  ],
                },
                {
                  role: 'Offensive Security Intern',
                  company: 'ITSolera',
                  date: 'Internship',
                  bullets: [
                    'Conducted hands-on offensive security testing, attack surface mapping, and vulnerability analysis.',
                    'Executed black-box and grey-box security assessments on multi-tenant applications.',
                  ],
                },
                {
                  role: 'Cybersecurity Instructor',
                  company: 'Tech Hub NAVTAC',
                  date: 'Instructor',
                  bullets: [
                    'Delivered practical cybersecurity training and ethical hacking curriculum to emerging cybersecurity trainees.',
                    'Mentored students on lab setup, networking fundamentals, and defensive configurations.',
                  ],
                },
                {
                  role: 'Technical Support Specialist',
                  company: 'Sybrid',
                  date: 'Support Eng.',
                  bullets: [
                    'Provided mission-critical technical support in an enterprise production environment, diagnosing network and system anomalies.',
                  ],
                },
                {
                  role: 'Django Backend Developer',
                  company: 'Skill Evokers',
                  date: 'Developer',
                  bullets: [
                    'Engineered backend services and RESTful APIs using Python and Django, establishing solid software engineering foundations.',
                  ],
                },
              ].map((exp, idx) => (
                <div key={idx} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 sm:p-5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h4 className="text-sm font-bold text-white">{exp.role}</h4>
                      <div className="text-xs font-semibold text-indigo-400 font-mono">{exp.company}</div>
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-700/50 self-start sm:self-auto">
                      {exp.date}
                    </span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside pt-1">
                    {exp.bullets.map((b, bi) => (
                      <li key={bi}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: KEY PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {[
                {
                  title: 'OffensiveGrid (CS ZONE CyberGrid)',
                  category: 'Enterprise CTF & Cyber Range Platform',
                  tag: 'Flagship Project',
                  tagColor: 'primary',
                  desc: 'Enterprise-grade cybersecurity training and competition platform for institutes and corporate red/blue teams. Engineered with React 18, Vite, Django 5, DRF, Django Channels WebSocket real-time leaderboard, and zero-trust Hardware Activation Gate.',
                },
                {
                  title: 'Microsoft-Sponsored Threat Intelligence Research',
                  category: 'Threat Intelligence / CVE Analysis (Upwork / Lifted)',
                  tag: 'Microsoft Sponsored',
                  tagColor: 'warning',
                  desc: 'Selected for a specialized Microsoft-sponsored research study evaluating Threat Intelligence Analyst workflows, completing structured tasks in CVE analysis and vulnerability time-estimation reporting.',
                },
                {
                  title: 'Enterprise Client VAPT Engagements',
                  category: 'Freelance Security Audits (ranbval.com, basal.is)',
                  tag: 'CVSS 9.8 Critical Finding',
                  tagColor: 'danger',
                  desc: 'Delivered full VAPT assessments. On ranbval.com, identified 39 findings including a CVSS 9.8 Critical vulnerability (exposed administrative portal via hardcoded JS hash & default credentials). Built automated ReportLab/Python & docx reporting pipelines for basal.is.',
                },
                {
                  title: 'CSZone CTF Training Range',
                  category: 'Vulnerable Lab Platform',
                  tag: '18/18 Verified',
                  tagColor: 'info',
                  desc: 'Built authentic vulnerable application introducing realistic SQLi, stored XSS, CSRF, file upload flaws, SSRF, IDOR, and web cache deception backed by an automated 18/18 verification test suite.',
                },
                {
                  title: 'Enterprise VAPT Playbook',
                  category: 'Security Reference Guide',
                  tag: '94 Pages / 36 Tools',
                  tagColor: 'success',
                  desc: 'Authored a comprehensive 94-page penetration testing playbook covering 36 industry tools across reconnaissance, injection, access control, and cloud testing. Passed 161 of 161 internal validation checks.',
                },
                {
                  title: 'CyberMaze',
                  category: 'Final Year Project (BS Cyber Security)',
                  tag: 'Best FYP Award & IEEE Published',
                  tagColor: 'purple',
                  desc: 'Awarded Best Final Year Project (FYP) and officially published in IEEE, showcasing novel methodologies in cybersecurity gamification and threat vector analysis.',
                },
              ].map((proj, pi) => (
                <div key={pi} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 sm:p-5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{proj.title}</span>
                    </h4>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 self-start sm:self-auto">
                      {proj.tag}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-cyan-400">{proj.category}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{proj.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: TECHNICAL SKILLS */}
          {activeTab === 'skills' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" /> Vulnerability Classes Mastered
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    <li>SQL Injection: Boolean, Error, Time-based blind (with Python automation)</li>
                    <li>Cross-Site Scripting: DOM, Reflected, Stored (WAF bypass & cookie theft)</li>
                    <li>Insecure Direct Object References (IDOR) & Broken Access Control</li>
                    <li>Server-Side Request Forgery (SSRF) & CSRF attacks</li>
                    <li>Insecure File Upload & Remote Code Execution vectors</li>
                    <li>Web Cache Deception & Cache Poisoning</li>
                  </ul>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Tools & Testing Environment
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    <li>Burp Suite Professional (advanced manual workflows & repeater)</li>
                    <li>Kali Linux, Wazuh SIEM, Hydra, Nmap, Metasploit</li>
                    <li>OWASP ZAP, SQLmap, Nikto, Gobuster, Amass</li>
                    <li>Home Lab for Detection Engineering & brute-force simulations</li>
                  </ul>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-amber-400" /> Application Frameworks Audited
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    <li>Django & Django REST Framework (Python)</li>
                    <li>React 18, Vite & TypeScript</li>
                    <li>Node.js & Express APIs</li>
                    <li>Laravel & PHP applications</li>
                    <li>PostgreSQL, SQLite, Supabase databases</li>
                  </ul>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" /> Automation & Reporting
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    <li>Python (ReportLab) automated audit report generators</li>
                    <li>Node.js (docx) client deliverable pipelines</li>
                    <li>Cloud security review & API security assessments</li>
                    <li>Zero-Trust Hardware Licensing and cryptographic validation</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CERTIFICATIONS & HONORS */}
          {activeTab === 'certifications' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" /> Key Honors & Recognitions
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>CyberMaze — Best Final Year Project (FYP) Award:</strong> Awarded 1st place and officially published in IEEE for cybersecurity innovation.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>CVSS 9.8 Critical Finding:</strong> Identified exposed administrative portal in client engagement (ranbval.com).</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Microsoft-Sponsored Research:</strong> Selected for threat intelligence analysis study on Upwork/Lifted.</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Professional Certifications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'Certified Ethical Hacker (CEH)', issuer: 'EC-Council', icon: Shield },
                    { name: 'Cisco Certified Network Associate (CCNA)', issuer: 'Cisco Systems', icon: Terminal },
                    { name: 'Critical Infrastructure Protection (ICIP)', issuer: 'OPSWAT Academy', icon: Layers },
                    { name: 'TATA Cyber Security Analyst', issuer: 'TATA / Forage', icon: Briefcase },
                    { name: 'Linux for Hackers', issuer: 'Cybersecurity Lab', icon: Code2 },
                  ].map((cert, ci) => {
                    const Icon = cert.icon;
                    return (
                      <div key={ci} className="card-saas p-3.5 flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{cert.name}</div>
                          <div className="text-[10px] text-slate-400">{cert.issuer}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-xs space-y-1">
                <div className="font-bold text-white">BS, Cyber Security and Digital Forensics</div>
                <div className="text-indigo-400 font-mono">The Islamia University of Bahawalpur</div>
                <p className="text-slate-400 text-[11px] pt-1">
                  Comprehensive curriculum in network security, digital forensics, reverse engineering, cryptographic systems, and defensive operations.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 p-4 sm:p-5 bg-slate-950 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-indigo-400">haroonatieeq6@gmail.com</span>
            <span>•</span>
            <span>Official Domain: <a href="https://cszone.pk" className="text-slate-300 underline hover:text-white">cszone.pk</a></span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://www.linkedin.com/in/haroon-atieeque-2b8867378"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline" className="bg-blue-600/10 border-blue-500/30 text-blue-300 hover:bg-blue-600/20">
                <Linkedin className="w-3.5 h-3.5 mr-1" /> Connect on LinkedIn
              </Button>
            </a>
            <Button size="sm" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
