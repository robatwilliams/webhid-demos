import { OFF, RED } from '../colors.js';

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

  const effectGenerator = larsonScanner();

  while (running) {
    const action = effectGenerator.next().value;

    if (!action) {
      break;
    }

    if (typeof action === 'number') {
      await wait(action);
    } else if (action.length === 2) {
      const [index, color] = action;
      setColor(device, index, color);
    } else {
      const color = action;

      for (let i = 0; i < LED_COUNT; i++) {
        await setColor(device, i, color);
      }
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

/**
 * Could also implement by having it just return the current desired state,
 * and let something else work out the diff and apply it to adjust the LEDs.
 */
function* larsonScanner() {
  const STEP_DURATION_MS = 100;
  const WIDTH = 3;

  // Orient the BlinkStick such that LED0 (cable end) is on the left
  let leftIndex = 0;
  let rightIndex = leftIndex + WIDTH - 1;

  // Initial render on the left
  for (let i = leftIndex; i <= rightIndex; i++) {
    yield [i, RED];
  }
  yield STEP_DURATION_MS;

  while (true) {
    // Move right
    while (rightIndex < LED_COUNT - 1) {
      yield [leftIndex++, OFF];
      yield [++rightIndex, RED];
      yield STEP_DURATION_MS;
    }

    // Move left
    while (leftIndex > 0) {
      yield [rightIndex--, OFF];
      yield [--leftIndex, RED];
      yield STEP_DURATION_MS;
    }
  }
}
