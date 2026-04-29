import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Status = 'За изпълнение' | 'В процес' | 'За преглед' | 'Готово';
type Priority = 'Нисък' | 'Среден' | 'Висок';
type DeadlineType = '14 работни дни' | '20 работни дни' | '30 календарни дни';

type Task = {
  id: string;
  regNumber: string;
  regDate: string;
  deadlineType: DeadlineType;
  dueDate: string;
  title: string;
  description: string;
  remaining: string;
  status: Status;
  priority: Priority;
  assignee: string;
  tags: string[];
  createdAt: string;
};

const STATUSES: Status[] = ['За изпълнение', 'В процес', 'За преглед', 'Готово'];
const DEADLINE_TYPES: DeadlineType[] = ['14 работни дни', '20 работни дни', '30 календарни дни'];
const STORAGE_KEY = 'flowtasks.tasks.v3';
const LEGACY_STORAGE_KEYS = ['flowtasks.tasks.v2', 'flowtasks.tasks.v1'];

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(dateValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function addWorkingDays(startDate: string, workingDays: number) {
  const date = parseDate(startDate);
  let added = 0;

  while (added < workingDays) {
    date.setDate(date.getDate() + 1);
    if (!isWeekend(date)) {
      added += 1;
    }
  }

  return toDateInputValue(date);
}

function addCalendarDays(startDate: string, days: number) {
  const date = parseDate(startDate);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function calculateDueDate(regDate: string, deadlineType: DeadlineType) {
  if (!regDate) return '';

  if (deadlineType === '14 работни дни') return addWorkingDays(regDate, 14);
  if (deadlineType === '20 работни дни') return addWorkingDays(regDate, 20);
  return addCalendarDays(regDate, 30);
}

function formatDate(dateValue: string) {
  if (!dateValue) return 'няма дата';
  return parseDate(dateValue).toLocaleDateString('bg-BG');
}

function daysLeft(dueDate: string) {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseDate(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

const today = toDateInputValue(new Date());

const starterTasks: Task[] = [
  {
    id: crypto.randomUUID(),
    regNumber: 'Р-001/2026',
    regDate: today,
    deadlineType: '14 работни дни',
    dueDate: calculateDueDate(today, '14 работни дни'),
    title: 'Подготовка на становище',
    description: 'Да се разгледа входящият документ и да се подготви проект на становище.',
    remaining: 'Преглед на приложените документи\nСъгласуване с отговорника\nФинално изпращане',
    status: 'За изпълнение',
    priority: 'Висок',
    assignee: 'Иван',
    tags: ['становище'],
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    regNumber: 'Р-002/2026',
    regDate: today,
    deadlineType: '20 работни дни',
    dueDate: calculateDueDate(today, '20 работни дни'),
    title: 'Проверка по преписка',
    description: 'Да се провери движението на преписката и да се обнови статусът.',
    remaining: 'Проверка на наличните данни\nИзискване на липсваща информация',
    status: 'В процес',
    priority: 'Среден',
    assignee: 'Мария',
    tags: ['преписка'],
    createdAt: new Date().toISOString(),
  },
];

function normalizeTask(task: Partial<Task>): Task {
  const regDate = task.regDate || task.createdAt?.slice(0, 10) || today;
  const deadlineType = (task.deadlineType as DeadlineType) || '14 работни дни';

  return {
    id: task.id || crypto.randomUUID(),
    regNumber: task.regNumber || '',
    regDate,
    deadlineType,
    dueDate: calculateDueDate(regDate, deadlineType),
    title: task.title || 'Без заглавие',
    description: task.description || '',
    remaining: task.remaining || '',
    status: task.status === 'Готово' || task.status === 'В процес' || task.status === 'За преглед' ? task.status : 'За изпълнение',
    priority: (task.priority as Priority) || 'Среден',
    assignee: task.assignee || 'Без отговорник',
    tags: Array.isArray(task.tags) ? task.tags : [],
    createdAt: task.createdAt || new Date().toISOString(),
  };
}

function loadTasks(): Task[] {
  const raw = localStorage.getItem(STORAGE_KEY) || LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
  if (!raw) return starterTasks;

  try {
    const parsed = JSON.parse(raw) as Partial<Task>[];
    return parsed.map(normalizeTask);
  } catch {
    return starterTasks;
  }
}

function isOverdue(task: Task) {
  const left = daysLeft(task.dueDate);
  return left !== null && left < 0 && task.status !== 'Готово';
}

function isDueSoon(task: Task) {
  const left = daysLeft(task.dueDate);
  return left !== null && left >= 0 && left <= 3 && task.status !== 'Готово';
}

function priorityClass(priority: Priority) {
  return {
    Нисък: 'priority-low',
    Среден: 'priority-medium',
    Висок: 'priority-high',
  }[priority];
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [query, setQuery] = useState('');
  const [assignee, setAssignee] = useState('all');
  const [priority, setPriority] = useState<'all' | Priority>('all');
  const [draft, setDraft] = useState({
    regNumber: '',
    regDate: today,
    deadlineType: '14 работни дни' as DeadlineType,
    title: '',
    description: '',
    remaining: '',
    assignee: '',
    priority: 'Среден' as Priority,
    tags: '',
  });

  const draftDueDate = calculateDueDate(draft.regDate, draft.deadlineType);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const assignees = useMemo(
    () => Array.from(new Set(tasks.map((task) => task.assignee).filter(Boolean))),
    [tasks]
  );

  const filteredTasks = tasks.filter((task) => {
    const text = `${task.regNumber} ${task.title} ${task.description} ${task.remaining} ${task.assignee} ${task.deadlineType} ${task.tags.join(' ')}`.toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());
    const matchesAssignee = assignee === 'all' || task.assignee === assignee;
    const matchesPriority = priority === 'all' || task.priority === priority;
    return matchesQuery && matchesAssignee && matchesPriority;
  });

  const stats = {
    total: tasks.length,
    open: tasks.filter((task) => task.status !== 'Готово').length,
    dueSoon: tasks.filter(isDueSoon).length,
    overdue: tasks.filter(isOverdue).length,
    done: tasks.filter((task) => task.status === 'Готово').length,
  };

  function createTask(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.title.trim() && !draft.regNumber.trim()) return;

    const task: Task = {
      id: crypto.randomUUID(),
      regNumber: draft.regNumber.trim(),
      regDate: draft.regDate,
      deadlineType: draft.deadlineType,
      dueDate: draftDueDate,
      title: draft.title.trim() || 'Без заглавие',
      description: draft.description.trim(),
      remaining: draft.remaining.trim(),
      status: 'За изпълнение',
      priority: draft.priority,
      assignee: draft.assignee.trim() || 'Без отговорник',
      tags: draft.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      createdAt: new Date().toISOString(),
    };

    setTasks((current) => [task, ...current]);
    setDraft({ regNumber: '', regDate: today, deadlineType: '14 работни дни', title: '', description: '', remaining: '', assignee: '', priority: 'Среден', tags: '' });
  }

  function moveTask(taskId: string, status: Status) {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status } : task)));
  }

  function deleteTask(taskId: string) {
    setTasks((current) => current.filter((task) => task.id !== taskId));
  }

  function resetDemo() {
    setTasks(starterTasks);
    localStorage.removeItem(STORAGE_KEY);
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Регистър задачи</p>
          <h1>Следене на задачи със срокове</h1>
          <p className="subtitle">
            Въвеждаш рег. № и дата, избираш срок, а системата автоматично изчислява до кога трябва да се изпълни задачата.
          </p>
        </div>
        <button className="ghost-button" onClick={resetDemo}>Върни демо данните</button>
      </header>

      <section className="stats-grid">
        <StatCard label="Всички задачи" value={stats.total} />
        <StatCard label="Отворени" value={stats.open} />
        <StatCard label="До 3 дни" value={stats.dueSoon} warning />
        <StatCard label="Просрочени" value={stats.overdue} danger />
        <StatCard label="Готови" value={stats.done} />
      </section>

      <section className="panel">
        <h2>Нова задача</h2>
        <form className="task-form" onSubmit={createTask}>
          <input placeholder="Рег. №" value={draft.regNumber} onChange={(e) => setDraft({ ...draft, regNumber: e.target.value })} />
          <input type="date" value={draft.regDate} onChange={(e) => setDraft({ ...draft, regDate: e.target.value })} />
          <select value={draft.deadlineType} onChange={(e) => setDraft({ ...draft, deadlineType: e.target.value as DeadlineType })}>
            {DEADLINE_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
          <input value={`Краен срок: ${formatDate(draftDueDate)}`} readOnly aria-label="Автоматично изчислен краен срок" />
          <input className="wide" placeholder="Задача / предмет" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <input placeholder="Отговорник" value={draft.assignee} onChange={(e) => setDraft({ ...draft, assignee: e.target.value })} />
          <select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}>
            <option>Нисък</option>
            <option>Среден</option>
            <option>Висок</option>
          </select>
          <input className="wide" placeholder="Етикети, разделени със запетая" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
          <textarea className="wide" placeholder="Описание на задачата" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <textarea
            className="wide remaining-input"
            placeholder={'Остава от задачата — напиши какво още трябва да се направи. Може на отделни редове.'}
            value={draft.remaining}
            onChange={(e) => setDraft({ ...draft, remaining: e.target.value })}
          />
          <button className="primary-button" type="submit">Добави задача</button>
        </form>
      </section>

      <section className="toolbar">
        <input placeholder="Търси по рег. №, задача, описание, оставащо, етикет..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="all">Всички отговорници</option>
          {assignees.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as 'all' | Priority)}>
          <option value="all">Всички приоритети</option>
          <option value="Нисък">Нисък</option>
          <option value="Среден">Среден</option>
          <option value="Висок">Висок</option>
        </select>
      </section>

      <section className="board">
        {STATUSES.map((status) => {
          const columnTasks = filteredTasks.filter((task) => task.status === status);
          return (
            <div
              className="column"
              key={status}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => moveTask(event.dataTransfer.getData('taskId'), status)}
            >
              <div className="column-header">
                <h3>{status}</h3>
                <span>{columnTasks.length}</span>
              </div>
              <div className="task-list">
                {columnTasks.map((task) => {
                  const left = daysLeft(task.dueDate);
                  return (
                    <article
                      className={`task-card ${priorityClass(task.priority)} ${isOverdue(task) ? 'overdue' : ''} ${isDueSoon(task) ? 'due-soon' : ''}`}
                      key={task.id}
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData('taskId', task.id)}
                    >
                      <div className="task-card-top">
                        <div>
                          <span className="reg-number">{task.regNumber || 'Без рег. №'}</span>
                          <strong>{task.title}</strong>
                        </div>
                        <button aria-label="Изтрий задача" onClick={() => deleteTask(task.id)}>×</button>
                      </div>
                      <p>{task.description || 'Без описание.'}</p>

                      <section className="deadline-box">
                        <div>
                          <span>Дата</span>
                          <strong>{formatDate(task.regDate)}</strong>
                        </div>
                        <div>
                          <span>Срок</span>
                          <strong>{task.deadlineType}</strong>
                        </div>
                        <div>
                          <span>До кога</span>
                          <strong>{formatDate(task.dueDate)}</strong>
                        </div>
                        <div>
                          <span>Остават</span>
                          <strong className={left !== null && left < 0 ? 'danger-text' : ''}>
                            {left === null ? '-' : left < 0 ? `${Math.abs(left)} дни просрочие` : `${left} дни`}
                          </strong>
                        </div>
                      </section>

                      <section className="remaining-box">
                        <h4>Остава от задачата</h4>
                        {task.remaining ? (
                          <ul>
                            {task.remaining.split('\n').filter(Boolean).map((item, index) => <li key={index}>{item}</li>)}
                          </ul>
                        ) : (
                          <p>Няма добавени оставащи действия.</p>
                        )}
                      </section>

                      <div className="meta-row">
                        <span>👤 {task.assignee}</span>
                      </div>
                      <div className="tag-row">
                        <span className="priority-pill">{task.priority}</span>
                        {task.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}

function StatCard({ label, value, danger = false, warning = false }: { label: string; value: number; danger?: boolean; warning?: boolean }) {
  return (
    <div className={`stat-card ${danger ? 'danger' : ''} ${warning ? 'warning' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
