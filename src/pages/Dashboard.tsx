import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, Routes, Route } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { LayoutDashboard, Bell, BarChart2, Settings, LogOut, Plus, X, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SiteConfigure from './SiteConfigure';
import Analytics from './Analytics';

interface Site {
  id: string;
  name: string;
  url: string;
  created_at?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [savingSite, setSavingSite] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [nameError, setNameError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate('/');
      } else {
        setUser(currentUser);
        fetchSites(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchSites = async (userId: string) => {
    setLoadingSites(true);
    setFetchError('');
    try {
      const q = query(collection(db, 'sites'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const fetchedSites: Site[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedSites.push({
          id: doc.id,
          name: data.siteName,
          url: data.siteUrl,
          created_at: data.createdAt ? new Date(data.createdAt.toMillis()).toISOString() : new Date().toISOString()
        });
      });
      
      // Sort by created_at desc
      fetchedSites.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
      
      setSites(fetchedSites);
    } catch (err: any) {
      console.error('Error fetching sites:', err);
      setFetchError("Couldn't load your data — refresh to try again");
    } finally {
      setLoadingSites(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Pre-validation
    setNameError('');
    setUrlError('');
    setSaveError('');
    
    let isValid = true;
    if (!newSiteName.trim()) {
      setNameError('Site name is required');
      isValid = false;
    }
    
    const urlTrimmed = newSiteUrl.trim();
    if (!urlTrimmed || (!urlTrimmed.startsWith('http://') && !urlTrimmed.startsWith('https://'))) {
      setUrlError('URL must start with http:// or https://');
      isValid = false;
    }
    
    if (!isValid || !user) return;
    
    setSavingSite(true);
    
    try {
      const docRef = await addDoc(collection(db, 'sites'), {
        userId: user.uid,
        siteName: newSiteName.trim(),
        siteUrl: urlTrimmed,
        createdAt: serverTimestamp()
      });
      
      // Optimistic UI update
      setSites([{ 
        id: docRef.id, 
        name: newSiteName.trim(), 
        url: urlTrimmed, 
        created_at: new Date().toISOString() 
      }, ...sites]);
      
      setNewSiteName('');
      setNewSiteUrl('');
      setIsAddModalOpen(false);
      
      // Show success toast
      setToastMessage('Site added successfully ✓');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
    } catch (err: any) {
      console.error('Error saving site:', err);
      setSaveError("Couldn't save your site — please try again");
    } finally {
      setSavingSite(false);
    }
  };

  const navLinks = [
    { name: 'My Sites', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Notifications', path: '/dashboard/notifications', icon: Bell },
    { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart2 },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'My Sites';
    if (location.pathname === '/dashboard/analytics') return 'Analytics';
    if (location.pathname === '/dashboard/notifications') return 'Notifications';
    if (location.pathname === '/dashboard/settings') return 'Settings';
    if (location.pathname.includes('/dashboard/site/')) return 'Configure Site';
    return 'Dashboard';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream flex font-sans text-charcoal">
      {/* Sidebar (Desktop & Tablet) */}
      <aside className="hidden md:flex w-[60px] lg:w-[240px] hover:w-[240px] bg-white border-r border-sand h-screen fixed left-0 top-0 flex-col z-20 transition-all duration-300 overflow-hidden group">
        <div className="p-6 flex items-center gap-3 min-w-[240px]">
          <div className="w-8 h-8 rounded-full bg-terracotta flex items-center justify-center shrink-0">
            <div className="w-3 h-3 bg-cream rounded-full"></div>
          </div>
          <span className="font-syne text-2xl tracking-tight mt-1 opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity">poplo</span>
        </div>

        <nav className="flex-1 px-2 lg:px-4 group-hover:px-4 py-4 space-y-1 overflow-hidden">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors min-w-[200px] min-h-[44px] ${
                  isActive 
                    ? 'bg-cream text-charcoal border-l-4 border-terracotta' 
                    : 'text-muted hover:bg-sand/30 hover:text-charcoal border-l-4 border-transparent'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-2 lg:p-4 group-hover:p-4 border-t border-sand overflow-hidden">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-3 w-full rounded-xl font-medium text-muted hover:bg-sand/30 hover:text-charcoal transition-colors min-w-[200px] min-h-[44px]"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#EDE8DF] h-[64px] flex justify-around items-center z-50 px-2 pb-safe">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px] ${
                isActive ? 'text-[#C1572B]' : 'text-[#7A7168]'
              }`}
            >
              <Icon className="w-6 h-6" />
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="md:ml-[60px] lg:ml-[240px] flex-1 flex flex-col min-h-screen pb-[64px] md:pb-0 transition-all duration-300">
        {/* Top bar */}
        <header className="h-16 sm:h-20 px-4 sm:px-10 flex items-center justify-between border-b border-sand/50 bg-cream/80 backdrop-blur-sm sticky top-0 z-10">
          <h1 className="font-syne text-xl sm:text-2xl font-bold truncate pr-4">{getPageTitle()}</h1>
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-sand flex items-center justify-center text-charcoal font-bold uppercase overflow-hidden text-sm sm:text-base">
              {user.email?.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-10 flex-1">
          <Routes>
            <Route path="/" element={
              loadingSites ? (
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
                    <div className="h-5 w-48 bg-[#EDE8DF] animate-pulse rounded"></div>
                    <div className="h-11 w-32 bg-[#EDE8DF] animate-pulse rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white border border-sand rounded-[20px] p-5 sm:p-6 shadow-sm">
                        <div className="h-6 w-3/4 bg-[#EDE8DF] animate-pulse rounded mb-2"></div>
                        <div className="h-4 w-1/2 bg-[#EDE8DF] animate-pulse rounded mb-6"></div>
                        <div className="h-4 w-24 bg-[#EDE8DF] animate-pulse rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : sites.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center mt-20">
                  <div className="w-32 h-32 bg-white border border-sand rounded-full flex items-center justify-center mb-8 shadow-sm">
                    <Globe className="w-12 h-12 text-terracotta/40" />
                  </div>
                  <h2 className="font-syne font-bold text-3xl mb-4">Add your first site</h2>
                  <p className="text-muted mb-8">
                    Connect your website to start showing real-time social proof and boost your conversions.
                  </p>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-terracotta text-white px-8 py-3.5 rounded-full font-medium hover:bg-[#A84A23] transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Add site
                  </button>
                </div>
              ) : fetchError ? (
                <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center mt-20">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <X className="w-8 h-8" />
                  </div>
                  <p className="text-charcoal font-medium">{fetchError}</p>
                  <button 
                    onClick={() => fetchSites(user.id)}
                    className="mt-4 text-terracotta font-medium hover:text-[#A84A23]"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
                    <p className="text-muted text-sm sm:text-base">Manage your connected websites.</p>
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-terracotta text-white px-6 py-2.5 rounded-full font-medium hover:bg-[#A84A23] transition-colors flex items-center justify-center gap-2 text-sm w-full sm:w-auto min-h-[44px]"
                    >
                      <Plus className="w-4 h-4" /> Add site
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {sites.map(site => (
                      <div key={site.id} className="bg-white border border-sand rounded-[20px] p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="font-syne font-bold text-lg sm:text-xl mb-1 truncate">{site.name}</h3>
                        <p className="text-muted text-xs sm:text-sm mb-2 truncate">{site.url}</p>
                        <p className="text-muted text-[12px] mb-4 sm:mb-6">Added {new Date(site.created_at || Date.now()).toLocaleDateString()}</p>
                        <button 
                          onClick={() => navigate(`/dashboard/site/${site.id}`, { state: { site } })}
                          className="text-terracotta font-medium hover:text-[#A84A23] transition-colors flex items-center gap-1 text-sm min-h-[44px]"
                        >
                          Configure <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            } />
            <Route path="/site/:id" element={<SiteConfigure />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </main>

      {/* Add Site Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden relative shadow-2xl">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted hover:text-charcoal transition-colors rounded-full hover:bg-sand/30"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-8">
              <h2 className="font-syne font-bold text-2xl mb-6">Add new site</h2>
              <form onSubmit={handleAddSite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1.5 ml-1">Site Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. My Awesome SaaS" 
                    value={newSiteName}
                    onChange={(e) => { setNewSiteName(e.target.value); setNameError(''); }}
                    className={`w-full px-5 py-3.5 rounded-full border-2 ${nameError ? 'border-[#C1572B]' : 'border-[#D4C9B8] focus:border-terracotta'} focus:outline-none transition-colors font-sans text-charcoal placeholder:text-muted`}
                  />
                  {nameError && <p className="text-[#C1572B] text-xs mt-1.5 ml-1 font-sans">{nameError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1.5 ml-1">Site URL</label>
                  <input 
                    type="text" 
                    placeholder="https://example.com" 
                    value={newSiteUrl}
                    onChange={(e) => { setNewSiteUrl(e.target.value); setUrlError(''); }}
                    className={`w-full px-5 py-3.5 rounded-full border-2 ${urlError ? 'border-[#C1572B]' : 'border-[#D4C9B8] focus:border-terracotta'} focus:outline-none transition-colors font-sans text-charcoal placeholder:text-muted`}
                  />
                  {urlError && <p className="text-[#C1572B] text-xs mt-1.5 ml-1 font-sans">{urlError}</p>}
                </div>
                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={savingSite}
                    className="w-full bg-terracotta text-white py-3.5 rounded-full font-medium hover:bg-[#A84A23] transition-colors disabled:opacity-70 flex items-center justify-center min-h-[52px]"
                  >
                    {savingSite ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      "Save site"
                    )}
                  </button>
                  {saveError && (
                    <p className="text-[#C1572B] text-[13px] font-sans text-center mt-3">{saveError}</p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 bg-charcoal text-white px-6 py-3.5 rounded-full shadow-2xl font-sans text-sm font-medium z-50 flex items-center gap-3 border border-white/10"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
