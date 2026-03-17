import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let lastCheckTime = new Date();

      // Send initial heartbeat so the client knows the connection is live
      controller.enqueue(encoder.encode(': connected\n\n'));

      intervalId = setInterval(async () => {
        try {
          const newAlerts = await prisma.alert.findMany({
            where: {
              createdAt: { gt: lastCheckTime },
              isActive: true,
            },
            orderBy: { createdAt: 'desc' },
          });

          if (newAlerts.length > 0) {
            const event = `data: ${JSON.stringify(newAlerts)}\n\n`;
            controller.enqueue(encoder.encode(event));
            lastCheckTime = new Date();
          }

          // Heartbeat to keep the connection alive
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (error) {
          console.error('SSE poll error:', error);
        }
      }, 10_000);
    },

    cancel() {
      // Client disconnected -- stop polling
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
