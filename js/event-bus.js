// Simple EventBus based on the native EventTarget API
const EventBus = new EventTarget();
// export default EventBus;
window.EventBus = EventBus;
