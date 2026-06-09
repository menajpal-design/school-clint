'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CalendarClock, Download, ExternalLink, FileText, Link2, PlayCircle, Plus, Save, Trash2, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Mode = 'routine' | 'recorded' | 'schedule' | 'books';
type Item = {
  id: string;
  title: string;
  className: string;
  subject: string;
  teacher: string;
  date: string;
  time: string;
  day: string;
  link: string;
  description: string;
  thumbnail?: string;
  createdAt: string;
};

const storageKey = (mode: Mode) => `easy_online_${mode}`;
const emptyItem = (mode: Mode): Item => ({
  id: '',
  title: mode === 'books' ? 'Bangla PDF Book' : mode === 'recorded' ? 'Recorded Class' : 'Online Class',
  className: 'Class 10',
  subject: 'Science',
  teacher: '',
  date: '',
  time: '',
  day: '',
  link: '',
  description: '',
  thumbnail: '',
  createdAt: '',
});
const toast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app-toast', { detail: { title, message, type, duration: 4500 } })); };
const readItems = (mode: Mode): Item[] => { try { return JSON.parse(localStorage.getItem(storageKey(mode)) || '[]'); } catch { return []; } };
const writeItems = (mode: Mode, items: Item[]) => localStorage.setItem(storageKey(mode), JSON.stringify(items));
const youtubeEmbed = (url: string) => { const v = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i)?.[1]; return v ? `https://www.youtube.com/embed/${v}` : ''; };
const downloadList = (mode: Mode, items: Item[]) => { const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `online-${mode}.json`; a.click(); URL.revokeObjectURL(a.href); };

const copy = {
  routine: { title: 'Online Routine', desc: 'Subject-wise online class schedule, meeting/video link এবং teacher info save করুন।', badge: 'Live Routine' },
  recorded: { title: 'Recorded Classes', desc: 'পুরাতন class YouTube link দিয়ে save করুন, site-এর ভিতরেই video play হবে।', badge: 'YouTube Library' },
  schedule: { title: 'Class Schedule', desc: 'Daily/weekly class schedule আলাদা করে সাজিয়ে রাখুন।', badge: 'Schedule' },
  books: { title: 'PDF Book Library', desc: 'Google Drive PDF link save করুন; optional thumbnail 80KB এর বেশি হলে নেওয়া হবে না।', badge: 'Drive PDF Books' },
};

export default function OnlineClassClient({ mode }: { mode: Mode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<Item>(() => emptyItem(mode));
  const [search, setSearch] = useState('');
  const [thumbSize, setThumbSize] = useState('');

  useEffect(() => { setItems(readItems(mode)); setForm(emptyItem(mode)); }, [mode]);
  const filtered = useMemo(() => { const q = search.toLowerCase().trim(); if (!q) return items; return items.filter((item) => [item.title, item.className, item.subject, item.teacher, item.day, item.description].join(' ').toLowerCase().includes(q)); }, [items, search]);
  const update = (key: keyof Item, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => {
    if (!form.title.trim()) return toast('Title required', 'Name/title দিন।', 'error');
    if (mode === 'books' && !form.link.trim()) return toast('PDF link required', 'Google Drive PDF link দিন।', 'error');
    const nextItem = { ...form, id: form.id || `${Date.now()}`, createdAt: form.createdAt || new Date().toISOString() };
    const next = form.id ? items.map((item) => item.id === form.id ? nextItem : item) : [nextItem, ...items];
    setItems(next); writeItems(mode, next); setForm(emptyItem(mode)); setThumbSize(''); toast('Saved', `${copy[mode].title} item saved.`, 'success');
  };
  const remove = (id: string) => { const next = items.filter((item) => item.id !== id); setItems(next); writeItems(mode, next); toast('Deleted', 'Item removed.', 'info'); };
  const handleThumb = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const kb = file.size / 1024;
    setThumbSize(`${kb.toFixed(1)} KB`);
    if (kb > 80) { toast('Thumbnail too large', 'Thumbnail 80KB এর বেশি নেওয়া হবে না। ছোট image দিন।', 'error'); event.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => update('thumbnail', String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  return <div className="space-y-6 p-4 md:p-6"><div className="rounded-3xl border bg-gradient-to-r from-sky-50 via-white to-violet-50 p-6 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">{copy[mode].title}</h1><p className="text-sm text-muted-foreground">{copy[mode].desc}</p></div><div className="flex flex-wrap gap-2"><Badge>{copy[mode].badge}</Badge><Badge variant="secondary">Saved: {items.length}</Badge><Button variant="outline" onClick={() => downloadList(mode, items)}><Download className="mr-2 h-4 w-4" />Export</Button></div></div></div><div className="grid gap-5 xl:grid-cols-[410px_1fr]"><Card className="border-primary/10 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add / Update</CardTitle><CardDescription>সব ডাটা site browser storage-এ save হবে; backend না থাকলেও error হবে না।</CardDescription></CardHeader><CardContent className="space-y-3"><Input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder={mode === 'books' ? 'Book name' : 'Class title'} /><div className="grid gap-3 sm:grid-cols-2"><Input value={form.className} onChange={(e) => update('className', e.target.value)} placeholder="Class" /><Input value={form.subject} onChange={(e) => update('subject', e.target.value)} placeholder="Subject" /></div>{mode !== 'books' && <Input value={form.teacher} onChange={(e) => update('teacher', e.target.value)} placeholder="Teacher name" />}<div className="grid gap-3 sm:grid-cols-3"><Input value={form.day} onChange={(e) => update('day', e.target.value)} placeholder="Day" /><Input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} /><Input value={form.time} onChange={(e) => update('time', e.target.value)} placeholder="Time" /></div><Input value={form.link} onChange={(e) => update('link', e.target.value)} placeholder={mode === 'books' ? 'Google Drive PDF link' : mode === 'recorded' ? 'YouTube video link' : 'Zoom/Meet/YouTube link'} />{mode === 'books' && <div className="rounded-xl border border-dashed p-3"><p className="mb-2 text-xs text-muted-foreground">Thumbnail optional, maximum 80KB. Upload না করলে book name দিয়ে card দেখাবে।</p><input type="file" accept="image/*" onChange={handleThumb} className="text-sm" />{thumbSize && <p className="mt-1 text-xs text-muted-foreground">Selected: {thumbSize}</p>}</div>}<textarea className="min-h-24 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Description / note" /><div className="grid gap-2 sm:grid-cols-2"><Button onClick={save}><Save className="mr-2 h-4 w-4" />Save</Button><Button variant="outline" onClick={() => { setForm(emptyItem(mode)); setThumbSize(''); }}>Clear</Button></div></CardContent></Card><div className="space-y-4"><div className="relative"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search class, subject, title, teacher..." className="h-11" /></div>{filtered.length === 0 ? <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No item found. বাম পাশ থেকে নতুন item add করুন।</div> : <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{filtered.map((item) => { const embed = youtubeEmbed(item.link); return <Card key={item.id} className="overflow-hidden border-border/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex h-40 items-center justify-center bg-gradient-to-br from-slate-100 via-white to-sky-100">{mode === 'books' ? (item.thumbnail ? <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" /> : <div className="px-5 text-center"><BookOpen className="mx-auto mb-2 h-10 w-10 text-primary" /><p className="line-clamp-2 text-lg font-bold">{item.title}</p><p className="text-xs text-muted-foreground">PDF Book</p></div>) : embed ? <iframe src={embed} title={item.title} className="h-full w-full" allowFullScreen /> : <Video className="h-12 w-12 text-primary" />}</div><CardHeader className="pb-2"><div className="flex items-start justify-between gap-2"><div><CardTitle className="line-clamp-2 text-lg">{item.title}</CardTitle><CardDescription>{item.className} · {item.subject}</CardDescription></div><Badge variant="secondary">{item.day || item.date || 'Any'}</Badge></div></CardHeader><CardContent className="space-y-3"><div className="grid gap-2 text-sm text-muted-foreground"><span className="flex items-center gap-2"><CalendarClock className="h-4 w-4" />{item.date || '-'} {item.time || ''}</span>{item.teacher && <span>Teacher: {item.teacher}</span>}{item.description && <p className="line-clamp-3">{item.description}</p>}</div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setForm(item)}>Edit</Button>{item.link && <Link href={item.link} target="_blank" className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium"><ExternalLink className="mr-1 h-3 w-3" />Open</Link>}{mode === 'recorded' && item.link && <Button size="sm" variant="outline"><PlayCircle className="mr-1 h-3 w-3" />Play</Button>}<Button size="sm" variant="destructive" onClick={() => remove(item.id)}><Trash2 className="mr-1 h-3 w-3" />Delete</Button></div></CardContent></Card>; })}</div>}</div></div></div>;
}

export function OnlineClassesHome() {
  const links = [
    { href: '/online-classes/routine', title: 'Online Routine', icon: Video, desc: 'Subject-wise live class routine and meeting links.' },
    { href: '/online-classes/recorded', title: 'Recorded Classes', icon: PlayCircle, desc: 'Old YouTube classes playable inside the site.' },
    { href: '/online-classes/schedule', title: 'Class Schedule', icon: CalendarClock, desc: 'Daily and weekly class schedule list.' },
    { href: '/online-classes/books', title: 'PDF Books', icon: FileText, desc: 'Google Drive PDF book cards with optional thumbnail.' },
  ];
  return <div className="space-y-6 p-4 md:p-6"><div className="rounded-3xl border bg-gradient-to-r from-blue-50 via-white to-emerald-50 p-6 shadow-sm"><h1 className="text-3xl font-bold tracking-tight">Online Classes</h1><p className="text-sm text-muted-foreground">Live routine, recorded YouTube class, schedule এবং PDF book library এক জায়গায়।</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{links.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href}><Card className="h-full transition hover:-translate-y-1 hover:shadow-lg"><CardHeader><CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" />{item.title}</CardTitle><CardDescription>{item.desc}</CardDescription></CardHeader><CardContent><span className="inline-flex items-center text-sm font-semibold text-primary"><Link2 className="mr-1 h-4 w-4" />Open module</span></CardContent></Card></Link>; })}</div></div>;
}
