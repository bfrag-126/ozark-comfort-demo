const { useState, useEffect } = React;

const SUPABASE_URL = 'https://stcedpfozkvanmiwkdlb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_WP6YLXEf6TOyaYqPJMGgsg_V1Iv_PYu';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(dateStr) {
  const t = new Date(todayISO() + 'T00:00:00');
  const d = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((d - t) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function daysAgoLabel(dateStr) {
  const today = new Date(todayISO() + 'T00:00:00');
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return 'quoted today';
  if (diff === 1) return 'quoted 1 day ago';
  if (diff > 1) return `quoted ${diff} days ago`;
  return 'quoted (upcoming)';
}

function groupByTechnician(jobs) {
  const map = {};
  jobs.forEach((j) => {
    const tech = j.technician || 'Unassigned';
    if (!map[tech]) map[tech] = [];
    map[tech].push(j);
  });
  return Object.entries(map);
}

function App() {
  const [scheduled, setScheduled] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [customerCount, setCustomerCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const schedReq = supabase
          .from('jobs')
          .select('id, job_type, status, job_date, technician, notes, customers(name)')
          .eq('status', 'scheduled')
          .order('job_date', { ascending: true });

        const quoteReq = supabase
          .from('jobs')
          .select('id, job_type, status, job_date, notes, customers(name)')
          .eq('status', 'quoted')
          .order('job_date', { ascending: true });

        const custReq = supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });

        const [schedRes, quoteRes, custRes] = await Promise.all([schedReq, quoteReq, custReq]);

        if (schedRes.error) throw schedRes.error;
        if (quoteRes.error) throw quoteRes.error;
        if (custRes.error) throw custRes.error;

        setScheduled(schedRes.data || []);
        setQuotes(quoteRes.data || []);
        setCustomerCount(custRes.count);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="center">Loading Ozark Comfort dashboard…</div>;
  }
  if (error) {
    return <div className="center">Couldn't load data — {error}</div>;
  }

  const byDate = {};
  scheduled.forEach((job) => {
    if (!byDate[job.job_date]) byDate[job.job_date] = [];
    byDate[job.job_date].push(job);
  });
  const dateKeys = Object.keys(byDate).sort();

  return (
    <div className="page">
      <div className="header">
        <div>
          <h1 className="h1">Ozark Comfort Heating &amp; Cooling</h1>
          <div className="subtitle">Operations Dashboard</div>
        </div>
        <div className="stat-bar">
          <div className="stat">
            <div className="stat-value">{customerCount ?? '—'}</div>
            <div className="stat-label">Active Customers</div>
          </div>
          <div className="stat">
            <div className="stat-value">{scheduled.length}</div>
            <div className="stat-label">Scheduled Jobs</div>
          </div>
          <div className="stat">
            <div className="stat-value">{quotes.length}</div>
            <div className="stat-label">Open Quotes</div>
          </div>
        </div>
      </div>

      <div className="columns">
        <div>
          <h2 className="section-title">Schedule by Technician</h2>
          {dateKeys.length === 0 && <div className="empty">Nothing scheduled right now.</div>}
          {dateKeys.map((date) => (
            <div className="date-group" key={date}>
              <div className="date-label">{formatDateLabel(date)}</div>
              {groupByTechnician(byDate[date]).map(([tech, jobs]) => (
                <div className="tech-group" key={tech}>
                  <div className="tech-name">{tech}</div>
                  {jobs.map((job) => (
                    <div className="job-row" key={job.id}>
                      <div className="job-main">
                        <span className="job-type">{job.job_type}</span>
                        <span className="customer-name">{job.customers ? job.customers.name : ''}</span>
                      </div>
                      {job.notes && <div className="job-notes">{job.notes}</div>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div>
          <h2 className="section-title">Open Quotes — Needs Follow-Up</h2>
          {quotes.length === 0 && <div className="empty">No open quotes.</div>}
          {quotes.map((q) => (
            <div className="quote-row" key={q.id}>
              <div className="job-main">
                <span className="customer-name">{q.customers ? q.customers.name : ''}</span>
                <span className="quote-age">{daysAgoLabel(q.job_date)}</span>
              </div>
              <div className="job-type">{q.job_type}</div>
              {q.notes && <div className="job-notes">{q.notes}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
