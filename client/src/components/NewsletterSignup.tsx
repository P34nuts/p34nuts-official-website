import { useEffect, useState } from "react";
import { ArrowUpRight, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";

type NewsletterSignupProps = { onNotice: (message: string) => void };

export function NewsletterSignup({ onNotice }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setEmail("");
      onNotice("Fast geschafft: Bitte bestätige deine Anmeldung über die E-Mail von P34nuts.");
    },
    onError: error => onNotice(error.message),
  });
  const confirm = trpc.newsletter.confirm.useMutation({
    onSuccess: result => onNotice(result.confirmed ? "Deine Anmeldung ist bestätigt." : "Dieser Bestätigungslink ist nicht mehr gültig."),
    onError: error => onNotice(error.message),
  });
  const unsubscribe = trpc.newsletter.unsubscribe.useMutation({
    onSuccess: result => onNotice(result.unsubscribed ? "Du bist vom Newsletter abgemeldet." : "Dieser Abmeldelink ist nicht mehr gültig."),
    onError: error => onNotice(error.message),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("newsletter");
    const token = params.get("token");
    if (action === "confirm" && token) confirm.mutate({ token });
    if (action === "unsubscribe" && token) unsubscribe.mutate({ token });
    if (action) window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
  }, []);

  return (
    <article className="newsletter-panel" aria-labelledby="newsletter-title">
      <div className="newsletter-panel-copy">
        <p className="contact-kicker">Newsletter / direct signal</p>
        <h3 id="newsletter-title">GET THE<br /><em>NEW FRAME.</em></h3>
        <p>Gelegentliche Updates zu Musik, Shows und neuen Visuals. Kein Spam, jederzeit abmeldbar.</p>
      </div>
      <form className="newsletter-form" onSubmit={event => { event.preventDefault(); subscribe.mutate({ email, website }); }}>
        <label htmlFor="newsletter-email">E-Mail-Adresse</label>
        <div className="newsletter-input-row">
          <input id="newsletter-email" type="email" required autoComplete="email" placeholder="deine@email.de" value={email} onChange={event => setEmail(event.target.value)} disabled={subscribe.isPending} />
          <button type="submit" disabled={subscribe.isPending}><Mail size={17} /> {subscribe.isPending ? "SEND…" : "JOIN"} <ArrowUpRight size={17} /></button>
        </div>
        <input className="newsletter-honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={event => setWebsite(event.target.value)} />
        <small>Mit „JOIN“ bekommst du eine Bestätigungs-Mail. Deine Adresse wird erst danach aktiviert.</small>
      </form>
    </article>
  );
}
