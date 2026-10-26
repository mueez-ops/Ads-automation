"""Log first-message email sends. Usage: python3 tools/log_sends.py [--approved TEXT] LEAD=GMAIL_MESSAGE_ID ...
For each lead: a row in outreach/sent_log.csv; 'sent <time>' in send_schedule.csv and on its first message in
messages_queue.csv; 'Email 1 sent' in leads/lead_database.csv; and the two follow-ups (3 working days and 7 days
after the send, Sydney date) in followups_due.csv. Rows that don't change keep their exact bytes (the files mix CRLF
and LF line endings); new rows are CRLF like the rows around them."""
import csv, io, os, sys, datetime as dt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
args = sys.argv[1:]
approved = ""
if args[:1] == ["--approved"]:
    approved, args = args[1], args[2:]
sends = dict(a.split("=", 1) for a in args)
now = dt.datetime.now(dt.timezone.utc)
stamp = now.strftime("%Y-%m-%dT%H:%M:%SZ")
au_day = (now + dt.timedelta(hours=11)).date()   # the date in Sydney (AEDT)
def add_workdays(d, n):
    while n:
        d += dt.timedelta(days=1)
        n -= d.weekday() < 5
    return d
due = [add_workdays(au_day, 3).isoformat(), (au_day + dt.timedelta(days=7)).isoformat()]

def row_bytes(values, crlf=True):
    b = io.StringIO()
    csv.writer(b, lineterminator="\r\n" if crlf else "\n").writerow(values)
    return b.getvalue().encode()

def edit_lines(path, key, changes):
    """Single-line records: rewrite only the rows whose `key` column is in `changes` ({key value: {col: new}})."""
    lines = open(path, "rb").read().splitlines(keepends=True)
    head = next(csv.reader([lines[0].decode()]))
    out, done = [lines[0]], set()
    for l in lines[1:]:
        rec = dict(zip(head, next(csv.reader([l.decode()]))))
        if rec.get(key) in changes and rec[key] not in done:
            rec.update(changes[rec[key]]); done.add(rec[key])
            l = row_bytes([rec[h] for h in head], l.endswith(b"\r\n"))
        out.append(l)
    open(path, "wb").write(b"".join(out))
    return done

def append(path, rows):
    open(path, "ab").write(b"".join(row_bytes(r) for r in rows))

leads = {r["lead_id"]: r for r in csv.DictReader(open(P("leads", "lead_database.csv"), newline=""))}
missing = [k for k in sends if k not in leads]
if missing:
    sys.exit(f"unknown leads: {missing}")

# messages_queue has multi-line message text, so it is parsed whole; its rows all end in CRLF
qpath = P("outreach", "messages_queue.csv")
q = list(csv.reader(open(qpath, newline="")))
qi = {h: i for i, h in enumerate(q[0])}
msg_of = {}
for r in q[1:]:
    if r[qi["lead_id"]] in sends and r[qi["stage"]].startswith("1"):
        r[qi["status"]] = f"sent {stamp}"
        msg_of[r[qi["lead_id"]]] = r[qi["msg_id"]]
open(qpath, "wb").write(b"".join(row_bytes(r) for r in q))

sched = edit_lines(P("outreach", "send_schedule.csv"), "lead_id", {k: {"status": f"sent {stamp}"} for k in sends})
edit_lines(P("leads", "lead_database.csv"), "lead_id",
           {k: {"status": f"Email 1 sent {au_day} (AU); follow-ups due {due[0]}, {due[1]}"} for k in sends})
append(P("outreach", "sent_log.csv"),
       [[m, k, leads[k]["business_name"], f"Email: {leads[k]['contact_email']}", "1 - first message",
         f"{msg_of.get(k, '?')} in messages_queue.csv", approved, stamp, due[0], "sent"] for k, m in sends.items()])
append(P("outreach", "followups_due.csv"),
       [[k, leads[k]["business_name"], leads[k]["contact_name"], "Email", stage, d, dep, "pending"]
        for k in sends for stage, d, dep in (("2 - follow-up (new idea)", due[0], "M1 sent, no reply"),
                                             ("3 - final", due[1], "M2 sent, no reply"))])
print(f"logged {len(sends)} sends at {stamp}; schedule rows updated: {len(sched)}; queue messages: {len(msg_of)}; follow-ups {due}")
