
import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, User, FileText, ChevronRight, Hash, Phone, Building, Info, Award, Calendar, GraduationCap, Lock, ShieldCheck, LogIn, ArrowRight, UserCog, X, FileSpreadsheet, Eye, EyeOff, Code, Users, Cloud, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import FileUpload from './components/FileUpload';
import TranscriptTable from './components/TranscriptTable';
import { parseExcelData } from './services/excelService';
import { uploadTraineeData, fetchTraineeData } from './services/firebase';
import { TraineeProfile, AppState } from './types';

const SUPERVISOR_PASSWORD = '0558882711';

// Error Boundary for basic runtime safety
interface ErrorBoundaryProps {
  children?: React.ReactNode;
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

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-600">
          حدث خطأ غير متوقع. يرجى تحديث الصفحة.
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
  
  // Server Connection Status
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  
  // Supervisor Auth State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Load data from Firebase on mount
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
        console.error("Failed to load data from cloud", err);
        setServerStatus('disconnected');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    // Initial Load
    loadData();

    // Network Listeners for real-time updates
    const handleOnline = () => setServerStatus('connected');
    const handleOffline = () => setServerStatus('disconnected');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Always start in SEARCH mode
    setAppState(AppState.SEARCH);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle Excel/CSV Upload & Save to Firebase
  const handleFileProcessed = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      // 1. Parse Local File
      const parsedData = await parseExcelData(file);
      
      if (parsedData.length === 0) {
        setError("لم يتم العثور على بيانات صالحة في الملف. تأكد من وجود أعمدة (الرقم، الاسم) وبيانات صحيحة.");
        setIsProcessing(false);
        return;
      } 

      // 2. Upload to Firebase (Replaces old data)
      await uploadTraineeData(parsedData);
      
      // 3. Update State
      setTrainees(parsedData);
      setServerStatus('connected'); // Confirm connection on success
      setError(null);
      alert('تم رفع البيانات وحفظها في السيرفر بنجاح.');

    } catch (err) {
      console.error(err);
      setServerStatus('disconnected'); // Assume connection issue on upload fail
      setError("حدث خطأ أثناء معالجة أو رفع الملف. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchId.trim();
    if (!term) return;

    const found = trainees.find(t => {
      // 1. Check ID (Exact match)
      if (t.id === term) return true;
      
      // 2. Check Name (Partial match)
      if (t.name.includes(term)) return true;

      // 3. Check Mobile Number (Search inside details)
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
      setError("لم يتم العثور على بيانات تطابق البحث (رقم تدريبي، اسم، أو جوال).");
    }
  };

  const resetSearch = () => {
    setSearchId('');
    setCurrentTrainee(null);
    setAppState(AppState.SEARCH);
    setError(null);
  };

  // Supervisor Actions
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
      // Switch to UPLOAD mode (Supervisor Dashboard)
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

  // Helper to render icon based on key keywords
  const getDetailIcon = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes('جوال') || k.includes('phone') || k.includes('mobile')) return <Phone className="w-4 h-4" />;
    if (k.includes('قسم') || k.includes('تخصص') || k.includes('major') || k.includes('dept')) return <Building className="w-4 h-4" />;
    if (k.includes('معدل') || k.includes('gpa')) return <Award className="w-4 h-4" />;
    if (k.includes('فصل') || k.includes('semesters')) return <Calendar className="w-4 h-4" />;
    if (k.includes('وحدات') || k.includes('credits')) return <Hash className="w-4 h-4" />;
    if (k.includes('حالة') || k.includes('status')) return <User className="w-4 h-4" />;
    if (k.includes('مرشد') || k.includes('advisor')) return <User className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  // Function to sort details based on the exact user-provided header order
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
      const foundKey = Object.keys(remainingEntries).find(k => 
        k.trim() === orderKey.trim() || k.includes(orderKey)
      );
      if (foundKey) {
        sortedEntries.push([foundKey, remainingEntries[foundKey]]);
        delete remainingEntries[foundKey];
      }
    });

    Object.entries(remainingEntries).forEach(entry => {
      sortedEntries.push(entry);
    });

    return sortedEntries;
  };

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Right Side: Logo & Institution Info */}
            <div className="flex items-center gap-4">
              {/* Back Button for View Mode */}
              {appState === AppState.VIEW && (
                <button 
                  onClick={resetSearch}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors"
                  title="العودة للقائمة"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-2.5 rounded-xl shadow-md text-white">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary-600 tracking-wider mb-0.5">الكلية التقنية بالطائف</span>
                  <h1 className="text-xl font-bold text-gray-900 leading-none mb-1">نظام السجل التدريبي</h1>
                  <div className="flex items-center">
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-200">
                      قسم التقنية الميكانيكية
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Side: Supervisor Control (Server Status moved to UPLOAD view) */}
            <div className="flex items-center gap-3">
              
              {/* Only show Supervisor Icon if NOT in upload mode (to login) */}
              {appState !== AppState.UPLOAD ? (
                <button 
                  onClick={openSupervisorLogin}
                  className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                  title="دخول المشرفين"
                >
                  <UserCog className="w-6 h-6" />
                </button>
              ) : (
                <button 
                  onClick={exitSupervisorMode}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>خروج المشرف</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-0 print:max-w-none">
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <span className="font-bold">تنبيه:</span> {error}
          </div>
        )}

        {/* Loading State for Initial Data Fetch */}
        {isLoadingData && appState === AppState.SEARCH && (
           <div className="flex flex-col items-center justify-center py-20 animate-pulse">
             <div className="bg-gray-100 p-4 rounded-full mb-4">
               <RefreshCw className="w-8 h-8 text-primary-400 animate-spin" />
             </div>
             <p className="text-gray-500 font-medium">جاري الاتصال بقاعدة البيانات...</p>
           </div>
        )}

        {/* MODE: SUPERVISOR UPLOAD */}
        {appState === AppState.UPLOAD && (
          <div className="animate-fade-in-up">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
               {/* Instructions Card */}
               <div className="lg:col-span-2 bg-white border border-blue-100 rounded-xl shadow-sm p-6">
                 <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2 text-lg">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                    تعليمات تنسيق ملف البيانات (Excel/CSV)
                 </h3>

                 {/* Note about SH06 Report */}
                 <div className="mb-6 bg-blue-50 border-r-4 border-blue-500 p-4 rounded-l-md">
                   <p className="text-sm text-blue-800 font-medium leading-relaxed">
                     <Info className="w-4 h-4 inline-block ml-2 -mt-1" />
                     تنويه هام: يعتمد هذا البرنامج بشكل أساسي على ملف تقرير <strong>SH06</strong> المستخرج من نظام رايات. يرجى التأكد من استخدامه لضمان دقة البيانات.
                   </p>
                 </div>

                 <div className="text-sm text-gray-700 space-y-3">
                   <p>لضمان قراءة البيانات بشكل صحيح، يرجى التأكد من احتواء الملف على الأعمدة التالية بنفس المسميات:</p>
                   
                   <div className="space-y-4">
                     <div>
                       <strong className="block text-gray-900 mb-1">1. البيانات الشخصية والأكاديمية:</strong>
                       <p className="bg-gray-50 p-2 rounded border border-gray-100 text-xs leading-relaxed">
                         القسم، التخصص، حالة المتدرب، فصل القبول، عدد الفصول، المرشد الأكاديمي، رقم الهاتف الجوال، المعدل التراكمي، وصف المستوى
                       </p>
                     </div>

                     <div>
                       <strong className="block text-gray-900 mb-1">2. إحصائيات البرنامج التدريبي:</strong>
                       <p className="bg-gray-50 p-2 rounded border border-gray-100 text-xs leading-relaxed">
                         عدد المقررات المطلوبة للبرنامج، عدد الوحدات المعتمده للبرنامج، عدد المقررات المنجزه للبرنامج، عدد الوحدات المنجزه للبرنامج
                       </p>
                     </div>

                     <div>
                       <strong className="block text-gray-900 mb-1">3. بيانات المقررات (لكل مادة):</strong>
                       <ul className="list-disc list-inside bg-gray-50 p-2 rounded border border-gray-100 text-xs space-y-1">
                         <li><span className="font-semibold">رمز المقرر</span> (مثال: ENG 101)</li>
                         <li><span className="font-semibold">إسم المقرر</span> (مثال: لغة إنجليزية)</li>
                         <li><span className="font-semibold">الوحدات المعتمدة للمقرر</span> (هام: يجب استخدام هذا المسمى بدقة)</li>
                         <li><span className="font-semibold">حالة المقرر/ مستوفى</span> (القيمة: نعم/مستوفي أو لا/غير مستوفي)</li>
                       </ul>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Warning/Upload Action */}
               <div className="lg:col-span-1 space-y-6">
                  
                  {/* Server Status for Supervisor */}
                  <div className={`flex items-center justify-between p-3 rounded-xl border ${
                    serverStatus === 'connected' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : serverStatus === 'disconnected'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}>
                    <span className="text-xs font-bold">حالة السيرفر:</span>
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      {serverStatus === 'connected' ? (
                        <>
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                          </span>
                          <span>متصل</span>
                        </>
                      ) : serverStatus === 'disconnected' ? (
                        <>
                          <WifiOff className="w-3.5 h-3.5" />
                          <span>غير متصل</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري الاتصال...</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stats Card for Supervisor */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary-500" />
                        المتدربين المسجلين
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {isLoadingData ? '...' : 'العدد الحالي في النظام'}
                      </p>
                    </div>
                    <div className="bg-primary-50 text-primary-700 font-bold text-xl px-4 py-2 rounded-lg border border-primary-100 min-w-[3rem] text-center">
                      {isLoadingData ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : trainees.length}
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-yellow-100 p-2 rounded-full shrink-0">
                        <Cloud className="w-5 h-5 text-yellow-700" />
                      </div>
                      <div>
                        <h3 className="font-bold text-yellow-800 text-sm mb-1">المزامنة السحابية</h3>
                        <p className="text-xs text-yellow-700 leading-relaxed">
                          أنت الآن في وضع التحكم. رفع ملف جديد سيؤدي إلى <strong>مسح واستبدال</strong> جميع البيانات الموجودة على السيرفر (Firebase).
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <FileUpload onFileProcessed={handleFileProcessed} isProcessing={isProcessing} />
               </div>
            </div>
          </div>
        )}

        {/* MODE: SEARCH (PUBLIC) */}
        {appState === AppState.SEARCH && !isLoadingData && (
          <div className="max-w-md mx-auto mt-20 animate-fade-in-up">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">استعراض السجل التدريبي للمتدرب</h2>
              
              {trainees.length > 0 ? (
                <>
                  <p className="text-gray-500 mb-8">
                     أدخل الرقم التدريبي أو رقم الجوال للعرض.
                  </p>
                  <form onSubmit={handleSearch} className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="الرقم التدريبي، الاسم، أو رقم الجوال..."
                        className="w-full px-5 py-3 pr-12 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-right"
                        autoFocus
                      />
                      <Hash className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                    </div>
                    <div className="text-xs text-gray-400 text-right pr-1 space-y-1">
                      <div>مثال: 4239...</div>
                      <div className="text-primary-600 font-medium">ملاحظة: عند البحث برقم الجوال يرجى ادخاله بدون صفر (مثال: 558...)</div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
                    >
                      عرض السجل
                    </button>
                  </form>
                </>
              ) : (
                <div className="py-4">
                  <p className="text-gray-500 mb-4">
                    لا توجد بيانات متاحة حالياً على السيرفر.
                  </p>
                  <div className="text-sm text-gray-400 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    لرفع البيانات، يرجى تسجيل الدخول من خلال أيقونة المشرف 
                    <UserCog className="w-4 h-4 inline mx-1 align-middle" /> 
                    في أعلى الصفحة.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE: VIEW TRAINEE */}
        {appState === AppState.VIEW && currentTrainee && (
          <div className="animate-fade-in-up">
            {/* Breadcrumb / Back */}
            <button 
              onClick={resetSearch}
              className="mb-6 flex items-center text-sm text-gray-500 hover:text-primary-600 transition-colors print:hidden"
            >
              <ArrowRight className="w-4 h-4 ml-1" />
              العودة لقائمة البحث
            </button>

            {/* Student Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600"></div>
              
              <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-gray-400">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{currentTrainee.name}</h1>
                    <div className="flex items-center gap-2 text-gray-500 mt-1 font-mono">
                      <Hash className="w-4 h-4" />
                      <span>{currentTrainee.id}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 items-end">
                   {/* Print Button */}
                   <button 
                    onClick={() => window.print()}
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium print:hidden w-full md:w-auto justify-center"
                   >
                    <FileText className="w-4 h-4" />
                    طباعة السجل / حفظ صيغة PDF
                   </button>
                </div>
              </div>

              {/* Dynamic Student Details Grid - Sorted */}
              {Object.keys(currentTrainee.details).length > 0 && (
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                  {getSortedDetails(currentTrainee.details).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">
                        {getDetailIcon(key)}
                        {key}
                      </div>
                      <div className="text-gray-900 font-medium truncate" title={String(value)}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transcript Table */}
            <TranscriptTable courses={currentTrainee.courses} />
            
            <div className="mt-8 text-center text-xs text-gray-400 print:mt-12">
              تم استخراج هذا التقرير آلياً من نظام السجل التدريبي
            </div>
          </div>
        )}
      </main>

      {/* Footer / Developer Credit */}
      <footer className="mt-auto border-t border-gray-200 bg-white py-6 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-2 text-gray-500">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Code className="w-4 h-4 text-primary-500" />
            <span>تصميم وتطوير:</span>
            <span className="text-gray-900 font-bold">المهندس / عبدالله الزهراني</span>
          </div>
          <p className="text-xs text-gray-400">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
        </div>
      </footer>

      {/* Supervisor Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-600" />
                تسجيل دخول المشرف
              </h3>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleLoginSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-left"
                    placeholder="••••••••"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {loginError && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{loginError}</p>
                )}
              </div>
              
              <button 
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg transition-colors"
              >
                دخول
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
};

export default App;
