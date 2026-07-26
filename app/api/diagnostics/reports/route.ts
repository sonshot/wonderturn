import { diagnosticReportSubmissionSchema } from "@/lib/diagnostics/report";
import { getSpeechSample } from "@/lib/diagnostics/speech-samples";
import { inferDevice } from "@/lib/diagnostics/user-agent";

export async function POST(request: Request) {
  const reportId = crypto.randomUUID();

  try {
    const submission = diagnosticReportSubmissionSchema.parse(
      await request.json(),
    );
    const userAgent = request.headers.get("user-agent") ?? "Unknown user agent";
    const report = {
      ...submission,
      device: inferDevice(userAgent),
      receivedAt: new Date().toISOString(),
      reportId,
      speechSample: getSpeechSample(submission.speechSampleId),
    };

    // Temporary sink until diagnostic report storage is implemented.
    console.log("[diagnostics] report", JSON.stringify(report));

    return Response.json({ reportId });
  } catch {
    console.error("[diagnostics] invalid report", {
      category: "validation",
      endpoint: "/api/diagnostics/reports",
      status: 400,
    });

    return Response.json(
      { error: "The diagnostic report could not be submitted." },
      { status: 400 },
    );
  }
}
