import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Youtube, Mail, MapPin, Phone } from "lucide-react";
import { FaReddit } from "react-icons/fa";
import Logo from "@/assets/white nester logo.png";

const Footer = () => {
  const handleSocialClick = (platform: string, url: string, appUrl: string) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try to open app first on mobile
      window.location.href = appUrl;
      // Fallback to web URL after 1.5 seconds if app doesn't open
      setTimeout(() => {
        window.open(url, "_blank");
      }, 1500);
    } else {
      // Open in new tab on desktop
      window.open(url, "_blank");
    }
  };

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="mb-4">
              <img src={Logo} alt="TN Logo" className="h-16 object-contain mb-3" />
              
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Dubai's premium property agency connecting buyers and investors with luxury developer projects.
            </p>
            <div className="flex gap-3">
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  handleSocialClick("facebook", "https://www.facebook.com/truenester", "fb://page/truenester");
                }}
                className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  handleSocialClick("instagram", "https://www.instagram.com/truenester.ae", "instagram://user/truenester.ae");
                }}
                className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  handleSocialClick("linkedin", "https://www.linkedin.com/company/truenester", "linkedin://company/truenester");
                }}
                className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  handleSocialClick("reddit", "https://www.reddit.com/r/truenester", "reddit://r/truenester");
                }}
                className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <FaReddit className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  handleSocialClick("youtube", "https://www.youtube.com/@TrueNester-h5f", "youtube://@TrueNester-h5f");
                }}
                className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/buy" className="text-sm text-gray-300 hover:text-primary transition-colors" onClick={() => window.scrollTo(0, 0)}>
                  Buy Property
                </Link>
              </li>
              <li>
                <Link to="/sell" className="text-sm text-gray-300 hover:text-primary transition-colors" onClick={() => window.scrollTo(0, 0)}>
                  Sell Property
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-gray-300 hover:text-primary transition-colors" onClick={() => window.scrollTo(0, 0)}>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/locations" className="text-sm text-gray-300 hover:text-primary transition-colors" onClick={() => window.scrollTo(0, 0)}>
                  Locations
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-300 hover:text-primary transition-colors" onClick={() => window.scrollTo(0, 0)}>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Locations */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Dubai Locations</h4>
            <ul className="space-y-2">
              <li className="text-sm text-gray-300">Downtown Dubai</li>
              <li className="text-sm text-gray-300">Dubai Marina</li>
              <li className="text-sm text-gray-300">Palm Jumeirah</li>
              <li className="text-sm text-gray-300">Business Bay</li>
              <li className="text-sm text-gray-300">JBR</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-300">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Office address: 206, Bin Sougat building, Salah Al Din street, Deira, Dubai, United Arab Emirates</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <span>+971 557 925525</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <span>info@truenester.com  truenester4u@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © 2025 TRUE NESTER. All rights reserved. Developed by <span className="text-primary font-semibold">True Nester</span>
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
