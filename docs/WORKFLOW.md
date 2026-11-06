# Workflow rules implemented (src/lib/actions.ts)

- **Lead created** → auto-assigned (area match +10, property-type match +5, −0.5 per open lead) unless an agent is chosen; activity logged.
- **First contact** (Call / WhatsApp / Email button, or moving past "New Lead") sets `first_contact_at`; First Response Time = `first_contact_at − created_at`.
- **Share property via WhatsApp** → logged, lead advances to *Property Matched*.
- **Schedule viewing** → lead advances to *Viewing Scheduled*.
- **Record offer** → lead advances to *Offer / Negotiation*. Accepting an offer shows "start documentation".
- **Documentation** → a Deal is created (price from accepted offer, 2% commission default).
- **Closed Won** → deal marked won; tasks created at +30, +90, +180 days (thank-you/feedback, referral, market update).
- **Closed Lost** → reason required, re-engage date + marketing-consent captured, follow-up task created.
- **Agents** only see leads assigned to them (enforced in the UI and by database Row Level Security).
