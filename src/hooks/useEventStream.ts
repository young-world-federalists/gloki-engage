import { useEffect, useEffectEvent } from 'react';
import { eventStreamService, type EventType, type EventListener } from '../services/eventStream';

export const useEventStream = (eventType: EventType, listener: EventListener) => {
  const onEvent = useEffectEvent(listener);

  useEffect(() => {
    const handler: EventListener = (event) => onEvent(event);
    eventStreamService.addEventListener(eventType, handler);
    return () => {
      eventStreamService.removeEventListener(eventType, handler);
    };
  }, [eventType]);
}; 