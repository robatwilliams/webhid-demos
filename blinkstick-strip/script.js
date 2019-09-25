import { RAINBOW, OFF, WHITE } from './colors.js';

// These IDs appear to be shared by all BlinkStick products.
// This demo is for the 8-LED Strip (https://www.blinkstick.com/products/blinkstick-strip)
// https://github.com/arvydas/blinkstick-node/blob/master/blinkstick.js#L22
const vendorId = 0x20a0;
const productId = 0x41e5;

const LED_COUNT = 8;

document.querySelector('button').addEventListener('click', handleClick);

async function handleClick() {
  const device = await getOpenedDevice();

  for (let [ledIndex, color] of nextColorArrangement().entries()) {
    await setColor(device, ledIndex, color);
  }
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

async function setColor(device, index, [r, g, b]) {
  // Info gleaned from https://github.com/arvydas/blinkstick-node/blob/master/blinkstick.js#L429
  const reportId = 5;
  const data = Int8Array.from([reportId, index, r, g, b]);

  try {
    await device.sendFeatureReport(reportId, data);
  } catch (error) {
    console.error(`Failed to set color at index ${index}`, error);
  }
}

const nextColorArrangement = (() => {
  const arrangements = [
    slots(WHITE),
    slots(i => (i % 2 === 0 ? WHITE : OFF)),
    slots(i => (i % 2 !== 0 ? WHITE : OFF)),
    slots(i => RAINBOW[i] || WHITE),
    slots(i => RAINBOW[RAINBOW.length - i] || WHITE),
    ...RAINBOW.map(slots),
    slots(OFF),
  ];

  let nextIndex = 0;
  return () => arrangements[nextIndex++ % arrangements.length];

  function slots(color) {
    return Array.from({ length: LED_COUNT }).map((_, i) =>
      typeof color === 'function' ? color(i) : color
    );
  }
})();
