import { z } from "zod";

const testResultSchema = z.enum(["not-run", "running", "passed", "failed"]);

const diagnosticEventSchema = z
  .object({
    id: z.number().int().positive(),
    message: z.string().min(1).max(1_000),
    milliseconds: z.number().int().nonnegative(),
  })
  .strict();

export const diagnosticReportSubmissionSchema = z
  .object({
    capturedAt: z.string().datetime(),
    environment: z
      .object({
        online: z.boolean(),
        secureContext: z.boolean(),
        speechRecognition: z.enum(["present", "absent"]),
      })
      .strict(),
    events: z.array(diagnosticEventSchema).max(100),
    finalTranscript: z.string().max(20_000),
    interimTranscript: z.string().max(20_000),
    notes: z.string().max(4_000),
    offlineRecognition: z.enum(["not-tested", "worked", "failed"]),
    results: z
      .object({
        delayedAudioUnlock: testResultSchema,
        progressiveAudio: testResultSchema,
        speechRecognition: testResultSchema,
      })
      .strict(),
  })
  .strict();

export const diagnosticReportResponseSchema = z
  .object({
    reportId: z.string().uuid(),
  })
  .strict();

export type DiagnosticReportSubmission = z.infer<
  typeof diagnosticReportSubmissionSchema
>;
