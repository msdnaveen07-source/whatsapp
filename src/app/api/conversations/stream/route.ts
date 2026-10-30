import { NextRequest } from 'next/server';
import { eventBus, SSE_EVENTS } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: string, data: any) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          // Controller might be closed
        }
      };

      // Heartbeat every 15 seconds
      const interval = setInterval(() => {
        sendEvent('ping', { time: Date.now() });
      }, 15000);

      const onNewMessage = (data: any) => sendEvent('new_message', data);
      const onStatusUpdate = (data: any) => sendEvent('status_update', data);

      eventBus.on(SSE_EVENTS.NEW_MESSAGE, onNewMessage);
      eventBus.on(SSE_EVENTS.MESSAGE_STATUS_UPDATE, onStatusUpdate);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        eventBus.off(SSE_EVENTS.NEW_MESSAGE, onNewMessage);
        eventBus.off(SSE_EVENTS.MESSAGE_STATUS_UPDATE, onStatusUpdate);
      });
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
