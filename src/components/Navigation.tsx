/*
  ═══════════════════════════════════════════════════════════════════════════════
  👶 SUPER SIMPLE GUIDE TO EDIT THE NAVIGATION DROPDOWN CARDS
  ═══════════════════════════════════════════════════════════════════════════════Step 2: Update Navigation.tsx
  
  
  📚 WHAT ARE DROPDOWN CARDS?
  When you hover your mouse over menu items like "BUY", "RENT", "AREAS", or "BLOGS",
  a white card appears below with options. This guide shows you how to change them!

  ═══════════════════════════════════════════════════════════════════════════════
  🎯 COMMON TASKS:
  ═══════════════════════════════════════════════════════════════════════════════

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1️⃣  HOW TO ADD A NEW ITEM TO A DROPDOWN
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  Step 1: Find the "dropdownContent" section below (around line 50)
  Step 2: Find the dropdown you want to edit (BUY, RENT, AREAS, or BLOGS)
  Step 3: Copy ONE item (from { emoji: to the }, after path: )
  Step 4: Paste it at the end of the list (before the closing ]
  Step 5: Change these 4 things:
          - emoji: Any emoji you want! 🏠 🌴 🏖️ 🏰 etc.
          - title: The big text people see
          - description: Small text below the title
          - path: Where it goes when clicked (like "/buy?type=studio")
  
  Example:
  {
    emoji: "🏢",                    ← Change this emoji
    title: "Studios",               ← Change this title
    description: "Cozy studio apartments",  ← Change this description
    path: "/buy?type=studio"        ← Change this link
  },

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  2️⃣  HOW TO REMOVE AN ITEM FROM A DROPDOWN
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  Step 1: Find the item you want to remove in "dropdownContent"
  Step 2: Delete everything from { emoji: to the }, (including the comma)
  Step 3: Save the file!

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  3️⃣  HOW TO ADD DROPDOWN TO A NEW MENU ITEM
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  Step 1: In "navLinks", find the menu item and change hasDropdown to true
  Step 2: In "dropdownContent", add a new section:
  
  NEWMENU: [
    {
      emoji: "😊",
      title: "First Option",
      description: "Description here",
      path: "/somewhere"
    },
  ],

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  4️⃣  HOW TO CHANGE THE CARD'S APPEARANCE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  Find the line with "className="bg-white dark:bg-gray-900..." (around line 180)
  
  TO MAKE CARD WIDER:    Change min-w-[300px] to min-w-[400px]
  TO MAKE CORNERS ROUNDER: Change rounded-xl to rounded-2xl
  TO MAKE SHADOW BIGGER:  Change shadow-2xl to shadow-3xl
  TO ADD MORE SPACE INSIDE: Change p-4 to p-6

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  5️⃣  HOW TO CHANGE ANIMATION SPEED
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  Go to src/index.css file
  Find "@keyframes dropdownSlideIn"
  Change "0.2s" to a bigger number (slower) or smaller number (faster)
  Example: 0.5s = slow, 0.1s = fast

  ═══════════════════════════════════════════════════════════════════════════════
*/

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Phone, Search, Globe, Home, Building2, MapPin, BookOpen, ChevronDown, LogOut, User, Heart, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/TrueNester_logo.png";
import { useAuth } from "@/contexts/AuthContext.v2";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Star } from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  // 👶 SIMPLE: This keeps track of which menu is open (like "BUY", "RENT", etc.)
  // When you hover on a menu item, this stores its name. When you move away, it becomes null (empty)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  // 👶 SIMPLE: This waits before closing the card (gives you time to move your mouse)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 🔐 AUTH: User dropdown state
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user profile on mount
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setUserProfile(data);
      } else {
        // Fallback to user metadata
        setUserProfile({
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          avatar_url: user.user_metadata?.avatar_url || null,
        });
      }
    } catch {
      // Fallback if profile table doesn't exist yet
      setUserProfile({
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        avatar_url: user.user_metadata?.avatar_url || null,
      });
    }
  };

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsUserDropdownOpen(false);
    setIsSignOutDialogOpen(false);
    await signOut();
    // signOut now handles redirect to home page
  };

  const confirmLogout = () => {
    setIsSignOutDialogOpen(true);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = userProfile?.full_name || user?.email?.split("@")[0] || "User";

  // 👶 SIMPLE: This is a list of all menu items
  // Each item has: name (what you see), path (where it goes), and hasDropdown (shows white card or not)
  const navLinks = [
    { name: "BUY", path: "/buy", hasDropdown: true },      // 🏠 BUY has a dropdown card
    { name: "RENT", path: "/rent", hasDropdown: true },    // 🏢 RENT has a dropdown card
    { name: "SELL", path: "/sell", hasDropdown: false },   // ❌ SELL has NO dropdown
    { name: "AREAS", path: "/locations", hasDropdown: true }, // 📍 AREAS has a dropdown card
    { name: "BLOGS", path: "/blog", hasDropdown: true },   // 📚 BLOGS has a dropdown card
    { name: "ABOUT", path: "/about", hasDropdown: false }, // ❌ ABOUT has NO dropdown
    { name: "CONTACT", path: "/contact", hasDropdown: false }, // ❌ CONTACT has NO dropdown
  ];

  // 👶 SIMPLE: This is the content that appears in each white card
  // To ADD MORE ITEMS: Just copy one section and change the emoji/svgPath, title, description, and path
  // To REMOVE ITEMS: Delete the entire section between { emoji/svgPath: ... and }
const dropdownContent: Record<string, Array<{ svgPath?: string; emoji?: string; title: string; description: string; path: string }>> = {    // 🏠 BUY DROPDOWN - What shows when you hover over "BUY"
    BUY: [
      {
        svgPath: "https://www.svgrepo.com/show/1507/aparment.svg",
        title: "Apartments",
        description: "Luxury apartments in prime locations",
        path: "/buy?type=apartment"
      },
      {
        svgPath: "/villa.svg",
        title: "Villas",
        description: "Spacious villas with gardens",
        path: "/buy?type=villa"
      },
      {
        svgPath: "https://www.svgrepo.com/show/456974/real-estate-building.svg",
        title: "Penthouses",
        description: "Exclusive top-floor living",
        path: "/buy?type=penthouse"
      },
      {
        svgPath: "https://www.svgrepo.com/show/132162/townhouse.svg",
        title: "Townhouses",
        description: "Spacious multi-floor homes",
        path: "/buy?type=townhouse"
      },
      {
        svgPath: "https://www.svgrepo.com/show/26076/flash-apartment.svg", 
        title: "Commercials",
        description: "Premium commercial properties",
        path: "/buy?type=commercial"
      },
    ],
    
    // 🏢 RENT DROPDOWN - Jumeirah Rentals sub-areas
    RENT: [
      {
        svgPath: "https://www.svgrepo.com/show/477001/beach.svg",
        title: "Umm Suqeim 1",
        description: "",
        path: "/rent?location=jumeirah&subarea=umm-suqeim-1"
      },
      {
        svgPath: "https://www.svgrepo.com/show/477001/beach.svg",
        title: "Umm Suqeim 2",
        description: "",
        path: "/rent?location=jumeirah&subarea=umm-suqeim-2"
      },
      {
        svgPath: "https://www.svgrepo.com/show/477001/beach.svg",
        title: "Umm Suqeim 3",
        description: "",
        path: "/rent?location=jumeirah&subarea=umm-suqeim-3"
      },
      {
        svgPath: "https://www.svgrepo.com/show/477001/beach.svg",
        title: "Jumeirah 1",
        description: "",
        path: "/rent?location=jumeirah&subarea=jumeirah-1"
      },
      {
        svgPath: "https://www.svgrepo.com/show/477001/beach.svg",
        title: "Jumeirah 2",
        description: "",
        path: "/rent?location=jumeirah&subarea=jumeirah-2"
      },
      {
        svgPath: "https://www.svgrepo.com/show/477001/beach.svg",
        title: "Jumeirah 3",
        description: "",
        path: "/rent?location=jumeirah&subarea=jumeirah-3"
      },
      {
        svgPath: "https://www.svgrepo.com/show/477001/beach.svg",
        title: "Al Manara",
        description: "",
        path: "/rent?location=jumeirah&subarea=al-manara"
      },
      {
        svgPath: "https://www.svgrepo.com/show/477001/beach.svg",
        title: "Al Safa 1",
        description: "",
        path: "/rent?location=jumeirah&subarea=al-safa-1"
      },
      {
        svgPath: "https://www.svgrepo.com/show/477001/beach.svg",
        title: "Al Safa 2",
        description: "",
        path: "/rent?location=jumeirah&subarea=al-safa-2"
      },
      {
        svgPath: "https://www.svgrepo.com/show/477001/beach.svg",
        title: "Al Wasl",
        description: "",
        path: "/rent?location=jumeirah&subarea=al-wasl"
      },
    ],
    
    // 📍 AREAS DROPDOWN - What shows when you hover over "AREAS"
    AREAS: [
      {
        svgPath: "https://www.svgrepo.com/show/258484/burj-al-arab-dubai.svg",
        title: "Dubai",
        description: "Downtown, Marina & more",
        path: "/locations"
      },
      {
        svgPath: "https://www.svgrepo.com/show/239996/location-pin.svg",
        title: "Abu Dhabi",
        description: "Capital city locations",
        path: "/locations"
      },
      {
        svgPath: "https://www.svgrepo.com/show/476838/beach.svg",
        title: "Ras Al Khaimah",
        description: "Beach & mountain areas",
        path: "/locations"
      },
      {
        svgPath: "https://www.svgrepo.com/show/476983/beautiful-scenery.svg",
        title: "Fujairah",
        description: "Beach & natural landscapes",
        path: "/locations"
      },
      {
        svgPath: "https://www.svgrepo.com/show/428268/beach.svg",
        title: "Ajman",
        description: "Sandy Beaches & Marinas",
        path: "/locations"
      },
      {
        svgPath: "https://www.svgrepo.com/show/483298/banks-museums-galleries-s-2.svg",
        title: "Sharjah",
        description: "Cultural Heritage ",
        path: "/locations"
      },
      {
        svgPath: "https://www.svgrepo.com/show/480089/castle-11.svg",
        title: "Umm Al Quwain",
        description: "Tranquil & Secluded Living",
        path: "/locations"
      }
    ],
    
    // 📚 BLOGS DROPDOWN - What shows when you hover over "BLOGS"
    BLOGS: [
      {
        svgPath: "https://www.svgrepo.com/show/417128/news.svg",
        title: "Latest News",
        description: "Real estate market updates",
        path: "/blog?category=news"
      },
      {
        svgPath: "https://www.svgrepo.com/show/500580/guide.svg",
        title: "Buying Guide",
        description: "Tips for property buyers",
        path: "/blog?category=guide"
      },
      {
        svgPath: "https://www.svgrepo.com/show/375295/calculated-insights.svg",
        title: "Market Insights",
        description: "Trends and analysis",
        path: "/blog?category=insights"
      },
    ],
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <nav className="container-custom py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group" onClick={() => window.scrollTo(0, 0)}>
            <img 
              src={logoImage} 
              alt="True Nester - The Property Perfection" 
              className="h-16 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              // 👶 SIMPLE: This is ONE menu item (like "BUY" or "RENT")
              // The "div" is like a container that holds everything for this menu item
              <div
                key={link.path}
                className="relative"  // 👶 "relative" means: the white card will appear BELOW this item
                // 👶 HOVER EVENTS: These control when the white card appears
                onMouseEnter={() => {
                  if (link.hasDropdown) {
                    // 👶 Cancel any waiting close action
                    if (closeTimeoutRef.current) {
                      clearTimeout(closeTimeoutRef.current);
                      closeTimeoutRef.current = null;
                    }
                    setActiveDropdown(link.name);
                  }
                }}  // 👶 Show card when mouse enters
                onMouseLeave={() => {
                  // 👶 Wait 400ms before closing (gives you time to move mouse to card)
                  closeTimeoutRef.current = setTimeout(() => {
                    setActiveDropdown(null);
                  }, 400);
                }}  // 👶 Hide card when mouse leaves (with delay!)
              >
                {/* 👶 This is the actual menu text you see (like "BUY") */}
                <Link
                  to={link.path}
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1"
                  onClick={() => window.scrollTo(0, 0)}
                >
                  {link.name}
                  {/* 👶 ARROW: Shows a tiny arrow ▼ if this item has a dropdown */}
                  {link.hasDropdown && (
                    <ChevronDown className="h-3 w-3" />  // 👶 The ▼ arrow icon
                  )}
                </Link>

                {/* 👶 THE WHITE CARD: This is the magic dropdown that appears! */}
                {/* 👶 It only shows if: 1) This menu has dropdown AND 2) Mouse is hovering on it */}
                {link.hasDropdown && activeDropdown === link.name && (
                  <div
                    // 👶 POSITION: "absolute" means it floats above the page
                    // "top-full" means: start RIGHT BELOW the menu item
                    // "left-0" means: line up with the left edge
                    className="absolute top-full left-0 mt-2 z-50"
                    // 👶 KEEP CARD OPEN: When mouse is over the card, cancel any close action
                    onMouseEnter={() => {
                      if (closeTimeoutRef.current) {
                        clearTimeout(closeTimeoutRef.current);
                        closeTimeoutRef.current = null;
                      }
                    }}
                    onMouseLeave={() => {
                      // 👶 Close after 300ms when leaving the card (gives you time!)
                      closeTimeoutRef.current = setTimeout(() => {
                        setActiveDropdown(null);
                      }, 300);
                    }}
                  >
                    {/* 👶 THE ACTUAL WHITE CARD */}
                    <div
                      // 👶 STYLING THE CARD - What makes it look pretty:
                      // bg-white = white background color (dark:bg-gray-900 = dark mode color)
                      // rounded-xl = rounded corners (makes edges smooth and curved)
                      // shadow-2xl = BIG shadow (makes it look like floating in air)
                      // border = thin line around the card edge
                      // p-4 = padding (space between edge and content inside)
                      // min-w-[300px] = minimum width of 300 pixels (can't be skinnier)
                      // dropdown-animate = our custom sliding animation (defined in index.css)
                      className={`bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 ${link.name === 'RENT' ? 'min-w-[520px]' : 'min-w-[300px]'} dropdown-animate`}
                      // 👶 TO CUSTOMIZE THE CARD LOOK:
                      // - Change "rounded-xl" to "rounded-2xl" for MORE rounded corners
                      // - Change "shadow-2xl" to "shadow-lg" for SMALLER shadow
                      // - Change "min-w-[300px]" to a bigger number for WIDER card
                      // - Change "p-4" to "p-6" for MORE space inside
                    >
                      {/* 👶 ITEMS INSIDE THE CARD: Special layout for RENT (Jumeirah) */}
                      {link.name === 'RENT' ? (
                        <>
                          {/* Heading */}
                          <div className="px-1 pb-2">
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Jumeirah</div>
                          </div>
                          {/* 3-column grid to reduce height by spreading items horizontally */}
                          <div className="grid grid-cols-3 gap-0.5">
                            {dropdownContent[link.name]?.map((item, index) => (
                              <Link
                                key={index}
                                to={item.path}
                                onClick={() => {
                                  window.scrollTo(0, 0);
                                  setActiveDropdown(null);
                                }}
                                className="flex items-start gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                              >
                                {/* SVG or Emoji for RENT dropdown */}
                                {item.svgPath ? (
                                  <img 
                                    src={item.svgPath} 
                                    alt={item.title}
                                    className="w-8 h-8 object-contain flex-shrink-0 group-hover:scale-110 transition-transform"
                                  />
                                ) : (
                                  <span className="text-xl leading-none">{item.emoji}</span>
                                )}
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors leading-snug">
                                    {item.title}
                                  </div>
                                  <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                                    {item.description}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1">  {/* space-y-1 = small gap between rows */}
                          {dropdownContent[link.name]?.map((item, index) => (
                            <Link
                              key={index}
                              to={item.path}
                              onClick={() => {
                                window.scrollTo(0, 0);
                                setActiveDropdown(null);  // 👶 Close card when clicked
                              }}
                              // 👶 HOVER EFFECT: Changes color when mouse is on it
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 group"
                            >
                              {/* 👶 THE ICON on the left - Either SVG or Emoji */}
                              {item.svgPath ? (
                                <img 
                                  src={item.svgPath} 
                                  alt={item.title}
                                  className="w-10 h-10 object-contain flex-shrink-0 group-hover:scale-110 transition-transform"
                                />
                              ) : (
                                <span className="text-2xl">{item.emoji}</span>
                              )}
                              
                              {/* 👶 THE TEXT on the right */}
                              <div className="flex-1">
                                {/* 👶 BIG TITLE */}
                                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                  {item.title}
                                </div>
                                {/* 👶 SMALL DESCRIPTION */}
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {item.description}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="tel:+971557925525"
              className="inline-flex items-center px-3 py-2 rounded-lg bg-gradient-primary hover:opacity-90 text-white transition-all duration-300"
            >
              <Phone className="h-4 w-4 mr-2" />
              +971 557 925525
            </a>

            {/* 🔐 AUTH SECTION: Login button or User dropdown */}
            {user ? (
              /* Logged In: Show user avatar + dropdown */
              <div className="relative" ref={userDropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {/* Avatar */}
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(displayName)}
                    </div>
                  )}
                  {/* Name */}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                    {displayName}
                  </span>
                  {/* Chevron */}
                  <motion.div
                    animate={{ rotate: isUserDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </motion.div>
                </motion.button>

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {isUserDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                    >
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          to="/dashboard"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Home className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <Link
                          to="/favorites"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          My Favorites
                        </Link>
                        <Link
                          to="/inquiries"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          My Inquiries
                        </Link>
                        <Link
                          to="/my-reviews"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Star className="w-4 h-4" />
                          My Reviews
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-2">
                        <button
                          onClick={confirmLogout}
                          className="flex items-center gap-3 px-4 py-2 w-full text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Logged Out: Show Login / Sign up button */
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-colors shadow-lg shadow-primary/25"
              >
                Login / Sign up
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden mt-4 pb-4 animate-fade-in">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                  onClick={() => {
                    setIsOpen(false);
                    window.scrollTo(0, 0);
                  }}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border">
                <a
                  href="tel:+971557925525"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-primary hover:opacity-90 text-white transition-all duration-300 text-sm font-medium w-full"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  +971 557 925525
                </a>

                {/* 🔐 AUTH SECTION for Mobile */}
                {user ? (
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center gap-3 py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      {userProfile?.avatar_url ? (
                        <img
                          src={userProfile.avatar_url}
                          alt={displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(displayName)}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 py-2 px-3 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      <Home className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      to="/favorites"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 py-2 px-3 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      My Favorites
                    </Link>
                    <Link
                      to="/inquiries"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 py-2 px-3 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      My Inquiries
                    </Link>
                    <Link
                      to="/my-reviews"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 py-2 px-3 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      <Star className="w-4 h-4" />
                      My Reviews
                    </Link>
                    <button
                      onClick={() => {
                        confirmLogout();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-2 py-2 px-3 text-sm text-red-600 hover:text-red-700 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white transition-all duration-300 text-sm font-medium w-full"
                  >
                    Login / Sign up
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Sign Out Confirmation Dialog */}
      <AnimatePresence>
        {isSignOutDialogOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSignOutDialogOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            >
              <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <LogOut className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                  Sign Out?
                </h3>

                {/* Message */}
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  Are you sure you want to sign out? You'll need to log in again to access your account.
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsSignOutDialogOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navigation;

