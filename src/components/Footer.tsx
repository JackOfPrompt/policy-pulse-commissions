import { Facebook, Twitter, Linkedin, Mail, Phone, MapPin, Shield, Award, Users, Globe } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-primary to-primary/90 text-primary-foreground overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-foreground/5 to-transparent"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        {/* Top Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-foreground to-primary-foreground/80 bg-clip-text">
            CRESTLINE
          </h2>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Your Trusted Insurance Partner - Simplifying Protection for Life's Journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-accent" />
              <h3 className="text-2xl font-bold">About Us</h3>
            </div>
            <p className="text-primary-foreground/80 leading-relaxed text-lg">
              Over a decade of excellence in insurance services. We connect you with India's leading providers through our trusted platform.
            </p>
            <div className="flex space-x-4 pt-4">
              <a href="#" className="group p-2 rounded-full bg-primary-foreground/10 hover:bg-accent transition-colors duration-300">
                <Facebook className="w-5 h-5 text-primary-foreground group-hover:text-accent-foreground" />
              </a>
              <a href="#" className="group p-2 rounded-full bg-primary-foreground/10 hover:bg-accent transition-colors duration-300">
                <Twitter className="w-5 h-5 text-primary-foreground group-hover:text-accent-foreground" />
              </a>
              <a href="#" className="group p-2 rounded-full bg-primary-foreground/10 hover:bg-accent transition-colors duration-300">
                <Linkedin className="w-5 h-5 text-primary-foreground group-hover:text-accent-foreground" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Award className="w-8 h-8 text-accent" />
              <h3 className="text-2xl font-bold">Services</h3>
            </div>
            <ul className="space-y-4">
              <li><a href="#products" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 flex items-center space-x-2 text-lg"><span>→</span><span>Product Comparison</span></a></li>
              <li><a href="#providers" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 flex items-center space-x-2 text-lg"><span>→</span><span>Provider Network</span></a></li>
              <li><a href="#features" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 flex items-center space-x-2 text-lg"><span>→</span><span>Digital Platform</span></a></li>
              <li><a href="https://www.lmvinsurance.com/" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 flex items-center space-x-2 text-lg"><span>→</span><span>Get Quotes</span></a></li>
            </ul>
          </div>

          {/* Insurance Products */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-accent" />
              <h3 className="text-2xl font-bold">Products</h3>
            </div>
            <ul className="space-y-4">
              <li><a href="#" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 flex items-center space-x-2 text-lg"><span>→</span><span>Health Insurance</span></a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 flex items-center space-x-2 text-lg"><span>→</span><span>Motor Insurance</span></a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 flex items-center space-x-2 text-lg"><span>→</span><span>Life Insurance</span></a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 flex items-center space-x-2 text-lg"><span>→</span><span>Commercial Plans</span></a></li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Globe className="w-8 h-8 text-accent" />
              <h3 className="text-2xl font-bold">Contact</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-primary-foreground/10">
                <Mail className="w-6 h-6 text-accent flex-shrink-0" />
                <span className="text-primary-foreground text-lg">Info@lakshithatech.com</span>
              </div>
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-primary-foreground/10">
                <Phone className="w-6 h-6 text-accent flex-shrink-0" />
                <span className="text-primary-foreground text-lg">+91 98765 43210</span>
              </div>
              <div className="flex items-start space-x-4 p-3 rounded-lg bg-primary-foreground/10">
                <MapPin className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div className="text-primary-foreground text-lg">
                  <div>Business District</div>
                  <div>Mumbai, Maharashtra</div>
                  <div>India - 400001</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/20 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
            <div className="text-primary-foreground/70 text-lg text-center lg:text-left">
              © 2024 CRESTLINE. All rights reserved. | Regulated by IRDAI
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-lg">
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors duration-200">Privacy Policy</a>
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors duration-200">Terms & Conditions</a>
              <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors duration-200">IRDAI Compliance</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;