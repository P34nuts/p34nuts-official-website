/**
 * NOIR CUT DESIGN REMINDER — This is a production frame, not a generic form card:
 * Paper White carries the enquiry, Ink Black holds the data, and Cut Red marks the action.
 */
import { ArrowUpRight } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getBookingErrorMessage } from "@/lib/bookingStatus";
import { trpc } from "@/lib/trpc";

type BookingFormProps = {
  recipient: string;
};

const eventFormats = ["Clubshow", "Festival", "Support", "Privates Event", "Business / Kooperation", "Sonstiges"];

export function BookingForm({ recipient }: BookingFormProps) {
  const [status, setStatus] = useState("");
  const bookingMutation = trpc.booking.create.useMutation({
    onSuccess: (result) => {
      setStatus(result.emailDelivered ? "Anfrage sicher übermittelt. P34nuts erhält sie direkt per E-Mail." : result.notificationDelivered ? "Anfrage gesichert. P34nuts wurde benachrichtigt." : "Anfrage gesichert. Die Bestätigung folgt über den direkten Kontaktweg.");
    },
    onError: (error) => setStatus(getBookingErrorMessage(error.data?.code, error.message)),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    setStatus("");
    if (String(data.get("website") ?? "").trim()) {
      setStatus("Die Anfrage konnte gerade nicht verarbeitet werden. Bitte schreibe direkt an P34nuts@mail.de.");
      return;
    }
    bookingMutation.mutate({
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      eventDate: String(data.get("date") ?? ""),
      venue: String(data.get("venue") ?? "").trim(),
      location: String(data.get("location") ?? "").trim(),
      eventFormat: String(data.get("format") ?? "") as "Clubshow" | "Festival" | "Support" | "Privates Event" | "Business / Kooperation" | "Sonstiges",
      capacity: String(data.get("capacity") ?? "").trim() || undefined,
      budget: String(data.get("budget") ?? "").trim() || undefined,
      message: String(data.get("message") ?? "").trim() || undefined,
      consent: true,
    });
  };

  return (
    <section id="send-the-frame" className="booking-form-section" aria-labelledby="booking-form-title">
      <div className="booking-form-heading">
        <p className="contact-kicker">Booking request / production form</p>
        <h3 id="booking-form-title">SEND<br /><em>THE FRAME.</em></h3>
        <p>Die Anfrage wird nach der aktiven Übermittlung geschützt gespeichert und P34nuts als Booking-Hinweis gemeldet. Für direkte Rückfragen erreichst du {recipient} auch per E-Mail.</p>
      </div>
      <form className="booking-form" onSubmit={handleSubmit} noValidate>
        <label className="booking-honeypot" aria-hidden="true"><span>Website</span><Input name="website" tabIndex={-1} autoComplete="off" /></label>
        <div className="booking-form-grid">
          <label><span>Name / Organisation <b>*</b></span><Input name="name" autoComplete="name" required placeholder="Name oder Veranstalter" /></label>
          <label><span>E-Mail <b>*</b></span><Input name="email" type="email" autoComplete="email" required placeholder="kontakt@veranstalter.de" /></label>
          <label><span>Datum <b>*</b></span><Input name="date" type="date" required /></label>
          <label><span>Veranstaltungsort <b>*</b></span><Input name="venue" required placeholder="Venue, Bühne oder Club" /></label>
          <label><span>Stadt / Land <b>*</b></span><Input name="location" required placeholder="Berlin, Deutschland" /></label>
          <label><span>Format <b>*</b></span><select name="format" required defaultValue=""><option value="" disabled>Bitte auswählen</option>{eventFormats.map((format) => <option value={format} key={format}>{format}</option>)}</select></label>
          <label><span>Kapazität</span><Input name="capacity" inputMode="numeric" placeholder="z. B. 450 Gäste" /></label>
          <label><span>Budgetrahmen</span><Input name="budget" placeholder="optional" /></label>
          <label className="booking-form-message"><span>Nachricht</span><Textarea name="message" rows={5} placeholder="Ablauf, Slot, Technik, besondere Hinweise …" /></label>
        </div>
        <label className="booking-consent"><input name="consent" type="checkbox" required /><span>Ich bestätige, dass die Angaben ausschließlich zur Bearbeitung dieser Booking-Anfrage verarbeitet werden.</span></label>
        <div className="booking-form-submit"><button type="submit" disabled={bookingMutation.isPending}>{bookingMutation.isPending ? "FRAME WIRD GESICHERT …" : "ANFRAGE SICHER SENDEN"} <ArrowUpRight size={18} /></button><p aria-live="polite">{status}</p></div>
      </form>
    </section>
  );
}
