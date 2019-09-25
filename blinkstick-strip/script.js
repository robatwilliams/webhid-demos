// These IDs appear to be shared by all BlinkStick products.
// This demo is for the 8-LED Strip (https://www.blinkstick.com/products/blinkstick-strip)
// https://github.com/arvydas/blinkstick-node/blob/master/blinkstick.js#L22
const vendorId = 0x20a0;
const productId = 0x41e5;

document.querySelector("button").addEventListener("click", handleClick);

async function handleClick() {
  const device = await getOpenedDevice();

  setColor(device, 0, [255, 0, 0]);
}

async function getOpenedDevice() {
  const devices = await navigator.hid.getDevices();
  let device = devices.find(
    d => d.vendorId === vendorId && d.productId === productId
  );

  if (!device) {
    device = await navigator.hid.requestDevice({
      filters: [{ vendorId, productId }]
    });
  }

  if (!device.opened) {
    await device.open();
  }

  return device;
}

function setColor(device, index, [r, g, b]) {
  // Info gleaned from https://github.com/arvydas/blinkstick-node/blob/master/blinkstick.js#L429
  const reportId = 5;
  const data = Int8Array.from([reportId, index, r, g, b]);

  return device.sendFeatureReport(reportId, data);
}

function getRandomInt(minInclusive, maxExclusive) {
  return (
    Math.floor(Math.random() * (maxExclusive - minInclusive)) + minInclusive
  );
}
