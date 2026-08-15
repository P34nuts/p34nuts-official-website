import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { sendBookingMail } from "./bookingMailer";
import { createBookingRateLimiter, getRequestFingerprint } from "./bookingRateLimit";
import { createBookingSubmission } from "./db";

export const bookingSubmissionSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  venue: z.string().trim().min(2).max(240),
  location: z.string().trim().min(2).max(240),
  eventFormat: z.enum(["Clubshow", "Festival", "Support", "Privates Event", "Business / Kooperation", "Sonstiges"]),
  capacity: z.string().trim().max(80).optional(),
  budget: z.string().trim().max(160).optional(),
  message: z.string().trim().max(4000).optional(),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
});

const bookingRateLimiter = createBookingRateLimiter();

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  booking: router({
    create: publicProcedure.input(bookingSubmissionSchema).mutation(async ({ input, ctx }) => {
      try {
        if (!bookingRateLimiter.canAccept(getRequestFingerprint(ctx.req))) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Zu viele Anfragen in kurzer Zeit." });
        }
        const submission = await createBookingSubmission({
          name: input.name,
          email: input.email,
          eventDate: input.eventDate,
          venue: input.venue,
          location: input.location,
          eventFormat: input.eventFormat,
          capacity: input.capacity || null,
          budget: input.budget || null,
          message: input.message || null,
        });

        const [notificationDelivered, emailDelivered] = await Promise.all([
          notifyOwner({
            title: "Neue Booking-Anfrage · P34nuts",
            content: `${input.name} · ${input.eventFormat} · ${input.eventDate} · ${input.venue}, ${input.location} · ${input.email}`,
          }),
          sendBookingMail(input),
        ]);

        return { submissionId: submission.id, notificationDelivered, emailDelivered };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Booking] Failed to store submission", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Die Anfrage konnte gerade nicht sicher übermittelt werden. Bitte versuche es erneut oder schreibe direkt an P34nuts@mail.de." });
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
