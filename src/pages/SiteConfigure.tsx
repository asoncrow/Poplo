import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronDown, UploadCloud, Copy, CheckCircle2, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, setDoc, doc, addDoc, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

export default function SiteConfigure() {
  const navigate = useNavigate();
  const location = useLocation();
  const site = location.state?.site || { id: 'demo', name: 'My Website', url: 'https://example.com' };

  const [type, setType] = useState('signup');
  const [template, setTemplate] = useState('{{name}} from {{city}} just signed up');
  const [position, setPosition] = useState('bottom-left');
  const [theme, setTheme] = useState('light');
  const [delay, setDelay] = useState(3);
  const [interval, setInterval] = useState(8);

  const [dataSourceMode, setDataSourceMode] = useState<'csv' | 'seed'>('csv');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [minActions, setMinActions] = useState(5);
  const [maxActions, setMaxActions] = useState(20);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingData, setIsSavingData] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoadingConfig(true);
      setFetchError('');
      try {
        const qConfig = query(collection(db, 'site_configs'), where('siteId', '==', site.id));
        const configSnap = await getDocs(qConfig);
        let configData: any = null;

        if (!configSnap.empty) {
          configData = configSnap.docs[0].data();
          setType(configData.notificationType || 'signup');
          setTemplate(configData.messageTemplate || '{{name}} from {{city}} just signed up');
          setPosition(configData.position || 'bottom-left');
          setTheme(configData.theme || 'light');
          setDelay(configData.delaySeconds ?? 3);
          setInterval(configData.intervalSeconds ?? 8);
          setMinActions(configData.minDaily ?? 5);
          setMaxActions(configData.maxDaily ?? 20);
        }

        const qEvents = query(collection(db, 'notification_events'), where('siteId', '==', site.id));
        const eventsSnap = await getDocs(qEvents);
        const eventsData = eventsSnap.docs.map(d => d.data());

        if (eventsData && eventsData.length > 0) {
          setDataSourceMode('csv');
          setCsvData(eventsData);
        } else if (configData && (configData.minDaily !== undefined || configData.maxDaily !== undefined)) {
          setDataSourceMode('seed');
        }

      } catch (err: any) {
        console.error('Error fetching config:', err);
        setFetchError("Couldn't load your data — refresh to try again");
      } finally {
        setIsLoadingConfig(false);
      }
    };

    if (site.id !== 'demo') {
      fetchConfig();
    } else {
      setIsLoadingConfig(false);
    }
  }, [site.id]);

  const embedCode = `<script src="${window.location.origin}/ticker.js" data-site-id="${site.id}"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleTestConnection = () => {
    showNotification("Listening for your site… we'll notify you when the script is detected.", 'info');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').map(row => row.split(','));
      if (rows.length < 2) return;
      
      const headers = rows[0].map(h => h.trim().toLowerCase());
      const parsedData = rows.slice(1).filter(row => row.length === headers.length).map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index]?.trim();
        });
        return obj;
      });
      
      setCsvData(parsedData);
    };
    reader.readAsText(file);
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      if (!auth.currentUser) {
        showNotification("You must be logged in to save.", 'error');
        return;
      }

      const qConfig = query(collection(db, 'site_configs'), where('siteId', '==', site.id));
      const configSnap = await getDocs(qConfig);
      
      const data = {
        siteId: site.id,
        notificationType: type,
        messageTemplate: template,
        position,
        theme,
        delaySeconds: delay,
        intervalSeconds: interval,
        updatedAt: new Date().toISOString(),
      };

      if (!configSnap.empty) {
        await setDoc(doc(db, 'site_configs', configSnap.docs[0].id), data, { merge: true });
      } else {
        await addDoc(collection(db, 'site_configs'), data);
      }

      showNotification("Changes saved", 'success');
    } catch (error: any) {
      console.error("Error saving config:", error);
      showNotification("Save failed — please try again", 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSaveData = async () => {
    setIsSavingData(true);
    try {
      if (!auth.currentUser) {
        showNotification("You must be logged in to save.", 'error');
        return;
      }

      if (dataSourceMode === 'csv') {
        if (csvData.length > 0) {
          // Delete existing events for this site
          const qEvents = query(collection(db, 'notification_events'), where('siteId', '==', site.id));
          const eventsSnap = await getDocs(qEvents);
          
          const batch = writeBatch(db);
          eventsSnap.docs.forEach(d => batch.delete(d.ref));
          
          // Insert new events
          csvData.forEach(row => {
            const newRef = doc(collection(db, 'notification_events'));
            batch.set(newRef, {
              siteId: site.id,
              name: row.name || '',
              city: row.city || '',
              action: row.action || '',
              timestamp: row.timestamp || '',
              createdAt: new Date().toISOString()
            });
          });
          
          await batch.commit();
        }
      } else {
        const qConfig = query(collection(db, 'site_configs'), where('siteId', '==', site.id));
        const configSnap = await getDocs(qConfig);
        
        const data = {
          siteId: site.id,
          minDaily: minActions,
          maxDaily: maxActions,
          updatedAt: new Date().toISOString(),
        };

        if (!configSnap.empty) {
          await setDoc(doc(db, 'site_configs', configSnap.docs[0].id), data, { merge: true });
        } else {
          await addDoc(collection(db, 'site_configs'), data);
        }
      }

      showNotification("Data source saved", 'success');
    } catch (error: any) {
      console.error("Error saving data source:", error);
      showNotification("Save failed — please try again", 'error');
    } finally {
      setIsSavingData(false);
    }
  };

  const previewText = template
    .replace(/{{name}}/gi, 'Jake')
    .replace(/{{city}}/gi, 'Austin');

  if (isLoadingConfig) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-4 w-24 bg-[#EDE8DF] animate-pulse rounded"></div>
        </div>
        <div className="mb-8">
          <div className="h-8 w-64 bg-[#EDE8DF] animate-pulse rounded mb-2"></div>
          <div className="h-5 w-48 bg-[#EDE8DF] animate-pulse rounded"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          <div className="space-y-10">
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i}>
                  <div className="h-4 w-32 bg-[#EDE8DF] animate-pulse rounded mb-2"></div>
                  <div className="h-11 w-full bg-[#EDE8DF] animate-pulse rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="h-[500px] w-full bg-[#EDE8DF] animate-pulse rounded-[20px]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-5xl mx-auto h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <X className="w-8 h-8" />
        </div>
        <p className="text-charcoal font-medium">{fetchError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 text-terracotta font-medium hover:text-[#A84A23]"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <button 
        onClick={() => navigate('/dashboard')} 
        className="flex items-center gap-2 text-muted hover:text-charcoal transition-colors mb-6 font-medium text-sm min-h-[44px] px-2 -ml-2 rounded-lg hover:bg-sand/30 w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Back to sites
      </button>
      
      <div className="mb-8 px-2 sm:px-0">
        <h2 className="font-syne font-bold text-2xl sm:text-3xl text-charcoal mb-1 truncate">{site.name}</h2>
        <p className="text-muted text-sm sm:text-base truncate">{site.url}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 px-2 sm:px-0">
        {/* Left Column - Form */}
        <div className="space-y-10">
          
          {/* Configurator Section */}
          <div className="space-y-6">
            {/* Notification Type */}
            <div>
            <label className="block text-sm font-medium text-charcoal mb-2 ml-1">Notification type</label>
            <div className="relative">
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 rounded-[12px] border-2 border-[#D4C9B8] focus:border-terracotta focus:outline-none transition-colors font-sans text-charcoal bg-white appearance-none pr-10 min-h-[44px]"
              >
                <option value="signup">Recent signup</option>
                <option value="purchase">Recent purchase</option>
                <option value="active">Active visitors</option>
                <option value="custom">Custom message</option>
              </select>
              <ChevronDown className="w-5 h-5 text-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Message Template */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2 ml-1">Message template</label>
            <input 
              type="text"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-4 py-3 rounded-[12px] border-2 border-[#D4C9B8] focus:border-terracotta focus:outline-none transition-colors font-sans text-charcoal min-h-[44px]"
            />
            <p className="text-xs text-muted mt-2 ml-1">Use {"{{name}}"} and {"{{city}}"} as variables.</p>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2 ml-1">Position</label>
            <div className="flex p-1 bg-[#E8E3D9] rounded-full">
              <button 
                onClick={() => setPosition('bottom-left')}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] ${position === 'bottom-left' ? 'bg-white shadow-sm text-charcoal' : 'text-muted hover:text-charcoal'}`}
              >
                Bottom left
              </button>
              <button 
                onClick={() => setPosition('bottom-right')}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] ${position === 'bottom-right' ? 'bg-white shadow-sm text-charcoal' : 'text-muted hover:text-charcoal'}`}
              >
                Bottom right
              </button>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2 ml-1">Theme</label>
            <div className="flex p-1 bg-[#E8E3D9] rounded-full">
              <button 
                onClick={() => setTheme('light')}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] ${theme === 'light' ? 'bg-white shadow-sm text-charcoal' : 'text-muted hover:text-charcoal'}`}
              >
                Light
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] ${theme === 'dark' ? 'bg-white shadow-sm text-charcoal' : 'text-muted hover:text-charcoal'}`}
              >
                Dark
              </button>
            </div>
          </div>

          {/* Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2 ml-1">Delay before first show (s)</label>
              <input 
                type="number"
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-[12px] border-2 border-[#D4C9B8] focus:border-terracotta focus:outline-none transition-colors font-sans text-charcoal min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2 ml-1">Time between (s)</label>
              <input 
                type="number"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-[12px] border-2 border-[#D4C9B8] focus:border-terracotta focus:outline-none transition-colors font-sans text-charcoal min-h-[44px]"
              />
            </div>
          </div>
          <button 
            onClick={handleSaveConfig}
            disabled={isSavingConfig}
            className="w-full bg-terracotta text-white py-3.5 rounded-full font-medium hover:bg-[#A84A23] transition-colors mt-8 disabled:opacity-70 min-h-[44px] flex items-center justify-center"
          >
            {isSavingConfig ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Save changes'
            )}
          </button>
          </div>

          {/* Data Source Section */}
          <div className="space-y-6 pt-6 border-t border-sand">
            <h3 className="font-syne font-bold text-xl text-charcoal">Data source</h3>
            
            {/* Mode Toggle */}
            <div className="flex p-1 bg-[#E8E3D9] rounded-full w-full sm:w-fit">
              <button 
                onClick={() => setDataSourceMode('csv')}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] ${dataSourceMode === 'csv' ? 'bg-terracotta text-white shadow-sm' : 'text-muted hover:text-charcoal'}`}
              >
                Upload CSV
              </button>
              <button 
                onClick={() => setDataSourceMode('seed')}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] ${dataSourceMode === 'seed' ? 'bg-terracotta text-white shadow-sm' : 'text-muted hover:text-charcoal'}`}
              >
                Seed data
              </button>
            </div>

            {dataSourceMode === 'csv' ? (
              <div className="space-y-4">
                {csvData.length === 0 ? (
                  <div 
                    className="border-2 border-dashed border-[#D4C9B8] rounded-[16px] p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-sand/10 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="w-8 h-8 text-terracotta mb-3" />
                    <p className="font-sans text-charcoal font-medium">Drop your CSV here or click to upload</p>
                    <p className="font-sans text-sm text-muted mt-1">Format: name, city, action, timestamp</p>
                    <input 
                      type="file" 
                      accept=".csv" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="border border-sand rounded-[16px] overflow-hidden">
                      <div className="max-h-[200px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-cream sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-3 font-sans font-medium text-xs text-muted uppercase tracking-wider border-b border-sand">Name</th>
                              <th className="px-4 py-3 font-sans font-medium text-xs text-muted uppercase tracking-wider border-b border-sand">City</th>
                              <th className="px-4 py-3 font-sans font-medium text-xs text-muted uppercase tracking-wider border-b border-sand">Action</th>
                              <th className="px-4 py-3 font-sans font-medium text-xs text-muted uppercase tracking-wider border-b border-sand">Time</th>
                            </tr>
                          </thead>
                          <tbody className="font-sans text-[13px] text-charcoal">
                            {csvData.map((row, i) => (
                              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'}>
                                <td className="px-4 py-2.5 border-b border-sand/50">{row.name || '-'}</td>
                                <td className="px-4 py-2.5 border-b border-sand/50">{row.city || '-'}</td>
                                <td className="px-4 py-2.5 border-b border-sand/50">{row.action || '-'}</td>
                                <td className="px-4 py-2.5 border-b border-sand/50">{row.timestamp || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <button 
                      onClick={() => setCsvData([])}
                      className="text-sm text-muted hover:text-terracotta transition-colors mt-3 inline-block font-medium"
                    >
                      Clear data
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2 ml-1">Min daily actions</label>
                    <input 
                      type="number"
                      value={minActions}
                      onChange={(e) => setMinActions(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-[12px] border-2 border-[#D4C9B8] focus:border-terracotta focus:outline-none transition-colors font-sans text-charcoal min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2 ml-1">Max daily actions</label>
                    <input 
                      type="number"
                      value={maxActions}
                      onChange={(e) => setMaxActions(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-[12px] border-2 border-[#D4C9B8] focus:border-terracotta focus:outline-none transition-colors font-sans text-charcoal min-h-[44px]"
                    />
                  </div>
                </div>
                <p className="font-sans text-[12px] text-muted ml-1">
                  Poplo will generate realistic activity within this range while you build real traction.
                </p>
                <div className="bg-sand/30 rounded-xl p-4 mt-2">
                  <p className="font-sans text-xs text-charcoal/80 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta"></span>
                    Always be transparent with your audience about simulated activity.
                  </p>
                </div>
              </div>
            )}
            
            <button 
              onClick={handleSaveData}
              disabled={isSavingData}
              className="w-full bg-charcoal text-white py-3.5 rounded-full font-medium hover:bg-charcoal/90 transition-colors mt-6 disabled:opacity-70 min-h-[44px] flex items-center justify-center"
            >
              {isSavingData ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Save data source'
              )}
            </button>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div>
          <div className="bg-white rounded-[20px] border border-sand shadow-sm h-[500px] relative overflow-hidden flex flex-col">
            <div className="p-4 border-b border-sand bg-cream/30">
              <span className="font-sans font-medium text-sm text-muted">Preview</span>
            </div>
            
            <div className="flex-1 bg-[#FDFBF9] relative p-6">
              {/* Fake website content to give context */}
              <div className="max-w-sm opacity-40">
                <div className="w-3/4 h-8 bg-sand rounded-lg mb-4"></div>
                <div className="w-full h-4 bg-sand rounded-full mb-2"></div>
                <div className="w-5/6 h-4 bg-sand rounded-full mb-8"></div>
                <div className="w-32 h-10 bg-sand rounded-full"></div>
              </div>

              {/* The Notification Bubble */}
              <div className={`absolute bottom-6 ${position === 'bottom-left' ? 'left-6' : 'right-6'} transition-all duration-500`}>
                <div className={`border rounded-[16px] p-3 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.05)] flex items-center gap-3 relative pr-10 min-w-[280px] transition-colors ${theme === 'dark' ? 'bg-charcoal border-charcoal text-white' : 'bg-white border-sand text-charcoal'}`}>
                  {/* pulsing dot */}
                  <div className="absolute top-3 right-3 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </div>
                  
                  {/* icon */}
                  <div className="w-10 h-10 rounded-xl bg-terracotta flex items-center justify-center flex-shrink-0 text-white">
                    <div className="w-4 h-4 border-2 border-white/80 rounded-sm"></div>
                  </div>
                  
                  {/* text */}
                  <div className="flex flex-col text-left">
                    <span className={`font-sans font-semibold text-[13px] leading-tight ${theme === 'dark' ? 'text-white' : 'text-charcoal'}`}>
                      {previewText}
                    </span>
                    <span className={`font-sans font-normal text-[11px] mt-0.5 ${theme === 'dark' ? 'text-white/70' : 'text-muted'}`}>
                      just now
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Install Section */}
      <div className="mt-12 sm:mt-16 bg-charcoal rounded-[20px] p-6 sm:p-7 md:p-10 mx-2 sm:mx-0">
        <h2 className="font-syne font-bold text-xl sm:text-2xl text-white mb-2">Your embed code</h2>
        <p className="font-sans text-[13px] text-[#D4C9B8] mb-6 sm:mb-8">
          Paste this before the closing &lt;/body&gt; tag on your site.
        </p>

        <div className="bg-[#2E2A26] rounded-[12px] p-4 md:px-5 md:py-4 relative mb-6 sm:mb-8 group flex flex-col sm:block">
          <pre className="font-mono text-xs sm:text-sm text-[#D4C9B8] overflow-x-auto whitespace-pre sm:whitespace-pre-wrap sm:break-all pb-4 sm:pb-0 sm:pr-28">
            {embedCode}
          </pre>
          <button 
            onClick={handleCopy}
            className="sm:absolute sm:top-3 sm:right-3 bg-terracotta text-white px-4 py-3 sm:py-1.5 rounded-full text-sm sm:text-xs font-medium hover:bg-[#A84A23] transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0 min-h-[44px] sm:min-h-0"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <Copy className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
            {copied ? 'Copied!' : 'Copy code'}
          </button>
        </div>

        <ul className="space-y-3 mb-8 sm:mb-10">
          <li className="flex items-start gap-3 text-white font-sans text-sm">
            <span className="text-terracotta font-bold mt-0.5">✓</span>
            Works on Webflow, Framer, Carrd, Wordpress and any HTML site
          </li>
          <li className="flex items-start gap-3 text-white font-sans text-sm">
            <span className="text-terracotta font-bold mt-0.5">✓</span>
            Changes you make in Poplo update instantly — no re-pasting needed
          </li>
          <li className="flex items-start gap-3 text-white font-sans text-sm">
            <span className="text-terracotta font-bold mt-0.5">✓</span>
            Async loaded — zero impact on your page speed
          </li>
        </ul>

        <button 
          onClick={handleTestConnection}
          className="border-2 border-white text-white px-6 py-2.5 rounded-full font-medium text-sm hover:bg-white/10 transition-colors w-full sm:w-auto min-h-[44px]"
        >
          Test connection
        </button>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 right-8 text-white px-6 py-3.5 rounded-full shadow-2xl font-sans text-sm font-medium z-50 flex items-center gap-3 border border-white/10 ${
              toastType === 'error' ? 'bg-red-600' : 'bg-charcoal'
            }`}
          >
            {toastType === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
            {toastType === 'info' && <div className="w-2 h-2 rounded-full bg-terracotta animate-pulse"></div>}
            {toastType === 'error' && <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>}
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
