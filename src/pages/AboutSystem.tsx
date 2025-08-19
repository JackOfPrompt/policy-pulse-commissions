import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Users, FileText, Calculator, Database, BarChart3, Brain, Shield, Building, UserCheck, CreditCard, Star, Layers, Network, Settings, TrendingUp, Zap, Globe, Lock, ChevronDown, ArrowRight } from "lucide-react";
const AboutSystem = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Main Platform Architecture
  const platformArchitecture = {
    core: {
      id: "core-platform",
      title: "CRESTLINE Core Platform",
      icon: Star,
      position: {
        x: 400,
        y: 100
      },
      color: "from-secondary via-primary to-accent",
      description: "Enterprise Insurance CRM Platform",
      features: undefined
    },
    masterData: {
      id: "master-data",
      title: "Master Data Layer",
      icon: Database,
      position: {
        x: 200,
        y: 250
      },
      color: "from-blue-500 to-blue-600",
      description: undefined,
      features: ["Insurance Providers Registry", "Product Catalog Management", "Geographic Data (Pincodes/Cities)", "Business Categories & Classifications", "Health Conditions Database", "Regulatory Compliance Data"]
    },
    businessLogic: {
      id: "business-logic",
      title: "Business Logic Engine",
      icon: Settings,
      position: {
        x: 400,
        y: 250
      },
      color: "from-green-500 to-green-600",
      description: undefined,
      features: ["Policy Lifecycle Management", "Commission Calculation Engine", "Renewal & Notification System", "Claims Processing Workflow", "Premium Calculation Logic", "Compliance & Audit Trails"]
    },
    userInterface: {
      id: "user-interface",
      title: "Multi-Role Interface",
      icon: Network,
      position: {
        x: 600,
        y: 250
      },
      color: "from-purple-500 to-purple-600",
      description: undefined,
      features: ["Role-Based Dashboard System", "Real-time Analytics & Reports", "Mobile-Responsive Design", "White-Label Customization", "Advanced Search & Filtering", "Integrated Communication Tools"]
    },
    aiLayer: {
      id: "ai-layer",
      title: "AI & Analytics Layer",
      icon: Brain,
      position: {
        x: 300,
        y: 400
      },
      color: "from-orange-500 to-orange-600",
      description: undefined,
      features: ["Predictive Analytics (Coming Soon)", "Risk Assessment AI (Coming Soon)", "Customer Behavior Analysis (Coming Soon)", "Automated Recommendations (Coming Soon)", "Performance Optimization (Coming Soon)", "Fraud Detection (Coming Soon)"]
    },
    security: {
      id: "security",
      title: "Security & Compliance",
      icon: Lock,
      position: {
        x: 500,
        y: 400
      },
      color: "from-red-500 to-red-600",
      description: undefined,
      features: ["Multi-Factor Authentication", "Role-Based Access Control", "Data Encryption (End-to-End)", "Audit Trail Management", "GDPR Compliance", "Industry Standard Security"]
    }
  };

  // Dashboard Ecosystem
  const dashboardEcosystem = [{
    id: "system-admin",
    title: "System Administrator",
    icon: Shield,
    color: "from-red-500 to-red-600",
    level: "Platform Level",
    capabilities: ["Tenant Management & Onboarding", "Master Data Configuration", "System-wide Analytics & Monitoring", "Subscription & Billing Management", "Platform Security & Compliance", "Global Performance Optimization"]
  }, {
    id: "tenant-admin",
    title: "Tenant Administrator",
    icon: Building,
    color: "from-blue-500 to-blue-600",
    level: "Organization Level",
    capabilities: ["Branch & Location Management", "Employee Hierarchy Setup", "Agent Network Administration", "Commission Structure Design", "Financial Reporting & Analytics", "Organization-wide Policy Control"]
  }, {
    id: "agent-user",
    title: "Insurance Agent",
    icon: UserCheck,
    color: "from-green-500 to-green-600",
    level: "Operational Level",
    capabilities: ["Customer Relationship Management", "Policy Creation & Management", "Lead Generation & Tracking", "Commission Tracking & Payouts", "Performance Dashboard & KPIs", "Mobile-First Field Operations"]
  }, {
    id: "customer-portal",
    title: "Customer Self-Service",
    icon: CreditCard,
    color: "from-purple-500 to-purple-600",
    level: "User Level",
    capabilities: ["Policy Portfolio Management", "Premium Payment & History", "Claims Status & Documentation", "Renewal Notifications & Actions", "Document Repository Access", "24/7 Support & Communication"]
  }];
  return <div className="min-h-screen bg-background">
      {/* Professional Header */}
      <header className="sticky top-0 z-50 bg-background/98 backdrop-blur-md border-b border-border/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-18">
            <Link to="/" className="flex items-center space-x-3 group">
              <img src="/lovable-uploads/154873ec-48fd-43c5-a8eb-d5a8a3d9fad8.png" alt="CRESTLINE Logo" className="h-11 w-auto transition-transform group-hover:scale-105" />
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium">
                Home
              </Link>
              <span className="text-primary font-semibold border-b-2 border-primary pb-1">
                System Overview
              </span>
              <a href="mailto:po@lmvinsurancebroking.com" className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium">
                Contact
              </a>
              <Link to="/login">
                <Button variant="outline" className="border-2 border-primary/30 hover:border-primary hover:bg-gradient-to-r hover:from-secondary hover:to-primary hover:text-white transition-all duration-300 font-medium px-6">
                  Access Platform
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Introduction */}
      <section className="py-24 px-6 bg-gradient-to-br from-secondary/5 via-background to-primary/5">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent leading-tight md:text-4xl">
            System Architecture
          </h1>
          <p className="text-2xl md:text-3xl text-foreground/80 leading-relaxed mb-6 font-light">
            CRESTLINE is an enterprise-grade, AI-ready Insurance CRM Platform 
            designed to transform insurance broking operations.
          </p>
          <p className="text-lg text-foreground/60 max-w-3xl mx-auto leading-relaxed">
            A comprehensive ecosystem connecting master data, business logic, user interfaces, 
            and intelligent analytics — all unified under one sophisticated platform architecture.
          </p>
        </div>
      </section>

      {/* Platform Architecture Tree */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent md:text-4xl">
              Platform Architecture
            </h2>
            <p className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              Discover how our modular architecture connects every component 
              for seamless insurance management operations
            </p>
          </div>

          {/* Architecture Diagram */}
          <div className="relative w-full max-w-6xl mx-auto h-[600px] bg-gradient-to-br from-card via-background to-muted/20 rounded-3xl border border-border/30 shadow-2xl overflow-hidden">
            
            {/* Connection Lines SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 600">
              <defs>
                <linearGradient id="architectureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(142 76% 36%)" />
                  <stop offset="50%" stopColor="hsl(214 84% 35%)" />
                  <stop offset="100%" stopColor="hsl(262 90% 50%)" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge> 
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {/* Core to main layers */}
              <path d="M 400 100 Q 300 175 200 250" stroke="url(#architectureGradient)" strokeWidth="4" fill="none" filter="url(#glow)" className={`transition-all duration-500 ${hoveredNode === 'master-data' || hoveredNode === 'core-platform' ? 'opacity-100' : 'opacity-50'}`} />
              <path d="M 400 100 L 400 250" stroke="url(#architectureGradient)" strokeWidth="4" fill="none" filter="url(#glow)" className={`transition-all duration-500 ${hoveredNode === 'business-logic' || hoveredNode === 'core-platform' ? 'opacity-100' : 'opacity-50'}`} />
              <path d="M 400 100 Q 500 175 600 250" stroke="url(#architectureGradient)" strokeWidth="4" fill="none" filter="url(#glow)" className={`transition-all duration-500 ${hoveredNode === 'user-interface' || hoveredNode === 'core-platform' ? 'opacity-100' : 'opacity-50'}`} />
              
              {/* Secondary connections */}
              <path d="M 400 250 Q 350 325 300 400" stroke="url(#architectureGradient)" strokeWidth="3" fill="none" filter="url(#glow)" className={`transition-all duration-500 ${hoveredNode === 'ai-layer' ? 'opacity-90' : 'opacity-40'}`} strokeDasharray="8,4" />
              <path d="M 400 250 Q 450 325 500 400" stroke="url(#architectureGradient)" strokeWidth="3" fill="none" filter="url(#glow)" className={`transition-all duration-500 ${hoveredNode === 'security' ? 'opacity-90' : 'opacity-40'}`} strokeDasharray="8,4" />
            </svg>

            {/* Architecture Nodes */}
            {Object.values(platformArchitecture).map(node => <div key={node.id} className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 cursor-pointer group ${hoveredNode === node.id ? 'scale-110 z-20' : 'hover:scale-105 z-10'}`} style={{
            left: `${node.position.x / 800 * 100}%`,
            top: `${node.position.y / 600 * 100}%`
          }} onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)}>
                {/* Node Circle */}
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${node.color} border-4 border-background shadow-2xl flex items-center justify-center group-hover:shadow-3xl transition-all duration-500 ${hoveredNode === node.id ? 'shadow-3xl' : ''}`}>
                  <node.icon className="w-8 h-8 text-white" />
                </div>
                
                {/* Node Label */}
                <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 text-center">
                  <h4 className="text-sm font-bold text-foreground whitespace-nowrap mb-1">
                    {node.title}
                  </h4>
                  {node.description && <p className="text-xs text-foreground/60 whitespace-nowrap">
                      {node.description}
                    </p>}
                </div>

                {/* Feature Details on Hover */}
                {node.features && <div className={`absolute bottom-full mb-6 left-1/2 transform -translate-x-1/2 bg-card border border-border/40 text-foreground rounded-xl px-5 py-4 shadow-2xl transition-all duration-300 min-w-64 max-w-72 ${hoveredNode === node.id ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}>
                    <div className="font-semibold text-primary mb-3 flex items-center">
                      <node.icon className="w-4 h-4 mr-2" />
                      {node.title}
                    </div>
                    <ul className="space-y-2 text-sm">
                      {node.features.map((feature, idx) => <li key={idx} className="flex items-start">
                          <ArrowRight className="w-3 h-3 mr-2 mt-0.5 text-primary/70 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>)}
                    </ul>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-card"></div>
                  </div>}
              </div>)}
          </div>
        </div>
      </section>

      {/* Dashboard Ecosystem */}
      <section className="py-24 px-6 bg-gradient-to-br from-muted/20 via-background to-card relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-secondary to-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-accent to-secondary rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent md:text-4xl">
              Dashboard Ecosystem
            </h2>
            <p className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              Role-specific dashboards designed for different user types, 
              each with tailored features and comprehensive capabilities
            </p>
          </div>

          {/* Modern Staggered Layout */}
          <div className="space-y-8">
            {dashboardEcosystem.map((dashboard, index) => (
              <div 
                key={dashboard.id} 
                className={`group relative transition-all duration-700 ${
                  index % 2 === 0 ? 'ml-0 mr-auto' : 'ml-auto mr-0'
                } max-w-4xl`}
                style={{ 
                  animationDelay: `${index * 200}ms` 
                }}
              >
                {/* Connecting Line */}
                {index < dashboardEcosystem.length - 1 && (
                  <div className={`absolute ${index % 2 === 0 ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'} top-full w-px h-16 bg-gradient-to-b from-primary/60 to-transparent`}></div>
                )}

                <div 
                  className={`bg-card/80 backdrop-blur-sm rounded-3xl border border-border/30 p-8 transition-all duration-500 hover:shadow-2xl hover:border-primary/40 cursor-pointer hover:-translate-y-2 ${
                    expandedSection === dashboard.id ? 'ring-2 ring-primary/30 shadow-2xl' : ''
                  }`} 
                  onClick={() => setExpandedSection(expandedSection === dashboard.id ? null : dashboard.id)}
                >
                  {/* Dashboard Header */}
                  <div className={`flex ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} items-start justify-between mb-8`}>
                    <div className={`flex ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} items-center space-x-6`}>
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${dashboard.color} shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                        <dashboard.icon className="w-10 h-10 text-white" />
                      </div>
                      <div className={index % 2 === 0 ? 'text-left' : 'text-right'}>
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                          {dashboard.title}
                        </h3>
                        <span className="text-sm text-primary font-semibold bg-primary/15 px-4 py-2 rounded-full border border-primary/20">
                          {dashboard.level}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`w-6 h-6 text-foreground/60 transition-transform duration-300 ${expandedSection === dashboard.id ? 'rotate-180' : ''} group-hover:text-primary`} />
                  </div>

                  {/* Capabilities Preview */}
                  <div className={`transition-all duration-500 ${expandedSection === dashboard.id ? 'mb-8' : 'mb-4'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dashboard.capabilities.slice(0, expandedSection === dashboard.id ? dashboard.capabilities.length : 4).map((capability, idx) => (
                        <div key={idx} className="flex items-start bg-gradient-to-r from-muted/40 to-muted/20 rounded-xl p-4 transition-all hover:from-muted/60 hover:to-muted/40 border border-border/20">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${dashboard.color} mt-1 mr-3 flex-shrink-0 shadow-lg`}></div>
                          <span className="text-sm text-foreground/90 font-medium">{capability}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expand Indicator */}
                  {expandedSection !== dashboard.id && dashboard.capabilities.length > 4 && (
                    <div className="text-center">
                      <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mb-3"></div>
                      <p className="text-sm text-foreground/60 font-medium">
                        +{dashboard.capabilities.length - 4} more capabilities • Click to expand
                      </p>
                    </div>
                  )}

                  {/* Floating Number Badge */}
                  <div className={`absolute ${index % 2 === 0 ? '-left-4' : '-right-4'} top-8 w-12 h-12 rounded-full bg-gradient-to-r ${dashboard.color} flex items-center justify-center text-white font-bold text-lg shadow-xl`}>
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ecosystem Flow Indicator */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center space-x-4 bg-card/50 backdrop-blur-sm rounded-full px-6 py-3 border border-border/30">
              <div className="flex space-x-2">
                {dashboardEcosystem.map((_, idx) => (
                  <div key={idx} className={`w-3 h-3 rounded-full ${expandedSection === dashboardEcosystem[idx].id ? 'bg-primary' : 'bg-primary/30'} transition-all duration-300`}></div>
                ))}
              </div>
              <span className="text-sm text-foreground/70 font-medium">Integrated Ecosystem Flow</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6 bg-gradient-to-br from-secondary/10 via-primary/5 to-accent/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-8 text-foreground text-center md:text-3xl">
            Ready to Transform Your
            <span className="block bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              Insurance Operations?
            </span>
          </h2>
          <p className="text-xl text-foreground/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Experience the power of CRESTLINE's comprehensive platform 
            with a personalized demonstration tailored to your business needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="mailto:po@lmvinsurancebroking.com">
              <Button size="lg" className="bg-gradient-to-r from-secondary via-primary to-accent text-white px-10 py-6 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border-0">
                Schedule Demo
              </Button>
            </a>
            <Link to="/login">
              <Button variant="outline" size="lg" className="border-2 border-primary/30 hover:border-primary px-10 py-6 text-lg font-semibold rounded-2xl transition-all duration-300">
                Access Platform
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="py-20 bg-card border-t border-border/30">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center space-y-6">
            <div className="space-y-3">
              <p className="text-lg font-semibold text-foreground">
                Engineered by <span className="text-primary">Lakshitha Tech Solutions Pvt Ltd</span>
              </p>
              <p className="text-sm text-foreground/60">
                Copyright © 2024 Lakshitha Tech Solutions Pvt Ltd. All rights reserved.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
              <a href="https://www.lakshithatech.com" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-foreground/70 hover:text-primary transition-colors duration-200">
                <Globe className="w-4 h-4" />
                <span>www.lakshithatech.com</span>
              </a>
              
              <div className="hidden sm:block w-px h-4 bg-border"></div>
              
              <a href="tel:7860087434" className="flex items-center space-x-2 text-foreground/70 hover:text-primary transition-colors duration-200">
                <span>📞</span>
                <span>+91 7860087434</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default AboutSystem;