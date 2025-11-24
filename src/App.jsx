import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  FileText, 
  Youtube, 
  ArrowLeft, 
  Save, 
  Trash2, 
  Play, 
  Download,
  FolderOpen,
  MonitorPlay,
  Pencil,
  X,
  AlertTriangle,
  Server
} from 'lucide-react';

// --- CONFIG ---
const API_URL = 'http://localhost:3001/courses';

// --- Helper Functions ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const processYouTubeInput = (input) => {
  if (!input) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = input.match(regExp);
  const id = (match && match[2].length === 11) ? match[2] : null;
  
  if (id) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `https://www.youtube.com/embed/${id}?origin=${origin}&modestbranding=1&rel=0`;
  }
  if (input.includes('<iframe')) {
    const srcMatch = input.match(/src=["']([^"']+)["']/);
    if (srcMatch) return srcMatch[1];
  }
  return input;
};

// --- SUB-COMPONENTS ---

// 1. Dashboard View
const Dashboard = ({ courses, loading, dbConnected, onRefresh }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const openModal = (course = null) => {
    if (course) {
      setEditingId(course.id);
      setCourseForm({ title: course.title, description: course.description });
    } else {
      setEditingId(null);
      setCourseForm({ title: '', description: '' });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!courseForm.title) return;
    try {
      if (editingId) {
        await fetch(`${API_URL}/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(courseForm)
        });
      } else {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: generateId(),
            ...courseForm,
            lessons: []
          })
        });
      }
      onRefresh();
      setShowModal(false);
    } catch (err) { alert("Failed to save course"); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`${API_URL}/${deleteId}`, { method: 'DELETE' });
      onRefresh();
      setDeleteId(null);
    } catch (err) { alert("Failed to delete course"); }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading courses...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Your Courses</h2>
        <button 
          onClick={() => openModal()}
          disabled={!dbConnected}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition disabled:opacity-50"
        >
          <Plus className="h-5 w-5 mr-1" /> Create Course
        </button>
      </div>

      {!dbConnected && (
         <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-800 mb-6">
           <div className="flex justify-center mb-2"><Server size={32} /></div>
           <h3 className="font-bold">SQLite Server Not Running</h3>
           <p className="text-sm mt-2">Run in terminal: <code className="bg-red-100 px-2 py-1 rounded font-mono">node server.js</code></p>
         </div>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <FolderOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">
            {dbConnected ? "No courses yet. Create one!" : "Connect to DB to see courses."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div 
              key={course.id} 
              onClick={() => navigate(`/course/${course.id}`)}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition cursor-pointer group relative"
            >
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition bg-white/90 p-1 rounded shadow-sm z-10">
                <button 
                  onClick={(e) => { e.stopPropagation(); openModal(course); }}
                  className="text-gray-500 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setDeleteId(course.id); }}
                  className="text-gray-500 hover:text-red-600 p-1 rounded hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <BookOpen size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2 pr-12">{course.title}</h3>
              <p className="text-gray-500 text-sm line-clamp-2 h-10">{course.description || "No description provided."}</p>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-400">
                <span>{course.lessons?.length || 0} Lessons</span>
                <span className="text-indigo-600 font-medium group-hover:underline">Open Course &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">{editingId ? 'Edit Course' : 'Create New Course'}</h3>
            <input 
              type="text" placeholder="Course Name"
              className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})}
            />
            <textarea 
              placeholder="Short Description"
              className="w-full border border-gray-300 rounded-lg p-3 mb-6 focus:ring-2 focus:ring-indigo-500 outline-none h-24"
              value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 px-4 py-2">Cancel</button>
              <button onClick={handleSave} disabled={!courseForm.title} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
             <AlertTriangle size={24} className="mx-auto mb-4 text-red-600" />
             <h3 className="text-lg font-bold mb-2">Delete Course?</h3>
             <p className="text-gray-500 mb-6">This cannot be undone.</p>
             <div className="flex justify-center gap-3">
               <button onClick={() => setDeleteId(null)} className="bg-gray-200 px-4 py-2 rounded-lg">Cancel</button>
               <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg">Delete</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 2. Course Details View
const CourseDetail = ({ courses, loading, onRefresh, dbConnected }) => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', type: 'youtube', content: '', fileName: '' });
  const [editingId, setEditingId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const course = courses.find(c => c.id === courseId);

  const openModal = (lesson = null) => {
    setUploadStatus('');
    if (lesson) {
      setEditingId(lesson.id);
      setLessonForm({ title: lesson.title, type: lesson.type, content: lesson.content, fileName: lesson.fileName || '' });
      if(lesson.type === 'file') setUploadStatus('File preserved');
    } else {
      setEditingId(null);
      setLessonForm({ title: '', type: 'youtube', content: '', fileName: '' });
    }
    setShowModal(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { 
      alert('File too large (Max 10MB)'); return;
    }
    setUploadStatus('Uploading...');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLessonForm(p => ({ ...p, content: ev.target.result, fileName: file.name }));
      setUploadStatus(`Loaded: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!lessonForm.title || !lessonForm.content) return;
    const finalContent = lessonForm.type === 'youtube' ? processYouTubeInput(lessonForm.content) : lessonForm.content;
    const lessonData = { ...lessonForm, content: finalContent };
    
    let updatedLessons;
    if (editingId) {
      updatedLessons = course.lessons.map(l => l.id === editingId ? { ...l, ...lessonData } : l);
    } else {
      updatedLessons = [...(course.lessons || []), { id: generateId(), ...lessonData }];
    }

    try {
      await fetch(`${API_URL}/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons: updatedLessons })
      });
      onRefresh();
      setShowModal(false);
    } catch (err) { alert("Failed to save lesson"); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const updatedLessons = course.lessons.filter(l => l.id !== deleteId);
    try {
      await fetch(`${API_URL}/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons: updatedLessons })
      });
      onRefresh();
      setDeleteId(null);
    } catch (err) { alert("Failed to delete lesson"); }
  };

  if (loading) return <div className="p-10">Loading...</div>;
  if (!course) return <div className="p-10 text-center">Course not found (ID: {courseId})</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/')} className="text-gray-500 hover:text-indigo-600 flex items-center gap-1">
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{course.title}</h2>
          <p className="text-gray-500 mt-1">{course.description}</p>
        </div>
        <button 
          onClick={() => openModal()}
          disabled={!dbConnected}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm disabled:opacity-50"
        >
          <Plus className="h-5 w-5 mr-1" /> Add Lesson
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-700 ml-1">Lessons</h3>
        {(!course.lessons || course.lessons.length === 0) ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
            No lessons yet.
          </div>
        ) : (
          course.lessons.map((lesson, idx) => (
            <div key={lesson.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-300 flex justify-between items-center shadow-sm transition">
              <div className="flex items-center gap-4 flex-1">
                <span className="bg-gray-100 text-gray-500 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">{idx + 1}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{lesson.title}</h4>
                  <span className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    {lesson.type === 'youtube' ? <Youtube size={12}/> : <FileText size={12}/>}
                    {lesson.type}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(`/course/${courseId}/lesson/${lesson.id}`)} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                  <Play size={16} /> Start
                </button>
                <div className="flex items-center border-l pl-2 ml-2 border-gray-200 gap-1">
                  <button onClick={() => openModal(lesson)} className="p-2 text-gray-400 hover:text-indigo-600"><Pencil size={16}/></button>
                  <button onClick={() => setDeleteId(lesson.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lesson Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4">{editingId ? 'Edit Lesson' : 'Add Lesson'}</h3>
            <input 
              type="text" placeholder="Lesson Title"
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})}
            />
            <div className="flex mb-4 bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setLessonForm(p => ({...p, type: 'youtube', content: ''}))} className={`flex-1 py-2 rounded-md text-sm font-medium ${lessonForm.type === 'youtube' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>YouTube</button>
              <button onClick={() => setLessonForm(p => ({...p, type: 'file', content: ''}))} className={`flex-1 py-2 rounded-md text-sm font-medium ${lessonForm.type === 'file' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>Upload File</button>
            </div>
            {lessonForm.type === 'youtube' ? (
               <input type="text" placeholder="Paste YouTube Link" className="w-full border border-gray-300 rounded-lg p-3" value={lessonForm.content} onChange={e => setLessonForm({...lessonForm, content: e.target.value})} />
            ) : (
              <div className="mb-6 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input type="file" onChange={handleFileUpload} />
                <div className="mt-2 text-sm text-green-600">{uploadStatus}</div>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowModal(false)} className="text-gray-500">Cancel</button>
              <button onClick={handleSave} disabled={!lessonForm.title || !lessonForm.content} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Lesson Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
             <AlertTriangle size={24} className="mx-auto mb-4 text-red-600" />
             <h3 className="text-lg font-bold mb-2">Delete Lesson?</h3>
             <div className="flex justify-center gap-3 mt-4">
               <button onClick={() => setDeleteId(null)} className="bg-gray-200 px-4 py-2 rounded-lg">Cancel</button>
               <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg">Delete</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Lesson Player View
const LessonPlayer = ({ courses, loading }) => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  
  if (loading) return <div>Loading...</div>;
  
  const course = courses.find(c => c.id === courseId);
  if (!course) return <div>Course not found</div>;
  
  const lesson = course.lessons?.find(l => l.id === lessonId);
  if (!lesson) return <div>Lesson not found</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(`/course/${courseId}`)} className="text-gray-500 hover:text-indigo-600 flex items-center gap-1">
        <ArrowLeft size={18} /> Back to Course
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold">{lesson.title}</h2>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{lesson.type.toUpperCase()}</span>
        </div>
        <div className="bg-black min-h-[400px] flex items-center justify-center relative">
          {lesson.type === 'youtube' ? (
            <div className="w-full h-[500px]">
              <iframe
                width="100%" height="100%" src={lesson.content}
                title="YouTube player" frameBorder="0" allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              ></iframe>
            </div>
          ) : (
            <div className="text-center p-10 w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white">
              <MonitorPlay size={64} className="mb-4 text-indigo-400" />
              {lesson.content.startsWith('data:image') ? (
                <img src={lesson.content} alt="Resource" className="max-h-[400px] object-contain" />
              ) : (
                <a href={lesson.content} download={lesson.fileName || "resource"} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2">
                  <Download size={20} /> Download / Open File
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP (ROUTER) ---

export default function App() {
  const [courses, setCourses] = useState([]);
  const [dbConnected, setDbConnected] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCourses(data);
      setDbConnected(true);
    } catch (error) {
      console.error(error);
      setDbConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleExportData = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Course ID,Course Name,Lesson Name,Type,Content Link\n";
    courses.forEach(course => {
      course.lessons?.forEach(lesson => {
        let displayContent = lesson.type === 'file' ? '[File Data]' : lesson.content;
        csvContent += `${course.id},"${course.title}","${lesson.title}",${lesson.type},"${displayContent}"\n`;
      });
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "study_db.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
        <header className="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-10">
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6" />
            <h1 className="text-xl font-bold">My Study Platform</h1>
          </Link>
          <div className="flex items-center gap-4">
             {!dbConnected && <div className="flex items-center gap-1 bg-red-500 px-2 py-1 rounded text-xs font-bold"><AlertTriangle size={14} /> DB Offline</div>}
             <button onClick={handleExportData} className="text-xs bg-indigo-700 hover:bg-indigo-800 px-3 py-1 rounded flex items-center gap-1">
               <Download size={14} /> Export DB
             </button>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard courses={courses} loading={loading} dbConnected={dbConnected} onRefresh={fetchCourses} />} />
            <Route path="/course/:courseId" element={<CourseDetail courses={courses} loading={loading} dbConnected={dbConnected} onRefresh={fetchCourses} />} />
            <Route path="/course/:courseId/lesson/:lessonId" element={<LessonPlayer courses={courses} loading={loading} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}