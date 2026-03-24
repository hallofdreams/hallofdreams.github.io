// ═══════════════════════════════════════════════════════════════
//  Antssembly Interactive Viewer
//  Parser, interpreter, and viewer for ant assembly blog post
// ═══════════════════════════════════════════════════════════════

// ── Instruction set ──
const KEYWORDS = new Set([
  'SENSE','SMELL','SNIFF','PROBE','CARRYING','ID',
  'MOVE','PICKUP','DROP',
  'SET','ADD','SUB','MOD','MUL','DIV','AND','OR','XOR','LSHIFT','RSHIFT','RANDOM',
  'JMP','CALL','JEQ','JNE','JGT','JLT',
  'MARK','TAG',
]);

const SENSING_OPS = new Set(['SENSE','SMELL','SNIFF','PROBE','CARRYING','ID']);
const ACTION_OPS = new Set(['MOVE','PICKUP','DROP']);
const DIRECTIONS = { N:1, E:2, S:3, W:4, HERE:0, RANDOM:-1 };
const TARGETS = { EMPTY:0, WALL:1, FOOD:2, NEST:3, ANT:4 };
const CHANNELS = { CH_RED:0, CH_BLUE:1, CH_GREEN:2, CH_YELLOW:3 };

// ═══════════════════════════════════════════════════════════════
//  PARSER
// ═══════════════════════════════════════════════════════════════

function parse(sourceText) {
  const lines = sourceText.split('\n');
  const aliases = {};      // name -> register index
  const consts = {};       // name -> numeric value
  const tags = {};         // index -> name
  const labels = {};       // name -> instruction index
  const instructions = []; // parsed instructions
  const sourceLines = [];  // { text, lineNum, type }

  // Merge all named constants
  Object.assign(consts, DIRECTIONS, TARGETS, CHANNELS);

  // Pass 1: collect directives, labels, and source line metadata
  let instrIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const commentIdx = raw.indexOf(';');
    const code = commentIdx >= 0 ? raw.substring(0, commentIdx).trim() : raw.trim();
    const comment = commentIdx >= 0 ? raw.substring(commentIdx) : '';

    const sl = { text: raw, lineNum: i, type: 'blank', instrIndex: -1 };

    if (code === '') {
      sl.type = comment ? 'comment' : 'blank';
    } else if (code.startsWith('.alias')) {
      const parts = code.split(/\s+/);
      const name = parts[1];
      const reg = parts[2];
      const regIdx = parseInt(reg.replace('r', ''), 10);
      aliases[name] = regIdx;
      sl.type = 'directive';
    } else if (code.startsWith('.const')) {
      const parts = code.split(/\s+/);
      const name = parts[1];
      const val = resolveConstant(parts[2], consts);
      consts[name] = val;
      sl.type = 'directive';
    } else if (code.startsWith('.tag')) {
      const parts = code.split(/\s+/);
      const idx = parseInt(parts[1], 10);
      const name = parts[2];
      tags[idx] = name;
      consts[name] = idx;
      sl.type = 'directive';
    } else if (code.endsWith(':')) {
      const labelName = code.slice(0, -1).trim();
      labels[labelName] = instrIndex;
      sl.type = 'label';
    } else {
      sl.type = 'instruction';
      sl.instrIndex = instrIndex;
      instrIndex++;
    }

    sourceLines.push(sl);
  }

  // Pass 2: parse instructions
  for (let i = 0; i < sourceLines.length; i++) {
    const sl = sourceLines[i];
    if (sl.type !== 'instruction') continue;

    const commentIdx = sl.text.indexOf(';');
    const code = (commentIdx >= 0 ? sl.text.substring(0, commentIdx) : sl.text).trim();
    const tokens = code.split(/\s+/);
    const op = tokens[0].toUpperCase();
    const rawArgs = tokens.slice(1);

    const args = rawArgs.map(a => resolveArg(a, aliases, consts, labels));

    instructions.push({
      op,
      args,
      rawArgs,
      sourceLine: i,
      raw: code,
    });
  }

  return { aliases, consts, tags, labels, instructions, sourceLines };
}

function resolveConstant(token, consts) {
  if (consts[token] !== undefined) return consts[token];
  const n = parseInt(token, 10);
  return isNaN(n) ? 0 : n;
}

function resolveArg(token, aliases, consts, labels) {
  // Register reference (r0-r7 or alias)
  if (/^r\d$/.test(token)) {
    return { type: 'reg', index: parseInt(token[1], 10), name: token };
  }
  if (aliases[token] !== undefined) {
    return { type: 'reg', index: aliases[token], name: token };
  }
  // Numeric literal
  const num = parseInt(token, 10);
  if (!isNaN(num)) {
    return { type: 'imm', value: num };
  }
  // Named constant
  if (consts[token] !== undefined) {
    return { type: 'imm', value: consts[token], name: token };
  }
  // Label reference
  if (labels[token] !== undefined) {
    return { type: 'label', name: token, target: labels[token] };
  }
  // Unknown — treat as label (may be forward reference)
  return { type: 'label', name: token, target: -1 };
}

// ═══════════════════════════════════════════════════════════════
//  INTERPRETER
// ═══════════════════════════════════════════════════════════════

function createState(initRegs) {
  const regs = new Int32Array(8);
  if (initRegs) {
    for (const [k, v] of Object.entries(initRegs)) {
      const idx = typeof k === 'number' ? k : parseInt(k.replace('r', ''), 10);
      if (!isNaN(idx) && idx >= 0 && idx < 8) regs[idx] = v;
    }
  }
  return { regs, pc: 0, opCount: 0, tickEnded: false };
}

function resolveValue(arg, state) {
  if (!arg) return 0;
  if (arg.type === 'reg') return state.regs[arg.index];
  if (arg.type === 'imm') return arg.value;
  if (arg.type === 'label') return arg.target;
  return 0;
}

function clampI32(n) {
  return n | 0; // coerce to signed 32-bit
}

function executeSection(program, sectionConfig) {
  const { lineStart, lineEnd, initRegs, envResponses, descOverrides, maxSteps } = sectionConfig;

  // Build reverse alias map: index -> name
  const regNames = {};
  for (const [name, idx] of Object.entries(program.aliases)) {
    regNames[idx] = name;
  }
  // Fill in un-aliased registers
  for (let i = 0; i < 8; i++) {
    if (!regNames[i]) regNames[i] = 'r' + i;
  }

  // Find first instruction in this section
  const startInstrIdx = findFirstInstruction(program, lineStart);
  const endInstrIdx = findLastInstruction(program, lineEnd);

  if (startInstrIdx < 0) {
    // Section has no executable instructions (all directives/labels)
    return generateDirectiveSteps(program, sectionConfig, regNames);
  }

  // Set up interpreter state
  const initRegMap = {};
  if (initRegs) {
    for (const [name, val] of Object.entries(initRegs)) {
      const idx = program.aliases[name] !== undefined ? program.aliases[name] : parseInt(name.replace('r', ''), 10);
      if (!isNaN(idx)) initRegMap[idx] = val;
    }
  }

  const state = createState(initRegMap);
  state.pc = startInstrIdx;

  const steps = [];
  let envIdx = 0;
  const limit = maxSteps || 200;

  // Capture initial state
  steps.push(captureStep(program, state, sectionConfig, regNames, null));

  for (let safety = 0; safety < limit && !state.tickEnded; safety++) {
    if (state.pc < 0 || state.pc >= program.instructions.length) break;

    const inst = program.instructions[state.pc];
    const prevRegs = new Int32Array(state.regs);
    let jumped = false;
    let desc = null;
    let senseEffect = null;

    // Check for description override
    if (descOverrides && descOverrides[inst.sourceLine] !== undefined) {
      desc = descOverrides[inst.sourceLine];
    }

    // Execute
    switch (inst.op) {
      case 'SET':
        state.regs[inst.args[0].index] = clampI32(resolveValue(inst.args[1], state));
        break;
      case 'ADD':
        state.regs[inst.args[0].index] = clampI32(state.regs[inst.args[0].index] + resolveValue(inst.args[1], state));
        break;
      case 'SUB':
        state.regs[inst.args[0].index] = clampI32(state.regs[inst.args[0].index] - resolveValue(inst.args[1], state));
        break;
      case 'MUL':
        state.regs[inst.args[0].index] = clampI32(state.regs[inst.args[0].index] * resolveValue(inst.args[1], state));
        break;
      case 'DIV': {
        const divisor = resolveValue(inst.args[1], state);
        if (divisor !== 0) state.regs[inst.args[0].index] = clampI32(Math.trunc(state.regs[inst.args[0].index] / divisor));
        break;
      }
      case 'MOD': {
        const divisor = resolveValue(inst.args[1], state);
        if (divisor !== 0) {
          let r = state.regs[inst.args[0].index] % divisor;
          if (r < 0) r += Math.abs(divisor); // MOD is always non-negative
          state.regs[inst.args[0].index] = clampI32(r);
        }
        break;
      }
      case 'AND':
        state.regs[inst.args[0].index] = state.regs[inst.args[0].index] & resolveValue(inst.args[1], state);
        break;
      case 'OR':
        state.regs[inst.args[0].index] = state.regs[inst.args[0].index] | resolveValue(inst.args[1], state);
        break;
      case 'XOR':
        state.regs[inst.args[0].index] = state.regs[inst.args[0].index] ^ resolveValue(inst.args[1], state);
        break;
      case 'LSHIFT':
        state.regs[inst.args[0].index] = clampI32(state.regs[inst.args[0].index] << resolveValue(inst.args[1], state));
        break;
      case 'RSHIFT':
        state.regs[inst.args[0].index] = state.regs[inst.args[0].index] >> resolveValue(inst.args[1], state);
        break;
      case 'RANDOM': {
        const bound = resolveValue(inst.args[1], state);
        state.regs[inst.args[0].index] = bound > 0 ? Math.floor(Math.random() * bound) : 0;
        break;
      }

      // Control flow
      case 'JMP': {
        const target = resolveValue(inst.args[0], state);
        state.pc = target;
        jumped = true;
        break;
      }
      case 'CALL': {
        const retReg = inst.args[0].index;
        const target = resolveValue(inst.args[1], state);
        state.regs[retReg] = state.pc + 1;
        state.pc = target;
        jumped = true;
        break;
      }
      case 'JEQ': {
        const a = resolveValue(inst.args[0], state);
        const b = resolveValue(inst.args[1], state);
        if (a === b) { state.pc = resolveValue(inst.args[2], state); jumped = true; }
        break;
      }
      case 'JNE': {
        const a = resolveValue(inst.args[0], state);
        const b = resolveValue(inst.args[1], state);
        if (a !== b) { state.pc = resolveValue(inst.args[2], state); jumped = true; }
        break;
      }
      case 'JGT': {
        const a = resolveValue(inst.args[0], state);
        const b = resolveValue(inst.args[1], state);
        if (a > b) { state.pc = resolveValue(inst.args[2], state); jumped = true; }
        break;
      }
      case 'JLT': {
        const a = resolveValue(inst.args[0], state);
        const b = resolveValue(inst.args[1], state);
        if (a < b) { state.pc = resolveValue(inst.args[2], state); jumped = true; }
        break;
      }

      // Sensing — use scenario annotations
      case 'SENSE':
      case 'SMELL':
      case 'SNIFF':
      case 'PROBE':
      case 'CARRYING':
      case 'ID': {
        const resp = envResponses && envResponses[envIdx];
        envIdx++;
        const val = resp ? resp.returnValue : 0;
        const destReg = getSensingDest(inst);
        state.regs[destReg] = val;
        if (resp && resp.desc) desc = resp.desc;
        // Record sense effect for grid visualization
        senseEffect = buildSenseEffect(inst, val);
        break;
      }

      // Actions — end the tick
      case 'MOVE': {
        // Update dx/dy based on direction
        const moveDir = resolveValue(inst.args[0], state);
        const dxReg = program.aliases['dx'];
        const dyReg = program.aliases['dy'];
        if (dxReg !== undefined && dyReg !== undefined) {
          if (moveDir === 1) state.regs[dyReg]--;       // N
          else if (moveDir === 2) state.regs[dxReg]++;   // E
          else if (moveDir === 3) state.regs[dyReg]++;   // S
          else if (moveDir === 4) state.regs[dxReg]--;   // W
        }
        senseEffect = { type: 'move', dir: moveDir };
        state.tickEnded = true;
        break;
      }
      case 'PICKUP':
      case 'DROP':
        state.tickEnded = true;
        break;

      // Pheromones — visual effect on ant's cell
      case 'MARK': {
        const ch = inst.rawArgs[0] || 'CH_YELLOW';
        const amount = resolveValue(inst.args[1], state) || 0;
        senseEffect = { type: 'mark', channel: ch, value: amount };
        break;
      }
      case 'TAG':
        break;
    }

    if (!jumped) state.pc++;
    state.opCount++;

    // Capture step after execution
    const step = captureStep(program, state, sectionConfig, regNames, inst, desc);
    step._prevRegs = prevRegs;
    if (senseEffect) step.senseEffect = senseEffect;

    steps.push(step);

    // Stop if we've left the section (jumped out)
    if (state.pc < startInstrIdx || state.pc > endInstrIdx) {
      if (!jumped) break; // natural fallthrough out of section
      // If jumped out, that's fine — record it and stop
      break;
    }
  }

  return steps;
}

function getSensingDest(inst) {
  // CARRYING [reg] — optional dest, defaults to r0
  // SENSE <target> [reg] — optional dest
  // ID [reg] — optional dest
  // etc.
  switch (inst.op) {
    case 'CARRYING':
    case 'ID':
      return inst.args.length > 0 && inst.args[0].type === 'reg' ? inst.args[0].index : 0;
    case 'SENSE':
    case 'SMELL':
      return inst.args.length > 1 && inst.args[1].type === 'reg' ? inst.args[1].index : 0;
    case 'SNIFF':
      return inst.args.length > 2 && inst.args[2].type === 'reg' ? inst.args[2].index : 0;
    case 'PROBE':
      return inst.args.length > 1 && inst.args[1].type === 'reg' ? inst.args[1].index : 0;
    default:
      return 0;
  }
}

function buildSenseEffect(inst, val) {
  const op = inst.op;
  switch (op) {
    case 'SNIFF': {
      // SNIFF <ch> <dir> [reg] — intensity at a specific direction
      const ch = inst.rawArgs[0] || '';
      const dirArg = inst.rawArgs[1] || 'HERE';
      return { type: 'sniff', channel: ch, dir: dirArg, value: val };
    }
    case 'SMELL': {
      // SMELL <ch> [reg] — strongest direction
      const ch = inst.rawArgs[0] || '';
      return { type: 'smell', channel: ch, value: val };
    }
    case 'SENSE': {
      // SENSE <target> [reg] — scan 4 adjacent, returns direction
      const target = inst.rawArgs[0] || '';
      return { type: 'sense', target: target, value: val };
    }
    case 'PROBE': {
      // PROBE <dir> [reg] — cell type at direction
      const dirArg = inst.rawArgs[0] || '0';
      return { type: 'probe', dir: dirArg, value: val };
    }
    case 'CARRYING':
      return { type: 'carrying', value: val };
    case 'ID':
      return { type: 'id', value: val };
    default:
      return null;
  }
}

function findFirstInstruction(program, lineStart) {
  for (let i = 0; i < program.instructions.length; i++) {
    if (program.instructions[i].sourceLine >= lineStart) return i;
  }
  return -1;
}

function findLastInstruction(program, lineEnd) {
  for (let i = program.instructions.length - 1; i >= 0; i--) {
    if (program.instructions[i].sourceLine <= lineEnd) return i;
  }
  return -1;
}

function captureStep(program, state, config, regNames, inst, descOverride) {
  // Build register snapshot using alias names
  const regs = {};
  for (let i = 0; i < 8; i++) {
    regs[regNames[i]] = state.regs[i];
  }

  // Determine ant position from dx/dy registers
  // Grid center depends on grid size (default 5 -> center 2, or 9 -> center 4)
  const gridSize = (config._gridSize) || 5;
  const center = Math.floor(gridSize / 2);
  const dxIdx = program.aliases['dx'];
  const dyIdx = program.aliases['dy'];
  const antX = center + (dxIdx !== undefined ? state.regs[dxIdx] : 0);
  const antY = center + (dyIdx !== undefined ? state.regs[dyIdx] : 0);

  // Determine direction from last MOVE or fdir register
  const fdirIdx = program.aliases['fdir'];
  const dir = fdirIdx !== undefined ? state.regs[fdirIdx] : 0;

  // Map source line to section-relative line ID
  const highlightLines = [];
  if (inst) {
    const sectionLineOffset = config.lineStart;
    const relLine = inst.sourceLine - sectionLineOffset;
    highlightLines.push(`${config.id}-${relLine}`);
  }

  // Auto-generate description
  let desc = descOverride || (inst ? generateDesc(inst, regNames) : 'Initial state');

  // Check carrying status from CARRYING env responses seen so far
  const carryingReg = state.regs[0]; // CARRYING writes to r0
  // Heuristic: if the section is a homing section, check if we entered with carrying intent
  const isCarrying = config._carrying || false;

  return {
    ant: { x: antX, y: antY, dir: dirToAngle(dir), carrying: isCarrying },
    regs,
    painted: [],
    highlightLines,
    desc,
    label: inst ? inst.raw : 'initial',
  };
}

function dirToAngle(dir) {
  // N=1 E=2 S=3 W=4, map to rotation: 0=up 1=right 2=down 3=left
  switch (dir) {
    case 1: return 0; // N = up
    case 2: return 1; // E = right
    case 3: return 2; // S = down
    case 4: return 3; // W = left
    default: return 0;
  }
}

function generateDesc(inst, regNames) {
  const op = inst.op;
  const args = inst.rawArgs.join(' ');
  return `<code>${op} ${args}</code>`;
}

// For sections with no executable instructions (just directives)
function generateDirectiveSteps(program, config, regNames) {
  const steps = [];
  const regs = {};
  for (let i = 0; i < 8; i++) regs[regNames[i]] = 0;

  const dxIdx = program.aliases['dx'];
  const dyIdx = program.aliases['dy'];
  const antX = 4 + (dxIdx !== undefined ? 0 : 0);
  const antY = 4 + (dyIdx !== undefined ? 0 : 0);

  for (let lineIdx = config.lineStart; lineIdx <= config.lineEnd; lineIdx++) {
    const sl = program.sourceLines[lineIdx];
    if (!sl || sl.type === 'blank') continue;

    const relLine = lineIdx - config.lineStart;
    const desc = `<code>${sl.text.trim()}</code>`;

    steps.push({
      ant: { x: antX, y: antY, dir: 0 },
      regs: { ...regs },
      painted: [],
      highlightLines: [`${config.id}-${relLine}`],
      desc,
      label: sl.text.trim(),
    });
  }

  if (steps.length === 0) {
    steps.push({
      ant: { x: antX, y: antY, dir: 0 },
      regs: { ...regs },
      painted: [],
      highlightLines: [],
      desc: 'Empty section',
      label: '',
    });
  }

  return steps;
}


// ═══════════════════════════════════════════════════════════════
//  SYNTAX HIGHLIGHTER
// ═══════════════════════════════════════════════════════════════

function syntaxHighlight(lineText, aliases) {
  // Handle comment portion
  const commentIdx = lineText.indexOf(';');
  let code = lineText;
  let commentHtml = '';
  if (commentIdx >= 0) {
    code = lineText.substring(0, commentIdx);
    const commentText = escapeHtml(lineText.substring(commentIdx));
    commentHtml = `<span class="cmt">${commentText}</span>`;
  }

  if (code.trim() === '') return commentHtml;

  // Tokenize preserving whitespace
  const result = code.replace(/(\S+)/g, (match) => {
    const upper = match.toUpperCase();
    // Directive
    if (match.startsWith('.')) return `<span class="dir">${escapeHtml(match)}</span>`;
    // Label definition
    if (match.endsWith(':')) return `<span class="lbl">${escapeHtml(match)}</span>`;
    // Keyword (instruction)
    if (KEYWORDS.has(upper)) return `<span class="kw">${escapeHtml(match)}</span>`;
    // Register
    if (/^r\d$/.test(match) || (aliases && aliases[match] !== undefined))
      return `<span class="reg">${escapeHtml(match)}</span>`;
    // Number
    if (/^-?\d+$/.test(match) || /^0x[0-9a-fA-F]+$/.test(match))
      return `<span class="num">${escapeHtml(match)}</span>`;
    // Named constant (direction, target, channel)
    if (DIRECTIONS[upper] !== undefined || TARGETS[upper] !== undefined || CHANNELS[upper] !== undefined)
      return `<span class="str">${escapeHtml(match)}</span>`;
    // Label reference (in jump targets) — use label color
    return `<span class="lbl">${escapeHtml(match)}</span>`;
  });

  return result + commentHtml;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


// ═══════════════════════════════════════════════════════════════
//  VIEWER
// ═══════════════════════════════════════════════════════════════

const GRID = 9;
const COLORS = {
  bg: '#060a08', grid: '#1a2e26', cell: '#1a2e26',
  ant: '#3cd8a8', trail: '#1a3a35', highlight: '#2e9e80',
};

let program = null;
let sectionData = {};
let viewerState = {};
let allSections = [];

function initViewer(sourceText, sections) {
  program = parse(sourceText);
  allSections = sections;

  // Resolve forward label references in instructions
  for (const inst of program.instructions) {
    for (const arg of inst.args) {
      if (arg.type === 'label' && arg.target === -1) {
        arg.target = program.labels[arg.name] !== undefined ? program.labels[arg.name] : 0;
      }
    }
  }

  // Generate code blocks and detail views for each section
  sections.forEach((sec, i) => {
    sec.id = i;
    renderSection(sec);

    sectionData[i] = null;
    viewerState[i] = { step: 0, playing: false, timer: null, allPainted: [], activeScenario: 0 };
  });

  bindEvents(sections);
}

function renderSection(sec) {
  const sectionEl = document.querySelector(`[data-section="${sec.id}"]`);
  if (!sectionEl) return;

  const codeLinesEl = sectionEl.querySelector('.code-lines');
  if (!codeLinesEl) return;

  // Generate syntax-highlighted code lines
  let html = '';
  for (let lineIdx = sec.lineStart; lineIdx <= sec.lineEnd; lineIdx++) {
    const sl = program.sourceLines[lineIdx];
    if (!sl) continue;
    const relLine = lineIdx - sec.lineStart;
    const lineId = `${sec.id}-${relLine}`;
    const isEmpty = sl.text.trim() === '';
    const cls = isEmpty ? 'code-line empty-line' : 'code-line';
    const highlighted = isEmpty ? ' ' : syntaxHighlight(sl.text, program.aliases);
    html += `<span class="${cls}" data-line="${lineId}">${highlighted}</span>`;
  }
  codeLinesEl.innerHTML = html;

  // Generate register boxes
  const regvizEl = document.querySelector(`[data-regviz="${sec.id}"]`);
  if (regvizEl) {
    let regHtml = '';
    const shown = new Set();
    for (const [name, idx] of Object.entries(program.aliases)) {
      regHtml += `<div class="reg-box" data-reg="${name}"><span class="reg-name">${name}</span> <span class="reg-value" data-rv>0</span></div>`;
      shown.add(idx);
    }
    if (!shown.has(0)) {
      regHtml += `<div class="reg-box" data-reg="r0"><span class="reg-name">r0</span> <span class="reg-value" data-rv>0</span></div>`;
    }
    regvizEl.innerHTML = regHtml;
  }

  // Generate scenario selector buttons
  const scenarios = sec.scenarios || [];
  if (scenarios.length > 0) {
    const barEl = document.querySelector(`[data-scenario-bar="${sec.id}"]`);
    if (barEl) {
      let barHtml = '';
      scenarios.forEach((sc, si) => {
        const activeClass = si === 0 ? ' active' : '';
        barHtml += `<button class="scenario-btn${activeClass}" data-section-id="${sec.id}" data-scenario-idx="${si}">${escapeHtml(sc.name)}</button>`;
      });
      barEl.innerHTML = barHtml;
    }
  }
}

function computeSteps(sectionIdx, scenarioIdx) {
  const sec = allSections[sectionIdx];
  const scenarios = sec.scenarios || [];
  const scenario = scenarios[scenarioIdx || 0];

  const gridData = scenario ? scenario.grid : (sec.grid || null);
  const gridSize = gridData && gridData.size ? gridData.size : 5;
  const carrying = scenario ? !!scenario.carrying : false;

  // Build a config for the interpreter from the scenario
  const config = {
    lineStart: sec.lineStart,
    lineEnd: sec.lineEnd,
    id: sec.id,
    initRegs: scenario ? scenario.initRegs : (sec.initRegs || {}),
    envResponses: scenario ? scenario.envResponses : (sec.envResponses || []),
    descOverrides: scenario ? scenario.descOverrides : (sec.descOverrides || {}),
    maxSteps: sec.maxSteps,
    _gridSize: gridSize,
    _carrying: carrying,
  };

  const steps = executeSection(program, config);
  sectionData[sectionIdx] = { steps, scenarioIdx: scenarioIdx || 0, grid: gridData };
  return sectionData[sectionIdx];
}

function switchScenario(sectionIdx, scenarioIdx) {
  viewerState[sectionIdx].activeScenario = scenarioIdx;

  // Update button states
  const buttons = document.querySelectorAll(`[data-section-id="${sectionIdx}"].scenario-btn`);
  buttons.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.scenarioIdx, 10) === scenarioIdx);
  });

  // Recompute and reset
  computeSteps(sectionIdx, scenarioIdx);
  resetSection(sectionIdx);
  drawGrid(sectionIdx);
}

function bindEvents(sections) {
  // Click section headers to toggle open/close
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const idx = parseInt(header.dataset.toggleSection, 10);
      const sectionEl = document.querySelector(`[data-section="${idx}"]`);
      const isOpen = sectionEl.classList.contains('open');

      // Close all sections
      document.querySelectorAll('.asm-section').forEach(s => s.classList.remove('open'));
      document.querySelectorAll('.view-overview').forEach(v => v.classList.remove('hidden'));
      document.querySelectorAll('.view-detail').forEach(v => v.classList.remove('active'));
      clearAllLineHighlights();
      stopAllAnimations();

      if (!isOpen) {
        sectionEl.classList.add('open');
      }
    });
  });

  // Toggle overview <-> detail
  document.querySelectorAll('.mode-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.toggle, 10);
      const overview = document.querySelector(`[data-view-overview="${idx}"]`);
      const detail = document.querySelector(`[data-view-detail="${idx}"]`);
      const showingDetail = detail.classList.contains('active');

      if (showingDetail) {
        detail.classList.remove('active');
        overview.classList.remove('hidden');
        clearAllLineHighlights();
        stopAnimation(idx);
      } else {
        overview.classList.add('hidden');
        detail.classList.add('active');
        const scenarioIdx = viewerState[idx].activeScenario || 0;
        computeSteps(idx, scenarioIdx);
        resetSection(idx);
        drawGrid(idx);
      }
    });
  });

  // Scenario selector buttons (delegated)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.scenario-btn');
    if (!btn) return;
    e.stopPropagation();
    const sectionIdx = parseInt(btn.dataset.sectionId, 10);
    const scenarioIdx = parseInt(btn.dataset.scenarioIdx, 10);
    switchScenario(sectionIdx, scenarioIdx);
  });

  // Grid controls
  document.querySelectorAll('[data-grid-next]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); goStep(parseInt(btn.dataset.gridNext, 10), 1); });
  });
  document.querySelectorAll('[data-grid-prev]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); goStep(parseInt(btn.dataset.gridPrev, 10), -1); });
  });
  document.querySelectorAll('[data-grid-play]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.gridPlay, 10);
      const s = viewerState[idx];
      if (s.playing) {
        stopAnimation(idx);
      } else {
        const data = sectionData[idx];
        if (data && s.step >= data.steps.length - 1) resetSection(idx);
        s.playing = true;
        btn.textContent = '\u25a0 stop';
        drawGrid(idx);
        s.timer = setInterval(() => goStep(idx, 1), 800);
      }
    });
  });
}

// ── Viewer helpers ──

function clearAllLineHighlights() {
  document.querySelectorAll('.code-line.active-line').forEach(el => el.classList.remove('active-line'));
}

function resetSection(idx) {
  viewerState[idx].step = 0;
  viewerState[idx].allPainted = [];
  stopAnimation(idx);

  // Unlock dimensions so it can reflow for new scenario
  const detailLeft = document.querySelector(`[data-view-detail="${idx}"] .detail-left`);
  if (detailLeft) {
    detailLeft.style.minHeight = '';
    detailLeft.style.width = '';
  }

  updateHighlights(idx);
  updateRegisters(idx);
  updateStatus(idx);
  updateDesc(idx);

  // After first render, lock both width and height to prevent reflow during stepping
  if (detailLeft) {
    requestAnimationFrame(() => {
      detailLeft.style.width = detailLeft.offsetWidth + 'px';
      detailLeft.style.minHeight = detailLeft.offsetHeight + 'px';
    });
  }
}

function stopAnimation(idx) {
  const s = viewerState[idx];
  if (!s) return;
  if (s.timer) { clearInterval(s.timer); s.timer = null; }
  s.playing = false;
  const btn = document.querySelector(`[data-grid-play="${idx}"]`);
  if (btn) btn.textContent = '\u25b6 play';
}

function stopAllAnimations() {
  for (const idx of Object.keys(viewerState)) stopAnimation(parseInt(idx, 10));
}

function updateHighlights(idx) {
  clearAllLineHighlights();
  const data = sectionData[idx];
  if (!data) return;
  const step = data.steps[viewerState[idx].step];
  if (step && step.highlightLines) {
    for (const lineId of step.highlightLines) {
      const el = document.querySelector(`[data-line="${lineId}"]`);
      if (el) {
        el.classList.add('active-line');
        // Auto-scroll the code pane to keep active line visible
        const codeLines = el.closest('.code-lines');
        if (codeLines) {
          const elTop = el.offsetTop - codeLines.offsetTop;
          const elBottom = elTop + el.offsetHeight;
          const viewTop = codeLines.scrollTop;
          const viewBottom = viewTop + codeLines.clientHeight;
          if (elTop < viewTop || elBottom > viewBottom) {
            codeLines.scrollTop = elTop - codeLines.clientHeight / 3;
          }
        }
      }
    }
  }
}

function updateDesc(idx) {
  const el = document.querySelector(`[data-detail-desc="${idx}"]`);
  const data = sectionData[idx];
  if (!el || !data) return;
  const step = data.steps[viewerState[idx].step];
  el.innerHTML = step ? step.desc : '';
}

function updateRegisters(idx) {
  const data = sectionData[idx];
  if (!data) return;
  const s = viewerState[idx];
  const step = data.steps[s.step];
  const prevStep = s.step > 0 ? data.steps[s.step - 1] : null;
  const viz = document.querySelector(`[data-regviz="${idx}"]`);
  if (!viz || !step) return;

  viz.querySelectorAll('.reg-box').forEach(box => {
    const regName = box.dataset.reg;
    const valEl = box.querySelector('[data-rv]');
    if (step.regs[regName] !== undefined) {
      valEl.textContent = step.regs[regName];
    }
    const changed = prevStep && prevStep.regs[regName] !== step.regs[regName];
    box.classList.toggle('changed', !!changed);
  });
}

function updateStatus(idx) {
  const el = document.querySelector(`[data-grid-status="${idx}"]`);
  const data = sectionData[idx];
  if (!el || !data) return;
  const s = viewerState[idx];
  const step = data.steps[s.step];
  el.textContent = `step ${s.step} / ${data.steps.length - 1}` + (step && step.label ? ` \u2014 ${step.label}` : '');
}

// Direction constants for grid offset: N=1 E=2 S=3 W=4
const DIR_DX = { 0:0, 1:0, 2:1, 3:0, 4:-1 };
const DIR_DY = { 0:0, 1:-1, 2:0, 3:1, 4:0 };
const DIR_NAMES = { 'N':1,'E':2,'S':3,'W':4,'HERE':0,'1':1,'2':2,'3':3,'4':4,'0':0 };

function resolveSenseDir(dirStr, state) {
  if (DIR_NAMES[dirStr] !== undefined) return DIR_NAMES[dirStr];
  // Could be a register name — try to resolve
  const num = parseInt(dirStr, 10);
  return isNaN(num) ? 0 : num;
}

const PHEROMONE_COLORS = {
  CH_YELLOW: { r:220, g:200, b:50 },
  CH_BLUE:   { r:88, g:168, b:255 },
  CH_GREEN:  { r:56, g:216, b:112 },
  CH_RED:    { r:232, g:76, b:76 },
};

function getGridSize(idx) {
  // Check if current scenario specifies a grid size, default to 5
  const data = sectionData[idx];
  if (!data || !data.grid) return 5;
  return data.grid.size || 5;
}

function drawGrid(idx) {
  const canvas = document.querySelector(`[data-grid="${idx}"]`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const data = sectionData[idx];
  if (!data) return;
  const s = viewerState[idx];
  const step = data.steps[s.step];
  if (!step) return;

  const gridSize = getGridSize(idx);
  let cellW = w / gridSize, cellH = h / gridSize;
  const center = Math.floor(gridSize / 2);

  const grid = data.grid || null;
  const antX = step.ant ? step.ant.x : center;
  const antY = step.ant ? step.ant.y : center;

  // Collect marks from all steps up to current
  const accumulatedMarks = [];
  for (let i = 0; i <= s.step; i++) {
    const st = data.steps[i];
    if (st && st.senseEffect && st.senseEffect.type === 'mark') {
      const markAntX = st.ant ? st.ant.x : center;
      const markAntY = st.ant ? st.ant.y : center;
      accumulatedMarks.push({ x: markAntX, y: markAntY, channel: st.senseEffect.channel, value: st.senseEffect.value });
    }
  }

  // Snap canvas and CSS size to exact grid multiple for crisp lines
  const cssBase = 192;
  const cellPx = Math.floor(cssBase / gridSize);
  const displaySize = cellPx * gridSize;
  canvas.width = displaySize;
  canvas.height = displaySize;
  canvas.style.width = displaySize + 'px';
  canvas.style.height = displaySize + 'px';
  cellW = cellPx;
  cellH = cellPx;

  // Clear
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, displaySize, displaySize);

  // Grid lines
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= gridSize; i++) {
    const pos = i * cellPx + 0.5;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, displaySize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(displaySize, pos);
    ctx.stroke();
  }

  // Build set of cells currently being sniffed
  const sniffedCells = new Set();
  if (step.senseEffect && step.senseEffect.type === 'sniff') {
    const se = step.senseEffect;
    const dir = resolveSenseDir(se.dir);
    const tx = antX + (DIR_DX[dir] || 0);
    const ty = antY + (DIR_DY[dir] || 0);
    sniffedCells.add(`${tx},${ty}`);
  }

  // ── Draw scenario environment ──
  if (grid) {
    // Pheromones — solid colored cells, unless being sniffed
    const pheroKeys = ['yellow','blue','green','red'];
    const pheroChannels = { yellow: PHEROMONE_COLORS.CH_YELLOW, blue: PHEROMONE_COLORS.CH_BLUE,
                           green: PHEROMONE_COLORS.CH_GREEN, red: PHEROMONE_COLORS.CH_RED };
    for (const key of pheroKeys) {
      if (!grid[key]) continue;
      const pc = pheroChannels[key];
      for (const p of grid[key]) {
        const cellKey = `${p.x},${p.y}`;
        if (sniffedCells.has(cellKey)) continue;
        const onAnt = (p.x === antX && p.y === antY);
        ctx.fillStyle = `rgba(${pc.r},${pc.g},${pc.b},${onAnt ? 0.2 : 0.55})`;
        ctx.fillRect(p.x * cellW + 1, p.y * cellH + 1, cellW - 2, cellH - 2);
      }
    }

    // Nest
    if (grid.nest) {
      const nx = grid.nest.x, ny = grid.nest.y;
      if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
        ctx.fillStyle = 'rgba(60, 216, 168, 0.25)';
        ctx.fillRect(nx * cellW + 1, ny * cellH + 1, cellW - 2, cellH - 2);
        ctx.fillStyle = '#3cd8a8';
        ctx.font = `${cellW * 0.4}px JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u2302', nx * cellW + cellW/2, ny * cellH + cellH/2);
      }
    }

    // Food
    if (grid.food) {
      for (const f of grid.food) {
        ctx.fillStyle = 'rgba(56, 216, 112, 0.35)';
        ctx.fillRect(f.x * cellW + 2, f.y * cellH + 2, cellW - 4, cellH - 4);
        ctx.fillStyle = '#38d870';
        ctx.font = `bold ${cellW * 0.35}px JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u2666', f.x * cellW + cellW/2, f.y * cellH + cellH/2);
      }
    }

    // Walls — solid filled squares
    if (grid.walls) {
      for (const wl of grid.walls) {
        ctx.fillStyle = '#1a2e26';
        ctx.fillRect(wl.x * cellW, wl.y * cellH, cellW, cellH);
        ctx.fillStyle = '#243e34';
        ctx.fillRect(wl.x * cellW + 3, wl.y * cellH + 3, cellW - 6, cellH - 6);
      }
    }
  }

  // ── Accumulated MARK pheromones ──
  for (const mk of accumulatedMarks) {
    // Don't draw on current step if it's the active sense effect (will be drawn with number)
    if (step.senseEffect && step.senseEffect.type === 'mark' && mk.x === antX && mk.y === antY) continue;
    const pc = PHEROMONE_COLORS[mk.channel] || PHEROMONE_COLORS.CH_YELLOW;
    ctx.fillStyle = `rgba(${pc.r},${pc.g},${pc.b},0.55)`;
    ctx.fillRect(mk.x * cellW + 1, mk.y * cellH + 1, cellW - 2, cellH - 2);
  }

  // ── Sense effect overlay ──
  if (step.senseEffect) {
    const se = step.senseEffect;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (se.type === 'sniff') {
      const dir = resolveSenseDir(se.dir);
      const tx = antX + (DIR_DX[dir] || 0);
      const ty = antY + (DIR_DY[dir] || 0);
      if (tx >= 0 && tx < gridSize && ty >= 0 && ty < gridSize) {
        const pc = PHEROMONE_COLORS[se.channel] || PHEROMONE_COLORS.CH_YELLOW;
        ctx.fillStyle = `rgba(${pc.r},${pc.g},${pc.b},${se.value > 0 ? 0.2 : 0.08})`;
        ctx.fillRect(tx * cellW + 1, ty * cellH + 1, cellW - 2, cellH - 2);
        ctx.strokeStyle = `rgba(${pc.r},${pc.g},${pc.b},0.8)`;
        ctx.lineWidth = 2;
        ctx.strokeRect(tx * cellW + 2, ty * cellH + 2, cellW - 4, cellH - 4);
        ctx.fillStyle = se.value > 0 ? `rgb(${pc.r},${pc.g},${pc.b})` : '#338f70';
        ctx.font = `bold ${cellW * 0.35}px JetBrains Mono, monospace`;
        ctx.fillText(String(se.value), tx * cellW + cellW/2, ty * cellH + cellH/2);
      }
    }
    else if (se.type === 'smell') {
      const pc = PHEROMONE_COLORS[se.channel] || PHEROMONE_COLORS.CH_YELLOW;
      const dimColor = `rgba(${pc.r},${pc.g},${pc.b},0.15)`;
      // Show all 4 directions being smelled
      for (let d = 1; d <= 4; d++) {
        const tx = antX + DIR_DX[d];
        const ty = antY + DIR_DY[d];
        if (tx < 0 || tx >= gridSize || ty < 0 || ty >= gridSize) continue;
        if (d === se.value) {
          // Strongest signal here
          ctx.strokeStyle = `rgba(${pc.r},${pc.g},${pc.b},0.8)`;
          ctx.lineWidth = 2;
          ctx.strokeRect(tx * cellW + 2, ty * cellH + 2, cellW - 4, cellH - 4);
          ctx.fillStyle = `rgb(${pc.r},${pc.g},${pc.b})`;
          ctx.font = `bold ${cellW * 0.35}px JetBrains Mono, monospace`;
          ctx.fillText('\u2191\u2192\u2193\u2190'[se.value - 1], tx * cellW + cellW/2, ty * cellH + cellH/2);
        } else {
          // Scanned, not strongest
          ctx.strokeStyle = dimColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(tx * cellW + 3, ty * cellH + 3, cellW - 6, cellH - 6);
        }
      }
    }
    else if (se.type === 'sense') {
      const color = se.target === 'FOOD' ? '#38d870' : se.target === 'NEST' ? '#3cd8a8' : '#58a8ff';
      // Show all 4 adjacent cells being scanned
      for (let d = 1; d <= 4; d++) {
        const tx = antX + DIR_DX[d];
        const ty = antY + DIR_DY[d];
        if (tx < 0 || tx >= gridSize || ty < 0 || ty >= gridSize) continue;
        if (d === se.value) {
          // Found here — bright filled cell
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.4;
          ctx.fillRect(tx * cellW + 1, ty * cellH + 1, cellW - 2, cellH - 2);
          ctx.globalAlpha = 1;
          const icon = se.target === 'FOOD' ? '\u2666' : se.target === 'NEST' ? '\u2302' : '!';
          ctx.fillStyle = color;
          ctx.font = `bold ${cellW * 0.4}px JetBrains Mono, monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(icon, tx * cellW + cellW/2, ty * cellH + cellH/2);
        } else {
          // Scanned, nothing — dim filled cell
          ctx.fillStyle = 'rgba(60,216,168,0.06)';
          ctx.fillRect(tx * cellW + 1, ty * cellH + 1, cellW - 2, cellH - 2);
        }
      }
    }
    else if (se.type === 'probe') {
      const dir = resolveSenseDir(se.dir);
      if (dir > 0 && dir <= 4) {
        const tx = antX + DIR_DX[dir];
        const ty = antY + DIR_DY[dir];
        if (tx >= 0 && tx < gridSize && ty >= 0 && ty < gridSize) {
          const isWall = se.value === 1;
          ctx.strokeStyle = isWall ? '#e84c4c' : '#38d870';
          ctx.lineWidth = 2;
          ctx.strokeRect(tx * cellW + 2, ty * cellH + 2, cellW - 4, cellH - 4);
          ctx.fillStyle = isWall ? '#e84c4c' : '#38d870';
          ctx.font = `bold ${cellW * 0.35}px JetBrains Mono, monospace`;
          ctx.fillText(isWall ? '\u2588' : '\u2713', tx * cellW + cellW/2, ty * cellH + cellH/2);
        }
      }
    }
    else if (se.type === 'move') {
      // Show trail from previous position
      const prevX = antX - (DIR_DX[se.dir] || 0);
      const prevY = antY - (DIR_DY[se.dir] || 0);
      if (prevX >= 0 && prevX < gridSize && prevY >= 0 && prevY < gridSize) {
        ctx.fillStyle = 'rgba(60, 216, 168, 0.15)';
        ctx.fillRect(prevX * cellW + 1, prevY * cellH + 1, cellW - 2, cellH - 2);
      }
    }
    else if (se.type === 'mark') {
      const pc = PHEROMONE_COLORS[se.channel] || PHEROMONE_COLORS.CH_YELLOW;
      ctx.fillStyle = `rgba(${pc.r},${pc.g},${pc.b},0.55)`;
      ctx.fillRect(antX * cellW + 1, antY * cellH + 1, cellW - 2, cellH - 2);
      ctx.strokeStyle = `rgba(${pc.r},${pc.g},${pc.b},0.8)`;
      ctx.lineWidth = 2;
      ctx.strokeRect(antX * cellW + 2, antY * cellH + 2, cellW - 4, cellH - 4);
      ctx.fillStyle = `rgb(${pc.r},${pc.g},${pc.b})`;
      ctx.font = `bold ${cellW * 0.3}px JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(se.value), antX * cellW + cellW/2, antY * cellH + cellH * 0.3);
    }
    // carrying is handled by ant color below, not a separate overlay
  }

  // ── Ant ──
  if (step.ant) {
    const ax = step.ant.x, ay = step.ant.y, dir = step.ant.dir;
    const cx = ax * cellW + cellW / 2, cy = ay * cellH + cellH / 2;
    const sz = cellW * 0.35;

    // Determine if ant is carrying food
    const isCarrying = step.ant.carrying || false;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(dir * Math.PI / 2);

    ctx.shadowColor = isCarrying ? '#ffaa00' : COLORS.ant;
    ctx.shadowBlur = 12;

    // Ant body — amber/orange when carrying, normal teal when empty
    ctx.fillStyle = isCarrying ? '#ffaa00' : COLORS.ant;
    ctx.beginPath();
    ctx.moveTo(0, -sz);
    ctx.lineTo(-sz * 0.7, sz * 0.6);
    ctx.lineTo(sz * 0.7, sz * 0.6);
    ctx.closePath();
    ctx.fill();

    // Food diamond when carrying
    if (isCarrying) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      const ds = sz * 0.22;
      ctx.beginPath();
      ctx.moveTo(0, -ds);
      ctx.lineTo(ds, 0);
      ctx.moveTo(0, ds);
      ctx.lineTo(-ds, 0);
      ctx.closePath();
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function goStep(idx, dir) {
  const data = sectionData[idx];
  if (!data) return;
  const s = viewerState[idx];
  const maxStep = data.steps.length - 1;

  if (dir > 0 && data.steps[s.step].painted) {
    for (const p of data.steps[s.step].painted) s.allPainted.push(p);
  }

  s.step = Math.max(0, Math.min(maxStep, s.step + dir));

  if (dir < 0) {
    s.allPainted = [];
    for (let i = 0; i < s.step; i++) {
      if (data.steps[i].painted) {
        for (const p of data.steps[i].painted) s.allPainted.push(p);
      }
    }
  }

  updateHighlights(idx);
  updateRegisters(idx);
  updateStatus(idx);
  updateDesc(idx);
  drawGrid(idx);

  if (s.step >= maxStep) stopAnimation(idx);
}
