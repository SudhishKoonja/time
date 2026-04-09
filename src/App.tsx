import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, Printer, Calendar, Clock, BookOpen, FileText, Settings, Palette, Type, Layout, List, ChevronDown, Download, X, Wand2, Smartphone, Rows3 } from 'lucide-react';
import html2pdf from 'html2pdf.js';

function getOrdinalNum(n: number) {
  return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
}

function formatDate(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  return `${getOrdinalNum(day)} ${month}`;
}

function formatDay(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('en-GB', { weekday: 'long' });
}

function formatTime(timeString: string) {
  if (!timeString) return '';
  const [hour, minute] = timeString.split(':');
  return `${parseInt(hour, 10)}:${minute}`;
}

function addDays(dateString: string, daysToAdd: number) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
}

type Entry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  paper: string;
};

type Theme = {
  id: string;
  name: string;
  headerBg: string;
  headerText: string;
  borderColor: string;
};

const THEMES: Theme[] = [
  { id: 'classic', name: 'Classic Gold', headerBg: '#eec35a', headerText: '#6b4c0a', borderColor: '#000000' },
  { id: 'minimal', name: 'Minimalist Monochrome', headerBg: '#f3f4f6', headerText: '#111827', borderColor: '#d1d5db' },
  { id: 'blue', name: 'Professional Blue', headerBg: '#dbeafe', headerText: '#1e3a8a', borderColor: '#93c5fd' },
  { id: 'rose', name: 'Soft Pastel Rose', headerBg: '#ffe4e6', headerText: '#881337', borderColor: '#fecdd3' },
  { id: 'dark', name: 'High Contrast', headerBg: '#1f2937', headerText: '#ffffff', borderColor: '#111827' },
  { id: 'mint', name: 'Mint Breeze', headerBg: '#d1fae5', headerText: '#065f46', borderColor: '#6ee7b7' },
  { id: 'sunset', name: 'Warm Sunset', headerBg: '#ffedd5', headerText: '#9a3412', borderColor: '#fdba74' },
];

const FONTS = [
  { id: 'sans', name: 'Inter (Clean & Modern)', value: '"Inter", sans-serif' },
  { id: 'serif', name: 'Playfair Display (Elegant)', value: '"Playfair Display", serif' },
  { id: 'merriweather', name: 'Merriweather (Classic)', value: '"Merriweather", serif' },
  { id: 'outfit', name: 'Outfit (Geometric)', value: '"Outfit", sans-serif' },
  { id: 'mono', name: 'JetBrains Mono (Technical)', value: '"JetBrains Mono", monospace' },
];

const SPACING = [
  { id: 'compact', name: 'Compact', value: 'py-1.5 px-3', fontSize: 'text-[13px]' },
  { id: 'normal', name: 'Comfortable', value: 'py-2.5 px-4', fontSize: 'text-[15px]' },
  { id: 'relaxed', name: 'Spacious', value: 'py-4 px-5', fontSize: 'text-[16px]' },
];

const PREDEFINED_SUBJECTS = [
  'Chemistry',
  'Chemistry(Practical)',
  'Computer Science (M & S)',
  'English General Paper',
  'Mathematics',
  'Physics',
  'Physics(Practical)'
];

const AUTO_FILL_TEMPLATE = [
  { subject: 'English General Paper', papers: ['1', '2'] },
  { subject: 'Computer Science (M & S)', papers: ['1', '2'] },
  { subject: 'Chemistry', papers: ['1', '2', '3', '4', '5'] },
  { subject: 'Physics', papers: ['1', '2', '3', '4', '5'] },
  { subject: 'Mathematics', papers: ['1', '3', '4', '5'] },
];

const SUBJECT_PAPER_OPTIONS: Record<string, string[]> = {
  'English General Paper': ['1', '2'],
  'Computer Science (M & S)': ['1', '2'],
  Chemistry: ['1', '2', '3', '4', '5'],
  Physics: ['1', '2', '3', '4', '5'],
  Mathematics: ['1', '3', '4', '5'],
};

const initialEntries: Entry[] = [
  { id: '1', date: '2025-10-02', startTime: '08:00', endTime: '10:00', subject: 'English General Paper', paper: '2' },
  { id: '2', date: '2025-10-02', startTime: '10:30', endTime: '12:00', subject: 'Computer Science (M & S)', paper: '1' },
  { id: '3', date: '2025-10-07', startTime: '10:30', endTime: '11:45', subject: 'Chemistry', paper: '1' },
  { id: '4', date: '2025-10-10', startTime: '10:30', endTime: '12:00', subject: 'Chemistry(Practical)', paper: '3' },
  { id: '5', date: '2025-10-13', startTime: '10:30', endTime: '11:45', subject: 'Physics', paper: '2' },
  { id: '6', date: '2025-10-14', startTime: '10:00', endTime: '11:45', subject: 'Mathematics', paper: '1' },
  { id: '7', date: '2025-10-16', startTime: '08:00', endTime: '09:50', subject: 'Physics', paper: '1' },
  { id: '8', date: '2025-10-21', startTime: '10:00', endTime: '11:15', subject: 'Physics(Practical)', paper: '3' },
  { id: '9', date: '2025-10-23', startTime: '08:00', endTime: '09:30', subject: 'English General Paper', paper: '1' },
  { id: '10', date: '2025-10-23', startTime: '10:00', endTime: '11:50', subject: 'Mathematics', paper: '3' },
  { id: '11', date: '2025-10-24', startTime: '08:00', endTime: '09:45', subject: 'Chemistry', paper: '2' },
  { id: '12', date: '2025-10-29', startTime: '10:30', endTime: '12:30', subject: 'Physics', paper: '4\\5' },
  { id: '13', date: '2025-10-31', startTime: '08:00', endTime: '10:00', subject: 'Chemistry', paper: '4\\5' },
];

const STORAGE_KEY = 'timetable-studio-v2';

const EntryForm = ({ onAdd }: { onAdd: (entry: Entry) => void }) => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [subject, setSubject] = useState('');
  const [paper, setPaper] = useState('');
  const [subjectsList, setSubjectsList] = useState(PREDEFINED_SUBJECTS);
  const [isCustomSubject, setIsCustomSubject] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = subject.trim();
    if (!date || !startTime || !endTime || !finalSubject || !paper) return;
    
    if (isCustomSubject && !subjectsList.includes(finalSubject)) {
      setSubjectsList(prev => [...prev, finalSubject].sort());
    }

    onAdd({
      id: crypto.randomUUID(),
      date,
      startTime,
      endTime,
      subject: finalSubject,
      paper
    });
    
    setStartTime('');
    setEndTime('');
    setSubject('');
    setPaper('');
    setIsCustomSubject(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Add New Entry</h2>
      
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Start Time</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input 
              type="time" 
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">End Time</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input 
              type="time" 
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Subject</label>
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            {isCustomSubject ? (
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Type custom subject..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                required
                autoFocus
              />
            ) : (
              <>
                <select 
                  value={subject}
                  onChange={(e) => {
                    if (e.target.value === '_custom') {
                      setIsCustomSubject(true);
                      setSubject('');
                    } else {
                      setSubject(e.target.value);
                    }
                  }}
                  className="w-full pl-9 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white appearance-none"
                  required
                >
                  <option value="" disabled>Select a subject</option>
                  {subjectsList.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                  <option value="_custom" className="font-semibold text-indigo-600">+ Add custom subject...</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
              </>
            )}
          </div>
          {isCustomSubject && (
            <button 
              type="button" 
              onClick={() => { setIsCustomSubject(false); setSubject(''); }}
              className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
              title="Cancel custom subject"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Paper</label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input 
            type="text" 
            value={paper}
            onChange={(e) => setPaper(e.target.value)}
            placeholder="e.g. 1 or 4\5"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
            required
          />
        </div>
      </div>

      <button 
        type="submit"
        className="w-full py-2.5 mt-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        <Plus size={16} />
        Add to Timetable
      </button>
    </form>
  );
};

const EntryList = ({ entries, onDelete, onClearAll }: { entries: Entry[], onDelete: (id: string) => void, onClearAll: () => void }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
        <Calendar className="mx-auto text-gray-300 mb-3" size={32} />
        <p className="text-gray-500 text-sm font-medium">No entries yet</p>
        <p className="text-gray-400 text-xs mt-1">Add your first exam above</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Entries</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{entries.length}</span>
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
          >
            Remove all
          </button>
        </div>
      </div>
      
      <div className="space-y-2.5">
        {entries.map(entry => (
          <div key={entry.id} className="flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl shadow-sm group hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md tracking-wide">
                  {formatDate(entry.date)}
                </span>
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Clock size={12} />
                  {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                </span>
              </div>
              <div className="text-sm font-semibold text-gray-900 truncate pr-4">
                {entry.subject} <span className="text-gray-400 font-normal ml-1">Paper {entry.paper}</span>
              </div>
            </div>
            <button 
              onClick={() => onDelete(entry.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
              title="Delete entry"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const HubsMode = ({ entries, onDelete, onClearAll, onAdd }: { entries: Entry[], onDelete: (id: string) => void, onClearAll: () => void, onAdd: (entry: Entry) => void }) => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [subject, setSubject] = useState('Mathematics');
  const [paper, setPaper] = useState('1');

  const grouped = entries.reduce<Record<string, Entry[]>>((acc, entry) => {
    acc[entry.date] = acc[entry.date] || [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  useEffect(() => {
    const options = SUBJECT_PAPER_OPTIONS[subject] ?? ['1'];
    if (!options.includes(paper)) {
      setPaper(options[0]);
    }
  }, [subject, paper]);

  const addFromHubs = () => {
    if (!date || !startTime || !endTime || !subject || !paper) return;

    onAdd({
      id: crypto.randomUUID(),
      date,
      startTime,
      endTime,
      subject,
      paper
    });
  };

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Quick add paper</h2>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
          />
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
          />
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
          >
            {Object.keys(SUBJECT_PAPER_OPTIONS).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select
            value={paper}
            onChange={(e) => setPaper(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
          >
            {(SUBJECT_PAPER_OPTIONS[subject] ?? ['1']).map((item) => (
              <option key={item} value={item}>Paper {item}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={addFromHubs}
          className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg"
        >
          Add paper
        </button>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-md transition-colors"
        >
          Remove all
        </button>
      </div>
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
          No papers yet in Hubs mode.
        </div>
      ) : (
        Object.entries(grouped).map(([date, dateEntries]) => (
          <section key={date} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <header className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
              <p className="text-sm font-semibold text-indigo-900">{formatDay(date)}</p>
              <p className="text-xs text-indigo-700">{formatDate(date)}</p>
            </header>
            <div className="divide-y divide-gray-100">
              {dateEntries.map((entry) => (
                <article key={entry.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{entry.subject}</p>
                    <p className="text-xs text-gray-500">Paper {entry.paper}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(entry.startTime)} - {formatTime(entry.endTime)}</p>
                  </div>
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
};

const AutoFillPapers = ({ onAddMany }: { onAddMany: (entries: Omit<Entry, 'id'>[]) => void }) => {
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [setCount, setSetCount] = useState(1);

  const handleAutofill = () => {
    if (!startDate || !startTime || !endTime || setCount < 1) return;

    const weekDates = Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
    const generated: Omit<Entry, 'id'>[] = [];
    let slot = 0;

    for (let setIndex = 0; setIndex < setCount; setIndex++) {
      AUTO_FILL_TEMPLATE.forEach(({ subject, papers }) => {
        papers.forEach((paper) => {
          generated.push({
            date: weekDates[slot % weekDates.length],
            startTime,
            endTime,
            subject,
            paper: setCount > 1 ? `${paper} (Set ${setIndex + 1})` : paper
          });
          slot++;
        });
      });
    }

    onAddMany(generated);
  };

  const totalPapersPerSet = AUTO_FILL_TEMPLATE.reduce((sum, item) => sum + item.papers.length, 0);

  return (
    <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Auto-fill papers (1 week)</h2>

      <p className="text-xs text-gray-500">
        Generates all core papers and spreads them across 7 days starting from your chosen date.
      </p>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Week Start Date</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Number of Sets</label>
        <input
          type="number"
          min={1}
          value={setCount}
          onChange={(e) => setSetCount(Math.max(1, Number(e.target.value) || 1))}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
        />
        <p className="text-[11px] text-gray-500 mt-1">
          {totalPapersPerSet} papers per set · {totalPapersPerSet * setCount} total entries.
        </p>
      </div>

      <button
        type="button"
        onClick={handleAutofill}
        className="w-full py-2.5 mt-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-indigo-200"
      >
        <Wand2 size={16} />
        Auto-fill all papers
      </button>
    </div>
  );
};

const Timetable = ({ entries, theme, font, spacing, fillPage }: { entries: Entry[], theme: Theme, font: typeof FONTS[0], spacing: typeof SPACING[0], fillPage: boolean }) => {
  return (
    <table 
      className={`w-full border-collapse ${spacing.fontSize} leading-relaxed ${fillPage ? 'h-full' : ''}`}
      style={{ fontFamily: font.value, borderColor: theme.borderColor, borderWidth: '1px' }}
    >
      <thead>
        <tr>
          <th style={{ backgroundColor: theme.headerBg, color: theme.headerText, borderColor: theme.borderColor, borderWidth: '1px' }} className={`font-semibold ${spacing.value} text-left w-[140px]`}>Date</th>
          <th style={{ backgroundColor: theme.headerBg, color: theme.headerText, borderColor: theme.borderColor, borderWidth: '1px' }} className={`font-semibold ${spacing.value} text-center w-[120px]`}>Day</th>
          <th style={{ backgroundColor: theme.headerBg, color: theme.headerText, borderColor: theme.borderColor, borderWidth: '1px' }} className={`font-semibold ${spacing.value} text-center w-[160px]`}>Time</th>
          <th style={{ backgroundColor: theme.headerBg, color: theme.headerText, borderColor: theme.borderColor, borderWidth: '1px' }} className={`font-semibold ${spacing.value} text-left`}>Subject</th>
          <th style={{ backgroundColor: theme.headerBg, color: theme.headerText, borderColor: theme.borderColor, borderWidth: '1px' }} className={`font-semibold ${spacing.value} text-center w-[80px]`}>Paper</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, index) => {
          const isSameDateAsPrev = index > 0 && entry.date === entries[index - 1].date;

          return (
            <tr key={entry.id} className="pdf-avoid-break">
              <td style={{ borderColor: theme.borderColor, borderWidth: '1px' }} className={`${spacing.value} text-left text-gray-900`}>
                {!isSameDateAsPrev ? formatDate(entry.date) : ''}
              </td>
              <td style={{ borderColor: theme.borderColor, borderWidth: '1px' }} className={`${spacing.value} text-center text-gray-900`}>
                {!isSameDateAsPrev ? formatDay(entry.date) : ''}
              </td>
              <td style={{ borderColor: theme.borderColor, borderWidth: '1px' }} className={`${spacing.value} text-center text-gray-900 whitespace-nowrap`}>
                {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
              </td>
              <td style={{ borderColor: theme.borderColor, borderWidth: '1px' }} className={`${spacing.value} text-left text-gray-900`}>
                {entry.subject}
              </td>
              <td style={{ borderColor: theme.borderColor, borderWidth: '1px' }} className={`${spacing.value} text-center text-gray-900`}>
                {entry.paper}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default function App() {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [mode, setMode] = useState<'studio' | 'hubs'>('studio');
  const [activeTab, setActiveTab] = useState<'entries' | 'customize'>('entries');
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [selectedFont, setSelectedFont] = useState(FONTS[1]); // Default to Playfair for classic look
  const [selectedSpacing, setSelectedSpacing] = useState(SPACING[1]);
  const [fillPage, setFillPage] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed.entries)) setEntries(parsed.entries);
      if (parsed.mode === 'studio' || parsed.mode === 'hubs') setMode(parsed.mode);
      if (typeof parsed.fillPage === 'boolean') setFillPage(parsed.fillPage);
    } catch {
      // Ignore corrupt local storage payloads.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        entries,
        mode,
        fillPage
      })
    );
  }, [entries, mode, fillPage]);

  const handleDownloadPdf = () => {
    const element = printRef.current;
    if (!element) return;

    const today = new Date().toISOString().split('T')[0];
    const opt = {
      margin:       [8, 8, 8, 8],
      filename:     `timetable-${today}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleAdd = (entry: Entry) => {
    setEntries([...entries, entry]);
    setActiveTab('entries'); // Switch back to entries tab to see the new entry
  };

  const handleAddMany = (newEntries: Omit<Entry, 'id'>[]) => {
    setEntries((prev) => [
      ...prev,
      ...newEntries.map((entry) => ({ ...entry, id: crypto.randomUUID() }))
    ]);
    setActiveTab('entries');
  };

  const handleDelete = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const handleClearAll = () => {
    setEntries([]);
  };

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  }, [entries]);

  return (
    <div className="flex flex-col lg:flex-row lg:h-screen bg-gray-100 font-sans overflow-hidden">
      {/* Sidebar - hidden on print */}
      <div className="w-full lg:w-[400px] bg-white border-r border-gray-200 flex flex-col no-print z-10 shadow-xl shrink-0">
        <div className="p-5 border-b border-gray-200 bg-white flex justify-between items-center sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Timetable Studio</h1>
            <p className="text-xs text-gray-500 mt-1">Create printable A4 schedules (with Hubs mode)</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={() => setMode((prev) => (prev === 'studio' ? 'hubs' : 'studio'))}
              className="px-3 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
              title="Toggle mobile-friendly Hubs mode"
            >
              {mode === 'studio' ? <Smartphone size={16} /> : <Rows3 size={16} />}
              {mode === 'studio' ? 'Hubs' : 'Studio'}
            </button>
            <button 
              onClick={handleDownloadPdf} 
              className="px-3 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
              title="Download timetable as PDF"
            >
              <Download size={16} />
              PDF
            </button>
            <button 
              onClick={() => window.print()} 
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm shadow-indigo-200"
            >
              <Printer size={16} />
              Print
            </button>
          </div>
        </div>
        
        <div className={`flex border-b border-gray-200 bg-white ${mode === 'hubs' ? 'hidden' : ''}`}>
          <button 
            onClick={() => setActiveTab('entries')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'entries' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <List size={16} /> Entries
          </button>
          <button 
            onClick={() => setActiveTab('customize')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'customize' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <Settings size={16} /> Customize
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
          {mode === 'hubs' ? (
            <HubsMode entries={sortedEntries} onDelete={handleDelete} onClearAll={handleClearAll} onAdd={handleAdd} />
          ) : activeTab === 'entries' ? (
            <>
              <EntryForm onAdd={handleAdd} />
              <AutoFillPapers onAddMany={handleAddMany} />
              <EntryList entries={sortedEntries} onDelete={handleDelete} onClearAll={handleClearAll} />
            </>
          ) : (
            <div className="space-y-6">
              {/* Theme Selection */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Palette size={18} className="text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-700">Color Scheme</h2>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${selectedTheme.id === theme.id ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm flex overflow-hidden shrink-0">
                        <div className="w-1/2 h-full" style={{ backgroundColor: theme.headerBg }}></div>
                        <div className="w-1/2 h-full bg-white"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Selection */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Type size={18} className="text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-700">Typography</h2>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {FONTS.map(font => (
                    <button
                      key={font.id}
                      onClick={() => setSelectedFont(font)}
                      style={{ fontFamily: font.value }}
                      className={`p-3 rounded-lg border text-left transition-all ${selectedFont.id === font.id ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50 text-indigo-900' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900'}`}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacing Selection */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Layout size={18} className="text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-700">Row Spacing</h2>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {SPACING.map(spacing => (
                    <button
                      key={spacing.id}
                      onClick={() => setSelectedSpacing(spacing)}
                      className={`py-2 px-3 rounded-lg border text-center transition-all ${selectedSpacing.id === spacing.id ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'}`}
                    >
                      <span className="text-xs font-medium">{spacing.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Rows3 size={18} className="text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-700">Layout Fit</h2>
                </div>
                <button
                  onClick={() => setFillPage((prev) => !prev)}
                  className={`w-full py-2.5 rounded-lg border text-sm font-medium transition-colors ${fillPage ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                >
                  {fillPage ? 'Fill page: ON' : 'Fill page: OFF'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Makes timetable rows expand to fill available A4 page height.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center print-container bg-gray-100/80 items-start">
        <div ref={printRef} className={`bg-white shadow-2xl a4-page print-area relative ${fillPage ? 'h-[297mm] flex' : ''}`}>
          <Timetable 
            entries={sortedEntries} 
            theme={selectedTheme} 
            font={selectedFont} 
            spacing={selectedSpacing} 
            fillPage={fillPage}
          />
        </div>
      </div>
    </div>
  );
}
