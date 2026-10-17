# Operator runbook (what each scheduled check-in does)

Mueez has given standing approval for Claude to send the scheduled outreach, follow-ups and replies described here, from mueez777666@gmail.com, following `sales/reply_playbook.md`.

On each run:
1. `git pull` the repo.
2. **Send due emails:** for each row in `outreach/send_schedule.csv` with `status=scheduled` and `send_after_utc` in the past, send that Gmail draft by `draft_id`. Mark it `sent <timestamp>`, append to `outreach/sent_log.csv`, and set follow-up dates in `outreach/followups_due.csv` (+3 and +7 working days). Space sends by about 1 minute. Never more than 25 cold emails a day.
3. **Check replies:** search Gmail for threads from any lead email (`leads/lead_database.csv`) newer than the last run, plus bounces from mailer-daemon. Answer each one per `sales/reply_playbook.md`, then log and update the lead status.
4. **Follow-ups:** send any follow-up whose date has arrived and that still has no reply. Write it fresh, with a new specific idea for that brand.
5. **New leads:** if fewer than 10 emails are scheduled for the coming week, research 10 new leads in the active niches (`strategy/niche_decision.md`), verify a public email on their site, write personalised emails as drafts, and schedule them for the next weekday at 10:00 UK.
6. Commit and push. Message Mueez with a short summary: sent, replies, calls booked, anything that needs him.

Never: invent results, misstate location, contact anyone who said no, email more than 3 times without a reply, or agree prices or terms outside the playbook.
