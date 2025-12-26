import React, { useState, useEffect } from 'react';
import { CameraIcon, BoxIcon, CalendarIcon, StarIcon, MapPinIcon, UserIcon } from './components/Icons';
import EventBoard from './components/EventBoard';
import ResourceLibrary from './components/ResourceLibrary';
import Schedule from './components/Schedule';
import ThemeTimeline from './components/ThemeTimeline';
import LocationLibrary from './components/LocationLibrary';
import MakeupLibrary from './components/MakeupLibrary';
import { PhotographyEvent, ResourceItem, ResourceCategory, ThemePlan, LocationPartner, MakeupArtist } from './types';

// --- 配置区域 ---
// 你可以在这里修改访问密码
const ACCESS_CODE = "lvsensen118"; 
// ----------------

// Mock initial data
const INITIAL_EVENTS: PhotographyEvent[] = [
  {
    id: '1',
    title: '初夏森林写真',
    date: new Date(Date.now() + 86400000 * 3).toISOString(),
    location: '奥林匹克森林公园北园',
    description: '捕捉夏日的第一缕阳光，主打清新自然风格。',
    status: 'UPCOMING' as any,
    requiredResources: []
  }
];

const INITIAL_RESOURCES: ResourceItem[] = [
  { 
    id: '101', 
    name: '日系学生制服(L)', 
    category: ResourceCategory.COSTUME, 
    description: '深蓝色西装外套+格子裙', 
    totalQuantity: 2, 
    availableQuantity: 2, 
    imageUrl: 'https://picsum.photos/200/200?random=1', 
    images: ['https://picsum.photos/200/200?random=1'],
    displayAspect: 'portrait',
    location: 'A区衣柜', 
    itemCode: 'C-001' 
  },
  { 
    id: '102', 
    name: '复古手提箱', 
    category: ResourceCategory.PROP, 
    description: '棕色皮质，适合复古风', 
    totalQuantity: 1, 
    availableQuantity: 1, 
    imageUrl: 'https://picsum.photos/200/200?random=2', 
    images: ['https://picsum.photos/200/200?random=2'],
    displayAspect: 'square',
    location: '道具间B2' 
  },
];

// --- Login Component ---
const LoginScreen = ({ onLogin }: { onLogin: (code: string) => void }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(code);
    setError(true); 
  };

  const handleClearCache = () => {
    if (confirm('⚠️ 警告：这将清空所有本地保存的数据（活动、资源、图片等），用于修复程序卡死或白屏问题。\n\n确定要重置吗？')) {
      localStorage.clear();
      alert('缓存已清空，页面将刷新。');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-emerald-100">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          🌲
        </div>
        <h1 className="text-2xl font-bold text-emerald-900 mb-2">绿森林摄影活动管理</h1>
        <p className="text-gray-500 mb-8 text-sm">内部管理系统，请输入访问口令进入</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(false); }}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition text-center text-lg tracking-widest"
              placeholder="请输入访问口令"
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-sm">口令错误，请联系管理员获取</p>}
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
          >
            解锁进入
          </button>
        </form>
        
        <div className="mt-8 border-t border-gray-100 pt-4">
             <button 
               onClick={handleClearCache}
               className="text-xs text-gray-400 hover:text-red-500 underline"
             >
               如果页面卡死或白屏，点此重置数据
             </button>
        </div>

        <div className="mt-2 text-xs text-gray-400">
          &copy; Green Forest Photography
        </div>
      </div>
    </div>
  );
};

// Helper for safe storage
const useSafeStorage = (key: string, data: any) => {
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e: any) {
      console.error(`Save failed for ${key}`, e);
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        alert("⚠️ 存储空间不足！无法保存最新数据。\n\n原因：图片太多或太大。\n解决：请删除一些不用的旧数据（如旧活动、旧资源），或减少上传图片的数量。");
      }
    }
  }, [key, data]);
};

// Helper to safely load data with try-catch to prevent white screen crashes
const loadFromStorage = (key: string, initialValue: any) => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return initialValue;
    return JSON.parse(saved);
  } catch (error) {
    console.error(`Error loading ${key}, resetting to default.`, error);
    // If JSON is corrupt (e.g. truncated due to quota), return initial value to avoid crash
    return initialValue;
  }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<'events' | 'resources' | 'schedule' | 'themes' | 'locations' | 'makeup'>('events');
  
  // Data State - Now using loadFromStorage helper
  const [events, setEvents] = useState<PhotographyEvent[]>(() => 
    loadFromStorage('gf_events', INITIAL_EVENTS)
  );

  const [resources, setResources] = useState<ResourceItem[]>(() => 
    loadFromStorage('gf_resources', INITIAL_RESOURCES)
  );

  const [themePlans, setThemePlans] = useState<ThemePlan[]>(() => 
    loadFromStorage('gf_themes', [{month: 1, themes: []}])
  );

  const [locations, setLocations] = useState<LocationPartner[]>(() => 
    loadFromStorage('gf_locations', [])
  );

  const [makeupArtists, setMakeupArtists] = useState<MakeupArtist[]>(() => 
    loadFromStorage('gf_makeup', [])
  );

  // Auth Check on Mount
  useEffect(() => {
    const authStatus = localStorage.getItem('gf_auth_token');
    if (authStatus === 'valid') {
      setIsAuthenticated(true);
    }
  }, []);

  // Persistence with error handling
  useSafeStorage('gf_events', events);
  useSafeStorage('gf_resources', resources);
  useSafeStorage('gf_themes', themePlans);
  useSafeStorage('gf_locations', locations);
  useSafeStorage('gf_makeup', makeupArtists);

  const handleLogin = (code: string) => {
    if (code === ACCESS_CODE) {
      localStorage.setItem('gf_auth_token', 'valid');
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      localStorage.removeItem('gf_auth_token');
      setIsAuthenticated(false);
    }
  };

  const NavItem = ({ view, label, icon: Icon }: any) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        currentView === view 
          ? 'bg-emerald-100 text-emerald-800 font-semibold shadow-inner' 
          : 'text-gray-600 hover:bg-emerald-50'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  // Guard Clause: If not authenticated, show login screen
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-emerald-50 text-gray-800 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="bg-white w-full md:w-64 md:h-screen md:fixed flex-shrink-0 border-r border-emerald-100 shadow-sm z-20 overflow-y-auto flex flex-col justify-between">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-emerald-50 sticky top-0 bg-white z-10">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
              🌲
            </div>
            <h1 className="text-xl font-bold text-emerald-900 tracking-tight">绿森林摄影</h1>
          </div>

          <nav className="p-4 space-y-2">
            <NavItem view="events" label="活动发布" icon={CameraIcon} />
            <NavItem view="schedule" label="活动排期表" icon={CalendarIcon} />
            <NavItem view="resources" label="资源登记" icon={BoxIcon} />
            
            <div className="pt-4 border-t border-emerald-50">
              <p className="px-4 text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">策划与合作</p>
              <NavItem view="themes" label="活动主题推荐" icon={StarIcon} />
              <NavItem view="locations" label="场地资源" icon={MapPinIcon} />
              <NavItem view="makeup" label="化妆师合作" icon={UserIcon} />
            </div>
          </nav>
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-gray-100">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
             退出登录
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto pb-20">
          {currentView === 'events' && <EventBoard events={events} setEvents={setEvents} />}
          {currentView === 'resources' && <ResourceLibrary resources={resources} setResources={setResources} />}
          {currentView === 'schedule' && <Schedule events={events} setEvents={setEvents} />}
          {currentView === 'themes' && <ThemeTimeline plans={themePlans} setPlans={setThemePlans} />}
          {currentView === 'locations' && <LocationLibrary locations={locations} setLocations={setLocations} />}
          {currentView === 'makeup' && <MakeupLibrary artists={makeupArtists} setArtists={setMakeupArtists} />}
        </div>
      </main>
    </div>
  );
}

export default App;