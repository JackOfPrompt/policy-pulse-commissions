import { Facebook, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";
const Footer = () => {
  return <footer className="bg-foreground text-background py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* About LMV Insurance */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">LMV Insurance</h3>
            <p className="text-background/80 leading-relaxed">
              Simplifying insurance for over a decade. We help you compare, purchase, 
              and manage insurance policies from India's top providers with transparency and trust.
            </p>
            <div className="flex space-x-4 pt-4">
              <a href="#" className="text-background/60 hover:text-background transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><a href="#products" className="text-background/80 hover:text-background transition-colors">Products</a></li>
              <li><a href="#providers" className="text-background/80 hover:text-background transition-colors">Providers</a></li>
              <li><a href="#features" className="text-background/80 hover:text-background transition-colors">Features</a></li>
              <li><a href="https://www.lmvinsurance.com/" className="text-background/80 hover:text-background transition-colors">Get Quotes</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Claims</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Insurance Types */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">Insurance Types</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Health Insurance</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Motor Insurance</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Life Insurance</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Commercial Insurance</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Property Insurance</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Travel Insurance</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-background/60" />
                <span className="text-background/80">po@lmvinsurancebroking.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-background/60" />
                <span className="text-background/80">+91 98765 43210</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-background/60 mt-1" />
                <span className="text-background/80">
                  Business District,<br />
                  Mumbai, Maharashtra<br />
                  India - 400001
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-background/60 text-sm">
              © 2024 LMV Insurance. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-background/60 hover:text-background transition-colors">Privacy Policy</a>
              <a href="#" className="text-background/60 hover:text-background transition-colors">Terms & Conditions</a>
              <a href="#" className="text-background/60 hover:text-background transition-colors">IRDAI</a>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;