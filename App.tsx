import React, { useState, useEffect, ReactNode, ErrorInfo } from 'react';
import { Search, RotateCcw, User, FileText, ChevronRight, Hash, Phone, Building, Info, Award, Calendar, GraduationCap, Lock, ShieldCheck, LogIn, ArrowRight, UserCog, X, FileSpreadsheet, Eye, EyeOff, Code, Users, Cloud, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import FileUpload from './components/FileUpload';
import TranscriptTable from './components/TranscriptTable';
import { parseExcelData } from './services/excelService';
import { uploadTraineeData, fetchTraineeData } from './services/firebase';
import { TraineeProfile, AppState } from './types';

const SUPERVISOR_PASSWORD = '0558882711';

// Error Boundary
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 text-center bg-gray-50">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md border border-red-100">
             <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
               <WifiOff className="w-8 h-8" />
             </div>
             <h2 className="text-xl font-bold text-gray-800 mb-2">عذراً، حدث خطأ غير متوقع</h2>
             <p className="text-gray-500 mb-6">يرجى تحديث الصفحة والمحاولة مرة أخرى.</p>
             <button onClick={() => window.location.reload()} className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition">
               تحديث الصفحة
             </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SEARCH);
  const [trainees, setTrainees] = useState<TraineeProfile[]>([]);
  const [currentTrainee, setCurrentTrainee] = useState<TraineeProfile | null>(null);
  const [searchId, setSearchId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Server Status
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  
  // Supervisor Auth
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      setServerStatus('checking');
      try {
        const data = await fetchTraineeData();
        if (data && Array.isArray(data)) {
          setTrainees(data);
        }
        setServerStatus('connected');
      } catch (err) {
        console.error("Failed to load data", err);
        setServerStatus('disconnected');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadData();

    const handleOnline = () => setServerStatus('connected');
    const handleOffline = () => setServerStatus('disconnected');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setAppState(AppState.SEARCH);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleFileProcessed = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const parsedData = await parseExcelData(file);
      if (parsedData.length === 0) {
        setError("لم يتم العثور على بيانات صالحة. تأكد من صحة الملف.");
        setIsProcessing(false);
        return;
      } 
      await uploadTraineeData(parsedData);
      setTrainees(parsedData);
      setServerStatus('connected');
      setError(null);
      alert('تم رفع البيانات وحفظها في السيرفر بنجاح.');
    } catch (err) {
      console.error(err);
      setServerStatus('disconnected');
      setError("حدث خطأ أثناء معالجة أو رفع الملف.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchId.trim();
    if (!term) return;

    const found = trainees.find(t => {
      if (t.id === term) return true;
      const mobileMatch = Object.entries(t.details).some(([key, value]) => {
        const k = key.toLowerCase();
        const v = String(value).trim();
        const isMobileKey = k.includes('جوال') || k.includes('phone') || k.includes('mobile') || k.includes('هاتف');
        return isMobileKey && v.includes(term);
      });
      return mobileMatch;
    });

    if (found) {
      setCurrentTrainee(found);
      setAppState(AppState.VIEW);
      setError(null);
    } else {
      setError("لم يتم العثور على بيانات تطابق البحث (رقم تدريبي أو جوال).");
    }
  };

  const resetSearch = () => {
    setSearchId('');
    setCurrentTrainee(null);
    setAppState(AppState.SEARCH);
    setError(null);
  };

  const openSupervisorLogin = () => {
    setShowLoginModal(true);
    setLoginError('');
    setPasswordInput('');
    setShowPassword(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === SUPERVISOR_PASSWORD) {
      setShowLoginModal(false);
      setAppState(AppState.UPLOAD);
      setSearchId('');
      setCurrentTrainee(null);
      setError(null);
    } else {
      setLoginError('كلمة المرور غير صحيحة');
    }
  };

  const exitSupervisorMode = () => {
    setAppState(AppState.SEARCH);
    setError(null);
  };

  const getDetailIcon = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes('جوال') || k.includes('phone')) return <Phone className="w-5 h-5" />;
    if (k.includes('قسم') || k.includes('تخصص')) return <Building className="w-5 h-5" />;
    if (k.includes('معدل') || k.includes('gpa')) return <Award className="w-5 h-5" />;
    if (k.includes('فصل') || k.includes('semesters')) return <Calendar className="w-5 h-5" />;
    if (k.includes('وحدات') || k.includes('credits')) return <Hash className="w-5 h-5" />;
    if (k.includes('حالة') || k.includes('status')) return <User className="w-5 h-5" />;
    if (k.includes('مرشد') || k.includes('advisor')) return <User className="w-5 h-5" />;
    return <Info className="w-5 h-5" />;
  };

  const getSortedDetails = (details: Record<string, string | number>) => {
    const preferredOrder = [
      'القسم', 'التخصص', 'حالة المتدرب', 'فصل القبول', 'عدد الفصول',
      'المرشد الأكاديمي', 'رقم الهاتف الجوال', 'المعدل التراكمي', 'وصف المستوى',
      'عدد المقررات المطلوبة للبرنامج', 'عدد الوحدات المعتمده للبرنامج',
      'عدد المقررات المنجزه للبرنامج', 'عدد الوحدات المنجزه للبرنامج'
    ];
    const sortedEntries: [string, string | number][] = [];
    const remainingEntries = { ...details };

    preferredOrder.forEach(orderKey => {
      const foundKey = Object.keys(remainingEntries).find(k => k.trim() === orderKey.trim() || k.includes(orderKey));
      if (foundKey) {
        sortedEntries.push([foundKey, remainingEntries[foundKey]]);
        delete remainingEntries[foundKey];
      }
    });

    Object.entries(remainingEntries).forEach(entry => sortedEntries.push(entry));
    return sortedEntries;
  };

  return (
    <ErrorBoundary>
    <div className="flex flex-col min-h-screen" dir="rtl">
      
      {/* PROFESSIONAL HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20 print:hidden shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24 items-center">
            
            {/* Logo Section */}
            <div className="flex items-center gap-5">
              <div className="hidden sm:flex relative items-center justify-center w-14 h-14 bg-gradient-to-tr from-primary-700 to-primary-900 rounded-2xl shadow-lg text-white transform hover:rotate-3 transition-transform duration-300">
                <GraduationCap className="h-8 w-8" />
                <div className="absolute inset-0 border-2 border-white/20 rounded-2xl"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-primary-600 tracking-wide mb-1 uppercase opacity-90">الكلية التقنية بالطائف</span>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-none tracking-tight">نظام السجل التدريبي</h1>
                <div className="flex mt-1.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
                    قسم التقنية الميكانيكية
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-3">
              {appState !== AppState.UPLOAD ? (
                <button 
                  onClick={openSupervisorLogin}
                  className="group flex items-center justify-center w-11 h-11 text-slate-400 hover:text-primary-600 bg-transparent hover:bg-primary-50 rounded-xl transition-all duration-200 border border-transparent hover:border-primary-100"
                  title="دخول المشرفين"
                >
                  <UserCog className="w-6 h-6 transform group-hover:scale-110 transition-transform" />
                </button>
              ) : (
                <button 
                  onClick={exitSupervisorMode}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-200 border border-slate-200 hover:border-red-500"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">خروج المشرف</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 print:py-0 print:max-w-none">
        
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg shadow-sm flex items-center gap-3 animate-fade-in-up">
            <Info className="w-5 h-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* LOADING */}
        {isLoadingData && appState === AppState.SEARCH && (
           <div className="flex flex-col items-center justify-center py-24 animate-pulse">
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-5">
               <RefreshCw className="w-10 h-10 text-primary-500 animate-spin" />
             </div>
             <p className="text-slate-400 font-medium text-lg">جاري تهيئة النظام...</p>
           </div>
        )}

        {/* --- VIEW: UPLOAD DASHBOARD --- */}
        {appState === AppState.UPLOAD && (
          <div className="animate-fade-in-up space-y-8">
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-2xl font-bold text-slate-800">لوحة تحكم المشرف</h2>
                  <p className="text-slate-500 mt-1">إدارة بيانات المتدربين وتحديث السجلات</p>
               </div>
               
               {/* Server Status Indicator */}
               <div className={`flex items-center gap-3 px-4 py-2 rounded-full border shadow-sm ${
                 serverStatus === 'connected' ? 'bg-white border-green-200 text-green-700' : 
                 serverStatus === 'disconnected' ? 'bg-white border-red-200 text-red-700' : 
                 'bg-white border-yellow-200 text-yellow-700'
               }`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${serverStatus === 'connected' ? 'bg-green-500' : serverStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                  <span className="text-xs font-bold">
                    {serverStatus === 'connected' ? 'متصل بالسيرفر' : serverStatus === 'disconnected' ? 'غير متصل' : 'جاري الاتصال'}
                  </span>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Instructions Panel */}
               <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <h3 className="font-bold text-slate-700">دليل تنسيق الملفات</h3>
                 </div>
                 
                 <div className="p-6">
                    <div className="mb-6 bg-blue-50 border-blue-200 border px-4 py-3 rounded-xl flex gap-3 items-start">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-bold text-blue-800 text-sm mb-1">تنويه هام</h4>
                        <p className="text-sm text-blue-700/80 leading-relaxed">
                          تم تصميم النظام ليعمل بكفاءة مع تقرير <strong>SH06</strong> من نظام رايات. يرجى استخراج التقرير بصيغة Excel دون تعديل الأعمدة الأساسية.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="relative pl-4 border-r-2 border-slate-200 pr-4">
                        <strong className="block text-slate-800 mb-2 text-sm">1. البيانات الأساسية المطلوبة:</strong>
                        <div className="flex flex-wrap gap-2">
                          {['الرقم التدريبي', 'اسم المتدرب', 'القسم', 'التخصص', 'الجوال', 'المعدل'].map(tag => (
                            <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">{tag}</span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="relative pl-4 border-r-2 border-slate-200 pr-4">
                         <strong className="block text-slate-800 mb-2 text-sm">2. بيانات المقررات (الأعمدة):</strong>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-2.5 rounded border border-slate-100 text-xs">
                               <span className="font-semibold block mb-1 text-slate-700">رمز المقرر / اسم المقرر</span>
                               <span className="text-slate-400">مثال: ENG 101 / لغة انجليزية</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded border border-slate-100 text-xs">
                               <span className="font-semibold block mb-1 text-slate-700">الوحدات المعتمدة للمقرر</span>
                               <span className="text-slate-400">هام: يجب تطابق الاسم تماماً</span>
                            </div>
                         </div>
                      </div>
                    </div>
                 </div>
               </div>

               {/* Stats & Upload Panel */}
               <div className="space-y-6">
                  {/* Count Card */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">إجمالي المسجلين</p>
                      <h3 className="text-3xl font-black text-slate-800">{isLoadingData ? '-' : trainees.length}</h3>
                    </div>
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Warning Card */}
                  <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200/60">
                     <h4 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2">
                       <Cloud className="w-4 h-4" />
                       وضع الاستبدال الكلي
                     </h4>
                     <p className="text-xs text-amber-700/80 leading-relaxed">
                       عند رفع ملف جديد، سيقوم النظام <span className="font-bold underline">بمسح كافة البيانات القديمة</span> واستبدالها بالبيانات الجديدة. هذه العملية لا يمكن التراجع عنها.
                     </p>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-1">
                    <FileUpload onFileProcessed={handleFileProcessed} isProcessing={isProcessing} />
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* --- VIEW: SEARCH (HERO) --- */}
        {appState === AppState.SEARCH && !isLoadingData && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in-up">
            
            <div className="relative w-full max-w-2xl mx-auto">
              {/* Decorative Blur */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl -z-10"></div>
              
              <div className="bg-white/70 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/50 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-800"></div>
                
                <div className="w-20 h-20 bg-gradient-to-br from-primary-50 to-white rounded-2xl border border-primary-100 flex items-center justify-center mx-auto mb-6 shadow-sm transform rotate-3 hover:rotate-0 transition-all duration-500">
                  <Search className="w-10 h-10 text-primary-600" />
                </div>
                
                <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">استعراض السجل التدريبي</h2>
                
                {trainees.length > 0 ? (
                  <>
                    <p className="text-slate-500 mb-8 text-lg max-w-md mx-auto leading-relaxed">
                       أدخل الرقم التدريبي أو رقم الجوال للوصول السريع إلى بيانات السجل الأكاديمي.
                    </p>
                    <form onSubmit={handleSearch} className="max-w-md mx-auto relative group">
                      <div className="relative transform transition-transform duration-300 focus-within:scale-105">
                        <input
                          type="text"
                          value={searchId}
                          onChange={(e) => setSearchId(e.target.value)}
                          placeholder="الرقم التدريبي أو رقم الجوال..."
                          className="w-full px-6 py-4 pr-14 rounded-2xl bg-white border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all text-right shadow-sm text-lg placeholder-slate-400 text-slate-800"
                          autoFocus
                        />
                        <Hash className="absolute right-5 top-5 text-slate-400 group-focus-within:text-primary-500 transition-colors w-6 h-6" />
                      </div>
                      
                      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 px-2 gap-2">
                        <span>مثال: 4239xxxxx</span>
                        <span className="text-primary-600 bg-primary-50 px-2 py-1 rounded">بدون صفر للجوال (55xxxxx)</span>
                      </div>

                      <button
                        type="submit"
                        className="mt-6 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary-200 hover:shadow-primary-300 active:scale-95 text-lg"
                      >
                        عرض السجل الآن
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="py-8 px-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-600 text-sm font-medium mb-4">
                       <Cloud className="w-4 h-4" />
                       <span>قاعدة البيانات فارغة</span>
                    </div>
                    <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                      لم يتم رفع أي بيانات بعد. يرجى من المشرف تسجيل الدخول ورفع ملف السجل التدريبي لبدء العمل.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <p className="mt-8 text-slate-400 text-sm font-medium">نظام آمن ومحمي لبيانات المتدربين</p>
          </div>
        )}

        {/* --- VIEW: TRAINEE DETAILS --- */}
        {appState === AppState.VIEW && currentTrainee && (
          <div className="animate-fade-in-up pb-10">
            {/* Navigation */}
            <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between no-print">
               <button 
                  onClick={resetSearch}
                  className="group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-700 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 hover:border-primary-200"
                >
                  <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                  العودة للبحث
                </button>
                
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-all shadow-md hover:shadow-lg text-sm font-bold"
                >
                  <FileText className="w-4 h-4" />
                  طباعة / PDF
                </button>
            </div>

            {/* Student Profile Card */}
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
              {/* Card Header */}
              <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-right">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2 tracking-tight">{currentTrainee.name}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-300 text-sm font-medium font-mono">
                      <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                        <Hash className="w-4 h-4" />
                        {currentTrainee.id}
                      </span>
                      {currentTrainee.details['القسم'] && (
                        <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                           <Building className="w-4 h-4" />
                           {currentTrainee.details['القسم']}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="p-8 bg-white">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  البيانات الأكاديمية والشخصية
                </h3>
                
                {Object.keys(currentTrainee.details).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {getSortedDetails(currentTrainee.details).map(([key, value]) => {
                      if(key === 'القسم') return null; // Already shown in header
                      return (
                        <div key={key} className="group bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-100 hover:border-primary-100 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary-600 group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors">
                               {getDetailIcon(key)}
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase">{key}</span>
                          </div>
                          <div className="pr-11 text-slate-800 font-bold text-sm break-words leading-relaxed">
                            {value}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Transcript Table */}
            <div className="max-w-6xl mx-auto">
              <TranscriptTable courses={currentTrainee.courses} />
            </div>
            
            <div className="mt-8 text-center text-xs text-slate-400 print:mt-12">
              وثيقة إلكترونية مستخرجة من نظام السجل التدريبي - الكلية التقنية بالطائف
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
             <GraduationCap className="w-5 h-5 text-primary-600" />
             <span>نظام السجل التدريبي</span>
           </div>
           
           <div className="flex flex-col items-center md:items-end gap-1">
             <div className="flex items-center gap-2 text-sm bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <Code className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">تصميم وتطوير:</span>
                <span className="text-primary-700 font-bold">م. عبدالله الزهراني</span>
             </div>
             <p className="text-[10px] text-slate-400 pr-1">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
           </div>
        </div>
      </footer>

      {/* MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 border border-white/20">
            <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-600" />
                دخول المشرفين
              </h3>
              <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleLoginSubmit}>
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">كلمة المرور</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-left text-slate-800 placeholder-slate-400 font-mono"
                      placeholder="••••••••"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {loginError && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg">
                      <Info className="w-3 h-3" />
                      {loginError}
                    </div>
                  )}
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-slate-200"
                >
                  تسجيل الدخول
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
};

export default App;