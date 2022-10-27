import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

class EventData {
    name: string;
    value: any;

    constructor(name: string, value: any) {
        this.name = name;
        this.value = value;
    }
}

@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  // Notifications get sent here (so the state service receives them)
  // Components shouldn't subscribe to this
  private notificationSubject: Subject<EventData> = new Subject<EventData>();

  // Commands are sent here (so components receive them)
  private commandSubject: Subject<EventData> = new Subject<EventData>();


  constructor() { }

  // Components send notifications here to get them to the state service
  emitNotification(eventName: string, action: any): void {
      console.log("EventBus <- " + eventName);
      this.notificationSubject.next(new EventData(eventName, action));
  }

  // State service gets notifications from here
  // Components should not use this
  onNotification(eventName: string, action: any): Subscription {
    return this.notificationSubject.pipe(
      filter((e: EventData) => e.name === eventName),
      map((e: EventData) => e["value"])).subscribe(action);
  }

  // State service sends notifications here.
  // Components should not use this
  emitCommand(eventName: string, action: any): void {
    console.log("EventBus -> " + eventName);
    this.commandSubject.next(new EventData(eventName, action));
  }

  // This is where outgoing commands are sent
  // Components should listen to this
  onCommand(eventName: string, action: any): Subscription {
    return this.commandSubject.pipe(
      filter((e: EventData) => e.name === eventName),
      map((e: EventData) => e["value"])).subscribe(action);
  }
}
