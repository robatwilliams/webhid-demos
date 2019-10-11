import { OFF, GREEN, RED } from '../colors.js';

// These IDs appear to be shared by all BlinkStick products.
// This demo is for the 8-LED Strip (https://www.blinkstick.com/products/blinkstick-strip)
// https://github.com/arvydas/blinkstick-node/blob/master/blinkstick.js#L22
const vendorId = 0x20a0;
const productId = 0x41e5;

const LED_COUNT = 8;

let running = false;

document.querySelector('#start').addEventListener('click', handleStart);
document.querySelector('#stop').addEventListener('click', () => (running = false));

async function handleStart() {
  running = true;

  const device = await getOpenedDevice();

  await clear(device);

  const effectGenerator = chaseSnake();

  while (running) {
    const action = effectGenerator.next().value;

    if (typeof action === 'number') {
      await wait(action);
    } else {
      const [index, color] = action;
      setColor(device, index, color);
    }
  }

  await clear(device);
}

async function getOpenedDevice() {
  const devices = await navigator.hid.getDevices();
  let device = devices.find(d => d.vendorId === vendorId && d.productId === productId);

  if (!device) {
    device = await navigator.hid.requestDevice({
      filters: [{ vendorId, productId }],
    });
  }

  if (!device.opened) {
    await device.open();
  }

  return device;
}

async function setColor(device, index, [r, g, b], retries = 1) {
  // Limit the brightness (still bright!); at some higher level it starts getting stuck on (overheating?)
  r *= 0.5;
  g *= 0.5;
  b *= 0.5;

  // Info gleaned from https://github.com/arvydas/blinkstick-node/blob/master/blinkstick.js#L429
  const reportId = 5;
  const data = Int8Array.from([reportId, index, r, g, b]);

  try {
    await device.sendFeatureReport(reportId, data);
  } catch (error) {
    if (retries > 0) {
      await setColor(device, index, [r, g, b], --retries);
    } else {
      console.error(`Failed to set color at index ${index}`, error);
    }
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clear(device) {
  for (let i = 0; i < LED_COUNT; i++) {
    await setColor(device, i, [0, 0, 0]);
  }
}

function* chaseSnake() {
  const LENGTH = 4;
  const STEP_DURATION_MS = 150;

  // Start with just the head in view
  let headIndex = 0;
  let tailIndex = headIndex - LENGTH + 1;

  // Show the distinct head
  yield [headIndex, RED];
  yield STEP_DURATION_MS;

  while (true) {
    // Cut the tail, if it's come into view yet
    if (tailIndex >= 0) {
      yield [tailIndex, OFF];
    }

    // Last head is now part of the body; recolour
    yield [headIndex, GREEN];

    // Move along, looping around
    headIndex = (headIndex + 1) % LED_COUNT;
    tailIndex = (tailIndex + 1) % LED_COUNT;

    // Show new head
    yield [headIndex, RED];

    yield STEP_DURATION_MS;
  }

  // It could probably be written more elegantly, but I doubt it'd be easier to understand
}
