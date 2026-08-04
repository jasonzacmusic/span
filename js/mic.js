/* Span — microphone acquisition that survives a Zoom call.
   Ported from Prima Vista (sight-singing-studio/src/lib/mic.ts), where this
   was written after singers "looked like they were not singing".

   The failure it fixes: Zoom, Teams and Meet install virtual audio devices
   and on macOS frequently become the DEFAULT input while a call is open.
   The browser then either refuses outright (NotReadableError) or — far
   worse — hands back a live stream that is digitally silent. Permission
   granted, track live, every sample zero. Nothing looks broken.

   So: a retry ladder, device enumeration, a silence watchdog, and recovery
   when the system input changes mid-session. */

const PREF_KEY = 'span-mic-device-v1';

/* Devices that route another app's audio rather than a microphone. */
const VIRTUAL_HINTS = [
  'zoom', 'teams', 'microsoft teams', 'google meet', 'webex', 'skype',
  'blackhole', 'soundflower', 'loopback', 'obs', 'virtual', 'vb-audio',
  'voicemeeter', 'aggregate', 'multi-output', 'stream engine', 'ndi',
];

export function isVirtualLabel(label) {
  const l = (label || '').toLowerCase();
  return VIRTUAL_HINTS.some((h) => l.includes(h));
}

export function loadPreferredMic() {
  try { return localStorage.getItem(PREF_KEY); } catch { return null; }
}

export function savePreferredMic(id) {
  try {
    if (id) localStorage.setItem(PREF_KEY, id);
    else localStorage.removeItem(PREF_KEY);
  } catch { /* a preference, not a promise */ }
}

/* Why can this page not even ask for a microphone? */
export function unsupportedReason() {
  const secure = window.isSecureContext
    || location.protocol === 'https:'
    || location.hostname === 'localhost'
    || location.hostname === '127.0.0.1';
  if (!secure) {
    return 'Microphones only work on a secure connection. Open this page at its https:// address and try again.';
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'This browser will not give a web page microphone access. Chrome, Edge, Firefox and Safari all will.';
  }
  return null;
}

/* Labels only populate once permission has been granted at least once, which
   is why the picker is filled in AFTER the mic opens. */
export async function listMicDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  try {
    const all = await navigator.mediaDevices.enumerateDevices();
    return all.filter((d) => d.kind === 'audioinput').map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label || `Microphone ${i + 1}`,
      virtual: isVirtualLabel(d.label || ''),
    }));
  } catch {
    return [];
  }
}

/* The processing chain that fights pitch detection, switched off. */
const CLEAN = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };

const labelOf = (stream) => stream.getAudioTracks()[0]?.label || 'Microphone';
const deviceIdOf = (stream) => stream.getAudioTracks()[0]?.getSettings?.().deviceId ?? null;

/* Open the microphone, trying progressively less demanding requests. The
   ladder matters: a device held by another app fails on an exact deviceId
   but often succeeds on a bare {audio:true}, because the browser is then
   free to hand over whichever input is actually available. */
export async function openMic(preferredId) {
  const blocked = unsupportedReason();
  if (blocked) throw new Error(blocked);

  const attempts = [];
  if (preferredId) {
    attempts.push({ audio: { deviceId: { exact: preferredId }, ...CLEAN } });
    attempts.push({ audio: { deviceId: preferredId } });
  }
  attempts.push({ audio: CLEAN });
  attempts.push({ audio: true });

  let lastError = null;
  for (const constraints of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (stream.getAudioTracks().length) return finish(stream, preferredId);
      stream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      lastError = e;
      const name = e?.name;
      // A refusal is final — retrying cannot talk the user into saying yes.
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
        throw new Error(describeMicError(e));
      }
    }
  }

  // Last resort: walk the real (non-virtual) inputs one at a time. This is
  // what rescues a machine whose DEFAULT input is a conferencing device.
  const devices = await listMicDevices();
  for (const d of [...devices].sort((a, b) => Number(a.virtual) - Number(b.virtual))) {
    if (!d.deviceId) continue;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: d.deviceId } } });
      if (stream.getAudioTracks().length) return finish(stream, preferredId);
      stream.getTracks().forEach((t) => t.stop());
    } catch (e) { lastError = e; }
  }

  throw new Error(describeMicError(lastError));
}

function finish(stream, preferredId) {
  const label = labelOf(stream);
  const deviceId = deviceIdOf(stream);
  let warning = null;
  if (isVirtualLabel(label)) {
    warning = `“${label}” is a conferencing device, not a real microphone — it usually sends silence to a web page. `
      + 'Pick your actual mic below if nothing registers.';
  } else if (preferredId && deviceId && deviceId !== preferredId) {
    warning = `Your usual microphone was not available, so Span opened “${label}” instead.`;
  }
  return { stream, deviceId, label, warning };
}

export function describeMicError(error) {
  const name = error?.name;
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Microphone permission was refused. Click the padlock in the address bar, allow the microphone '
        + 'for this site, then reload. On a Mac also check System Settings → Privacy & Security → Microphone.';
    case 'SecurityError':
      return 'This page is not allowed to use the microphone. Open it at its https:// address and try again.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No microphone was found. Plug one in — or if you use an audio interface, check it is selected '
        + 'in System Settings → Sound → Input.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Another app is holding the microphone. Zoom, Teams and Meet do this while a call is open: '
        + 'mute yourself there (or leave the call), then press Enable microphone again.';
    case 'AbortError':
      return 'The microphone stopped responding. Unplug and replug it, or pick a different input below.';
    case 'OverconstrainedError':
      return 'That microphone could not run in the mode Span asked for. Pick a different input below.';
    default:
      return 'Could not open the microphone. If you are in a Zoom or Teams call, mute yourself there and try '
        + 'again; otherwise pick a different input below.';
  }
}

/* The system input changing — a call starting or ending is the usual cause. */
export function onDeviceChange(cb) {
  if (!navigator.mediaDevices?.addEventListener) return () => {};
  navigator.mediaDevices.addEventListener('devicechange', cb);
  return () => navigator.mediaDevices.removeEventListener('devicechange', cb);
}
