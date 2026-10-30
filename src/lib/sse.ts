import { EventEmitter } from 'events';

class RealtimeEventBus extends EventEmitter {}

export const eventBus = new RealtimeEventBus();
eventBus.setMaxListeners(100);

export const SSE_EVENTS = {
  NEW_MESSAGE: 'new_message',
  MESSAGE_STATUS_UPDATE: 'message_status_update',
  CONVERSATION_UPDATED: 'conversation_updated',
  TEMPLATE_STATUS_CHANGED: 'template_status_changed',
};
