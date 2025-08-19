import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import useProviders from "@/hooks/useProviders";
import useLOBs from "@/hooks/useLOBs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
const Index = () => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const {
    providers,
    loading: providersLoading
  } = useProviders();
  const {
    lobs,
    loading: lobsLoading,
    getLOBIcon
  } = useLOBs();
  const financeQuotes = ["An investment in knowledge pays the best interest. – Benjamin Franklin", "Wealth consists not in having great possessions, but in having few wants. – Epictetus", "The stock market is filled with individuals who know the price of everything, but the value of nothing. – Philip Fisher", "Do not save what is left after spending, but spend what is left after saving. – Warren Buffett", "It is not the man who has too little, but the man who craves more, that is poor. – Seneca", "In investing, what is comfortable is rarely profitable. – Robert Arnott", "He who buys what he does not need, steals from himself. – Swedish Proverb", "The four most dangerous words in investing are: 'This time it's different.' – Sir John Templeton", "Riches do not exhilarate us so much with their possession as they torment us with their loss. – Epicurus", "It's not how much money you make, but how much money you keep. – Robert Kiyosaki", "Beware of little expenses; a small leak will sink a great ship. – Benjamin Franklin", "The individual investor should act consistently as an investor and not as a speculator. – Ben Graham", "Money is only a tool. It will take you wherever you wish, but it will not replace you as the driver. – Ayn Rand", "Wealth is the ability to fully experience life. – Henry David Thoreau", "The most powerful force in the universe is compound interest. – Albert Einstein", "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make. – Dave Ramsey", "The desire of gold is not for gold. It is for the means of freedom and benefit. – Ralph Waldo Emerson", "Time is more valuable than money. You can get more money, but you cannot get more time. – Jim Rohn", "Frugality includes all the other virtues. – Cicero", "Price is what you pay. Value is what you get. – Warren Buffett", "A wise person should have money in their head, but not in their heart. – Jonathan Swift", "The goal isn't more money. The goal is living life on your terms. – Chris Brogan", "Wealth is not his that has it, but his that enjoys it. – Benjamin Franklin", "The real measure of your wealth is how much you'd be worth if you lost all your money. – Unknown", "Contentment makes poor men rich; discontent makes rich men poor. – Benjamin Franklin", "Every time you borrow money, you're robbing your future self. – Nathan W. Morris", "Money often costs too much. – Ralph Waldo Emerson", "A budget is telling your money where to go instead of wondering where it went. – John C. Maxwell", "Money grows on the tree of persistence. – Japanese Proverb", "Happiness is not in the mere possession of money; it lies in the joy of achievement. – Franklin D. Roosevelt"];

  // Rotate quotes every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex(prev => (prev + 1) % financeQuotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [financeQuotes.length]);
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img src="/lovable-uploads/154873ec-48fd-43c5-a8eb-d5a8a3d9fad8.png" alt="CRESTLINE Logo" className="h-12 w-auto" />
              
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-6">
              <Link to="/about-system" className="text-foreground/80 hover:text-foreground transition-colors">
                About System
              </Link>
              <a href="mailto:po@lmvinsurancebroking.com" className="text-foreground/80 hover:text-foreground transition-colors">
                Contact Us
              </a>
              <Link to="/login">
                <Button variant="outline" className="border-2 border-primary/20 hover:border-primary hover:bg-gradient-to-r hover:from-secondary hover:to-primary hover:text-white transition-all duration-300">
                  Access Platform
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.h1 key={currentQuoteIndex} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -20
          }} transition={{
            duration: 0.8,
            ease: "easeInOut"
          }} className="text-5xl md:text-7xl bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent leading-tight lg:text-4xl font-light">
              {financeQuotes[currentQuoteIndex]}
            </motion.h1>
          </AnimatePresence>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-32"></div>

      {/* Dynamic Carousels Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-4xl text-center mb-16 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent md:text-4xl font-extralight">
            Our Ecosystem
          </motion.h2>

          {/* Line of Business Carousel */}
          <div className="mb-16">
            <h3 className="text-2xl text-center mb-8 text-foreground/80 font-light">Lines of Business</h3>
            <div className="overflow-hidden">
              <motion.div className="flex gap-8" animate={{
              x: ["0%", "-50%"]
            }} transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }} style={{
              width: "200%"
            }}>
                {/* Duplicate LOBs for seamless loop */}
                {[...lobs, ...lobs].map((lob, index) => <motion.div key={`${lob.lob_id}-${index}`} className="flex-shrink-0 w-48 h-36 bg-card rounded-xl p-4 flex flex-col items-center justify-between border border-primary/20 hover:border-primary/40 transition-all duration-300" whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 30px hsl(var(--primary) / 0.1)"
              }}>
                    <div className="flex-1 flex items-center justify-center">
                      {getLOBIcon(lob.icon_file_path) ? <img src={getLOBIcon(lob.icon_file_path)} alt={lob.lob_name} className="w-16 h-16 object-contain" /> : <div className="w-16 h-16 rounded-full bg-gradient-to-r from-secondary to-primary flex items-center justify-center text-white font-bold text-xl">
                          {lob.lob_name.charAt(0)}
                        </div>}
                    </div>
                    <span className="text-sm font-medium text-center text-foreground/80 leading-tight">
                      {lob.lob_name}
                    </span>
                  </motion.div>)}
              </motion.div>
            </div>
          </div>

          {/* Providers Carousel */}
          <div>
            <h3 className="text-2xl text-center mb-8 text-foreground/80 font-light">Insurance Providers</h3>
            <div className="overflow-hidden">
              <motion.div className="flex gap-8" animate={{
              x: ["-50%", "0%"]
            }} transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }} style={{
              width: "200%"
            }}>
                {/* Duplicate providers for seamless loop */}
                {[...providers, ...providers].map((provider, index) => <motion.div key={`${provider.provider_id}-${index}`} className="flex-shrink-0 w-48 h-36 bg-card rounded-xl p-4 flex flex-col items-center justify-between border border-primary/20 hover:border-primary/40 transition-all duration-300" whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 30px hsl(var(--primary) / 0.1)"
              }}>
                    <div className="flex-1 flex items-center justify-center">
                      {provider.logo_file_path ? <img src={provider.logo_file_path} alt={provider.provider_name} className="w-20 h-16 object-contain" /> : <div className="w-20 h-16 rounded-lg bg-gradient-to-r from-secondary to-primary flex items-center justify-center text-white font-bold text-sm">
                          {provider.provider_name.split(' ').map(word => word.charAt(0)).join('').slice(0, 3)}
                        </div>}
                    </div>
                    <span className="text-xs font-medium text-center text-foreground/80 leading-tight">
                      {provider.provider_name}
                    </span>
                  </motion.div>)}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-32"></div>

      {/* Footer */}
      <footer className="py-16 bg-foreground/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="space-y-4 text-foreground/80">
            <p className="text-lg font-medium">
              Designed by <span className="font-semibold">Lakshitha Tech Solutions Pvt Ltd</span>
            </p>
            <p className="text-sm">
              Copyright © Lakshitha Tech Solutions Pvt Ltd
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <a href="https://www.lakshithatech.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                www.lakshithatech.com
              </a>
              <span className="hidden sm:block text-foreground/40">|</span>
              <a href="tel:7860087434" className="hover:text-primary transition-colors">
                📞 7860087434
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;