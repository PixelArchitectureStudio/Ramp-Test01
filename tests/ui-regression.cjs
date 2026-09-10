// DOM regression tests; no layout/browser emulation claims.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {JSDOM, VirtualConsole} = require('jsdom');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
const base = JSON.parse(scripts.find(match => match[1].includes('ramp-source'))[2]);
const outer = scripts.find(match => !match[1].includes('ramp-source'))[2];
const handlers = [];
const errors = [];
const frame = {addEventListener(name, callback) { if (name === 'load') handlers.push(callback); }};
const document = {
  getElementById: id => id === 'app' ? frame : {textContent: JSON.stringify(base)},
  body: {innerHTML:''}
};
const vc = new VirtualConsole();
vc.on('jsdomError', error => errors.push(error.message));
const sandbox = {document, console:{log(){}, error(error){errors.push(String(error));}}, setTimeout, clearTimeout, TextEncoder, TextDecoder, Blob, URL, Uint8Array, ArrayBuffer, DataView};
async function tick(ms=0) { await new Promise(resolve => setTimeout(resolve,ms)); }
async function run() {
  // No fetch stub: a network request here fails the test.
  await vm.runInNewContext(outer, sandbox);
  assert.ok(frame.srcdoc?.includes('id="rampDrawing"'), 'Local source materializes without a network');
  const innerScripts = [...frame.srcdoc.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  innerScripts.forEach(script => new vm.Script(script[1]));
  const dom = new JSDOM(frame.srcdoc, {
    url:'https://pixelarchitecturestudio.github.io/Ramp-Test01/',
    runScripts:'dangerously', pretendToBeVisual:true, virtualConsole:vc,
    beforeParse(window) {
      window.matchMedia = () => ({matches:false, addEventListener(){}, removeEventListener(){}});
      window.ResizeObserver = class {observe(){} disconnect(){}};
      window.scrollTo = () => {};
      window.SVGElement.prototype.getBBox = () => ({x:0,y:0,width:100,height:20});
      window.TextEncoder = TextEncoder;
      window.TextDecoder = TextDecoder;
    }
  });
  const win=dom.window, doc=win.document;
  frame.contentDocument=doc;
  frame.contentWindow=win;
  Object.assign(sandbox, {MutationObserver:win.MutationObserver, Event:win.Event, requestAnimationFrame:win.requestAnimationFrame.bind(win), cancelAnimationFrame:win.cancelAnimationFrame.bind(win)});
  await tick(20);
  handlers.forEach(callback => callback());
  await tick(200);
  const $ = selector => doc.querySelector(selector);
  const click = async selector => { assert.ok($(selector),selector); $(selector).click(); await tick(); };
  const fill = async (selector,value) => { $(selector).value=value; $(selector).dispatchEvent(new win.Event('input',{bubbles:true})); await tick(); };
  assert.ok($('#ramp-ux-styles'), 'UX styles initialized');
  assert.ok($('.ux-history #openCalculationHistoryBtn'), 'History has an independent row');
  assert.equal($('.history-switch-row .calculation-history-controls'),null);
  assert.equal($('#carAfterRamp3m').getAttribute('aria-label'),'3 متر فضای توقف');
  assert.equal($('#resultValue').textContent.trim(),'2400 cm', 'Initial result and units unchanged, trailing zero removed');
  assert.equal($('#exportBtn').disabled,false);
  await fill('#carHeight','400');
  assert.equal($('.form-card').classList.contains('ux-stale'),true);
  assert.equal($('#exportBtn').disabled,true);
  const oldResult=$('#resultValue').textContent;
  await fill('#carHeight','');
  await click('#calculateBtn');
  assert.equal($('#carHeight').getAttribute('aria-invalid'),'true');
  assert.equal($('#resultValue').textContent,oldResult,'Invalid submit preserves the last calculation');
  assert.equal(doc.activeElement,$('#carHeight'));
  await fill('#carHeight','400');
  $('#carHeight').dispatchEvent(new win.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  await tick();
  assert.equal($('.form-card').classList.contains('ux-stale'),false);
  assert.equal($('#exportBtn').disabled,false);
  assert.notEqual($('#resultValue').textContent,oldResult);
  await click('#undoCalculationBtn');
  assert.equal($('#carHeight').value,'350');
  assert.equal($('#resultValue').textContent,oldResult);
  await click('#redoCalculationBtn');
  assert.equal($('#carHeight').value,'400');
  await click('[data-type="disabled"]');
  assert.equal($('#exportBtn').disabled,true);
  await click('#calculateBtn');
  assert.equal($('#exportBtn').disabled,false);
  assert.equal($('[data-type="disabled"]').getAttribute('aria-pressed'),'true');
  await click('[data-view="plan"]');
  assert.equal($('[data-view="plan"]').getAttribute('aria-pressed'),'true');
  assert.ok($('#rampDrawing').textContent.includes('پلان'));
  await click('[data-type="human"]');
  await click('#calculateBtn');
  assert.equal($('#exportBtn').disabled,false);
  $('#humanHeightUnit').value = 'm';
  $('#humanHeightUnit').dispatchEvent(new win.Event('change',{bubbles:true}));
  await tick();
  assert.equal($('#humanHeight').value,'1.2','Unit conversion preserves physical height');
  assert.equal($('#exportBtn').disabled,true);
  await click('#calculateBtn');
  assert.equal($('#resultValue').textContent.trim(),'11.5 m');
  await click('#undoCalculationBtn');
  assert.equal($('#humanHeightUnit').value,'cm');
  assert.equal($('#humanHeight').value,'120');
  assert.equal($('#exportBtn').disabled,false);
  await click('#redoCalculationBtn');
  assert.equal($('#humanHeightUnit').value,'m');
  assert.equal($('#humanHeight').value,'1.2');
  assert.equal($('#resultValue').textContent.trim(),'11.5 m');
  await click('#langBtn');
  assert.equal($('.form-card .ux-jump').textContent,'View drawing ↓');
  assert.equal($('#exportBtn span').textContent,'Export file');
  await click('#exportBtn');
  assert.ok($('#exportModal').classList.contains('open'));
  assert.ok($('#exportFormatPicker'));
  await click('#exportCloseBtn');
  await click('#themeBtn');
  assert.equal(doc.documentElement.dataset.theme,'dark');
  // Both the original formulas and exporter are still present.
  assert.equal(typeof frame.contentWindow.rampExportAPI.geometry,'function');
  assert.deepEqual(errors,[],'No initialization or interaction errors');
  dom.window.close();
  console.log('PASS: offline bootstrap, parsing, initial calculation, stale state, validation, Enter, undo/redo, ramp types, plan, localization, export dialog, theme.');
}
run().catch(error => { console.error(error); process.exitCode=1; process.exit(1); });
