import React from 'react';
import { CourseRecord } from '../types';
import { BookOpen, Check, X, AlertCircle } from 'lucide-react';

interface TranscriptTableProps {
  courses: CourseRecord[];
}

const TranscriptTable: React.FC<TranscriptTableProps> = ({ courses }) => {
  const sortedCourses = [...courses].sort((a, b) => {
    if (a.semester && b.semester) return a.semester.localeCompare(b.semester);
    return 0;
  });

  const renderStatusIcon = (status: string | boolean | undefined, type: 'warning' | 'success') => {
    const val = String(status).toLowerCase();
    
    if (val === 'yes' || val === 'true') {
      return (
        <div className="flex justify-center">
          <div className={`${type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'} rounded-full p-1 shadow-sm`}>
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>
      );
    }
    
    if (val === 'no' || val === 'false') {
      return (
        <div className="flex justify-center">
          <div className="bg-rose-50 text-rose-400 rounded-full p-1">
            <X className="w-3.5 h-3.5" />
          </div>
        </div>
      );
    }

    return <span className="text-slate-300">-</span>;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 bg-white border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 flex items-center gap-2.5 text-lg">
          <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
             <BookOpen className="w-5 h-5" />
          </div>
          المقررات التدريبية
        </h3>
        <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 rounded-full text-slate-600 border border-slate-200">
          عدد المقررات: {courses.length}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold text-right text-[11px] tracking-wider">رمز المقرر</th>
              <th className="px-6 py-4 font-bold text-right text-[11px] tracking-wider">اسم المقرر</th>
              <th className="px-6 py-4 font-bold text-center text-[11px] tracking-wider">الوحدات المعتمدة للمقرر</th>
              <th className="px-4 py-4 font-bold text-center text-[11px] tracking-wider w-36 bg-emerald-50/50 text-emerald-700 border-l border-slate-100">
                حالة المقرر/ مستوفى
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedCourses.map((course, index) => {
              const isProject = course.courseName.includes('المشروع الإنتاجي');

              return (
                <tr key={index} className="hover:bg-slate-50/80 transition-colors group">
                   <td className="px-6 py-4 font-mono text-slate-500 font-semibold whitespace-nowrap text-xs">
                    {course.courseCode || '-'}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">
                    {course.courseName}
                    {isProject && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/50 shadow-sm w-fit">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        غير محسوب ضمن الخطة حالياً
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-center font-mono font-medium">
                    {course.credits || '-'}
                  </td>

                  {/* Column: Completed (Mustawfi) */}
                  <td className="px-4 py-4 text-center border-l border-slate-50 bg-emerald-50/10 group-hover:bg-emerald-50/20 transition-colors">
                     {renderStatusIcon(course.isCompleted, 'success')}
                  </td>
                </tr>
              );
            })}
            {courses.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <BookOpen className="w-8 h-8 opacity-20" />
                    <p>لا توجد مقررات مسجلة لهذا المتدرب.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TranscriptTable;