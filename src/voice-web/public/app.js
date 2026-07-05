(() => {
  const LANG_KEY = 'voice-web-ui-lang';
  const RECORD_MODE_KEY = 'voice-web-record-mode';

  const AGENT_GRADIENTS = [
    'from-blue-500 to-blue-700 shadow-blue-900/40',
    'from-emerald-500 to-emerald-700 shadow-emerald-900/40',
    'from-amber-500 to-amber-700 shadow-amber-900/40',
    'from-rose-500 to-rose-700 shadow-rose-900/40',
  ];

  const AGENT_HINT_COLORS = [
    'text-blue-100/80',
    'text-emerald-100/80',
    'text-amber-100/80',
    'text-rose-100/80',
  ];

  const I18N = {
    ja: {
      pageTitle: 'Mindcraft 音声対話',
      subtitleHold: 'ボタンを押したまま話し、離して送信',
      subtitleToggle: 'タップで録音開始、もう一度タップで停止・送信',
      shareScanHint: 'スマホで QR をスキャン（マイク利用には HTTPS が必要）',
      langLabel: '認識言語',
      recordModeLabel: '入力方式',
      recordModeHold: '押したまま話す',
      recordModeToggle: 'タップで切替',
      callAgent: '{label} を呼ぶ',
      holdToTalk: '押したまま話す',
      tapToToggle: 'タップで開始/停止',
      broadcast: '全員に放送',
      broadcastHint: '{names} が聞きます',
      broadcastHintNone: '接続中のエージェントが聞きます',
      statusConnecting: '接続中…',
      shareHintNgrok: 'ngrok 公開リンク — スキャンしてマイクを使えます',
      shareHintLocalWait: 'ngrok トンネル待機中…ローカル URL は PC デバッグ用',
      shareHintCurrent: '現在のページリンク',
      qrAlt: 'VoiceWeb 共有 QR コード',
      qrAltUrl: 'スキャンして開く {url}',
      statusHttpsRequired: 'スマホのマイクには HTTPS が必要です。ngrok リンクまたは上の QR を使ってください。',
      btnEnableMicHttp: '非セキュア接続（HTTP）— マイクは使えません',
      btnEnableMic: 'マイクを許可する',
      micDenied: 'マイクの権限が拒否されました。ブラウザのサイト設定でマイクを許可し、「マイクを許可する」を押してください。',
      micNotFound: 'マイクが見つかりません。',
      micNotSupportedHttps: 'HTTPS 以外ではマイクを使えません。上の QR から ngrok で開いてください。',
      micNotSupported: 'ブラウザが録音に対応していません：{message}',
      micNoApi: 'このブラウザはマイクに対応していません（Safari/Chrome を使用し、WeChat 内蔵ブラウザは避けてください）。',
      micError: 'マイクエラー：{message}',
      statusNeedHttps: 'スマホのマイクには HTTPS が必要です。上の QR をスキャンしてください。',
      statusNoMicApi: 'このブラウザはマイク API に対応していません。Safari または Chrome をお試しください。',
      statusMicReadyHold: 'マイク準備完了 — ボタンを押したまま話してください',
      statusMicReadyToggle: 'マイク準備完了 — タップで録音開始/停止',
      statusConnectedHold: '接続済み — ボタンを押したまま話してください',
      statusConnectedToggle: '接続済み — タップで録音開始/停止',
      statusConnectedNeedMicHold: '接続済み — 「マイクを許可する」を押すか、ボタンを押したまま話してください',
      statusConnectedNeedMicToggle: '接続済み — 「マイクを許可する」を押すか、タップで録音してください',
      statusDisconnected: '切断されました。再接続中…',
      statusWsError: 'WebSocket エラー',
      statusTestReceived: 'テスト受信 {bytes} バイト ({format})',
      statusSent: '{label} に送信：{transcript}',
      statusSendFailed: '送信失敗',
      statusServerError: 'サーバーエラー',
      statusInvalidResponse: '無効な応答を受信しました',
      statusNotConnected: 'サーバー未接続',
      statusRecording: '録音中 ({label})…',
      statusRecordFailed: '録音を開始できません：{message}',
      statusNoAudio: '音声が録音されませんでした',
      statusUploading: 'アップロード中 ({size} KB)…',
      statusUploadFailed: 'アップロード失敗：{message}',
      broadcastLabel: '全員',
      agentsLoading: 'エージェント読み込み中…',
    },
    zh: {
      pageTitle: 'Mindcraft 语音对讲',
      subtitleHold: '按住按钮说话，松开发送',
      subtitleToggle: '点击开始录音，再点一次停止并发送',
      shareScanHint: '手机扫码打开（需 HTTPS 才能用麦克风）',
      langLabel: '识别语言',
      recordModeLabel: '输入方式',
      recordModeHold: '按住说话',
      recordModeToggle: '点击开关',
      callAgent: '呼叫 {label}',
      holdToTalk: '按住说话',
      tapToToggle: '点击开始/停止',
      broadcast: '全员广播',
      broadcastHint: '{names} 都会听到',
      broadcastHintNone: '当前连接的 agent 都会听到',
      statusConnecting: '连接中…',
      shareHintNgrok: 'ngrok 公网链接 — 手机扫码即可使用麦克风',
      shareHintLocalWait: '等待 ngrok 隧道…本地地址仅供电脑调试',
      shareHintCurrent: '当前页面链接',
      qrAlt: 'VoiceWeb 分享二维码',
      qrAltUrl: '扫码打开 {url}',
      statusHttpsRequired: '手机麦克风需要 HTTPS。请用 ngrok 链接或扫码上方二维码。',
      btnEnableMicHttp: '当前为非安全连接（HTTP）— 麦克风不可用',
      btnEnableMic: '点击授权麦克风',
      micDenied: '麦克风权限被拒绝。请在浏览器设置 → 网站设置中允许麦克风，然后点「授权麦克风」。',
      micNotFound: '未检测到麦克风设备。',
      micNotSupportedHttps: '非 HTTPS 页面无法使用麦克风。请扫描上方二维码用 ngrok 打开。',
      micNotSupported: '浏览器不支持录音：{message}',
      micNoApi: '此浏览器不支持麦克风（请用 Safari/Chrome 打开，勿用微信内置浏览器）。',
      micError: '麦克风错误：{message}',
      statusNeedHttps: '需要 HTTPS 才能使用手机麦克风。请扫描上方二维码。',
      statusNoMicApi: '此浏览器不支持麦克风 API。请换 Safari 或 Chrome。',
      statusMicReadyHold: '麦克风已就绪 — 按住按钮说话',
      statusMicReadyToggle: '麦克风已就绪 — 点击开始/停止录音',
      statusConnectedHold: '已连接 — 按住按钮说话',
      statusConnectedToggle: '已连接 — 点击开始/停止录音',
      statusConnectedNeedMicHold: '已连接 — 请先点「授权麦克风」或按住按钮说话',
      statusConnectedNeedMicToggle: '已连接 — 请先点「授权麦克风」或点击按钮录音',
      statusDisconnected: '连接已断开，正在重连…',
      statusWsError: 'WebSocket 错误',
      statusTestReceived: '测试收到 {bytes} 字节 ({format})',
      statusSent: '已发送 {label}：{transcript}',
      statusSendFailed: '发送失败',
      statusServerError: '服务器错误',
      statusInvalidResponse: '收到无效响应',
      statusNotConnected: '未连接服务器',
      statusRecording: '正在录音 ({label})…',
      statusRecordFailed: '无法开始录音：{message}',
      statusNoAudio: '未录到音频',
      statusUploading: '上传中 ({size} KB)…',
      statusUploadFailed: '上传失败：{message}',
      broadcastLabel: '全员',
      agentsLoading: '正在加载 agent…',
    },
    en: {
      pageTitle: 'Mindcraft Voice',
      subtitleHold: 'Hold to talk, release to send',
      subtitleToggle: 'Tap to start recording, tap again to stop and send',
      shareScanHint: 'Scan QR on your phone (HTTPS required for microphone)',
      langLabel: 'Recognition language',
      recordModeLabel: 'Input mode',
      recordModeHold: 'Hold to talk',
      recordModeToggle: 'Tap toggle',
      callAgent: 'Call {label}',
      holdToTalk: 'Hold to talk',
      tapToToggle: 'Tap to start/stop',
      broadcast: 'Broadcast to all',
      broadcastHint: '{names} will hear you',
      broadcastHintNone: 'All connected agents will hear you',
      statusConnecting: 'Connecting…',
      shareHintNgrok: 'ngrok public link — scan to use the microphone on your phone',
      shareHintLocalWait: 'Waiting for ngrok tunnel… local URL is for desktop debugging only',
      shareHintCurrent: 'Current page link',
      qrAlt: 'VoiceWeb share QR code',
      qrAltUrl: 'Scan to open {url}',
      statusHttpsRequired: 'Phone microphone requires HTTPS. Use the ngrok link or scan the QR code above.',
      btnEnableMicHttp: 'Insecure connection (HTTP) — microphone unavailable',
      btnEnableMic: 'Allow microphone',
      micDenied: 'Microphone permission denied. Allow microphone in browser site settings, then tap “Allow microphone”.',
      micNotFound: 'No microphone device found.',
      micNotSupportedHttps: 'Microphone requires HTTPS. Scan the QR code above to open via ngrok.',
      micNotSupported: 'Recording not supported in this browser: {message}',
      micNoApi: 'This browser does not support the microphone (use Safari/Chrome; avoid in-app browsers like WeChat).',
      micError: 'Microphone error: {message}',
      statusNeedHttps: 'HTTPS is required for the phone microphone. Scan the QR code above.',
      statusNoMicApi: 'This browser does not support the microphone API. Try Safari or Chrome.',
      statusMicReadyHold: 'Microphone ready — hold a button to talk',
      statusMicReadyToggle: 'Microphone ready — tap to start/stop recording',
      statusConnectedHold: 'Connected — hold a button to talk',
      statusConnectedToggle: 'Connected — tap to start/stop recording',
      statusConnectedNeedMicHold: 'Connected — tap “Allow microphone” or hold a button to talk',
      statusConnectedNeedMicToggle: 'Connected — tap “Allow microphone” or tap a button to record',
      statusDisconnected: 'Disconnected — reconnecting…',
      statusWsError: 'WebSocket error',
      statusTestReceived: 'Test received {bytes} bytes ({format})',
      statusSent: 'Sent to {label}: {transcript}',
      statusSendFailed: 'Send failed',
      statusServerError: 'Server error',
      statusInvalidResponse: 'Received invalid response',
      statusNotConnected: 'Not connected to server',
      statusRecording: 'Recording ({label})…',
      statusRecordFailed: 'Could not start recording: {message}',
      statusNoAudio: 'No audio recorded',
      statusUploading: 'Uploading ({size} KB)…',
      statusUploadFailed: 'Upload failed: {message}',
      broadcastLabel: 'Everyone',
      agentsLoading: 'Loading agents…',
    },
  };

  const statusEl = document.getElementById('status');
  const wsStateEl = document.getElementById('wsState');
  const langSelect = document.getElementById('langSelect');
  const recordModeSelect = document.getElementById('recordModeSelect');
  const btnEnableMic = document.getElementById('btnEnableMic');
  const shareLinkEl = document.getElementById('shareLink');
  const shareHintEl = document.getElementById('shareHint');
  const shareQrEl = document.getElementById('shareQr');
  const agentButtonsEl = document.getElementById('agentButtons');
  const btnBroadcast = document.getElementById('btnBroadcast');

  let ws = null;
  let mediaStream = null;
  let mediaRecorder = null;
  let chunks = [];
  let activeAgent = null;
  let activeBtn = null;
  let recording = false;
  let touchActive = false;
  let reconnectTimer = null;
  let micReady = false;
  let shareUrl = location.href;
  let lastShareSource = 'local';
  let lastStatus = { key: 'statusConnecting', vars: {}, isError: false };
  let micButtonMode = 'default';
  let agentsList = [];
  let talkButtons = [];

  const MIME_CANDIDATES = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];

  function uiLang() {
    return langSelect.value;
  }

  function t(key, vars = {}) {
    const table = I18N[uiLang()] || I18N.ja;
    let str = table[key] ?? I18N.ja[key] ?? key;
    for (const [name, value] of Object.entries(vars)) {
      str = str.replaceAll(`{${name}}`, String(value));
    }
    return str;
  }

  function normalizeLang(value) {
    if (!value) return 'ja';
    const v = value.toLowerCase();
    if (v.startsWith('ja')) return 'ja';
    if (v.startsWith('zh')) return 'zh';
    if (v.startsWith('en')) return 'en';
    return 'ja';
  }

  function getRecordMode() {
    return recordModeSelect.value === 'toggle' ? 'toggle' : 'hold';
  }

  function agentHintKey() {
    return getRecordMode() === 'toggle' ? 'tapToToggle' : 'holdToTalk';
  }

  function setStatusKey(key, vars = {}, isError = false) {
    lastStatus = { key, vars, isError };
    statusEl.textContent = t(key, vars);
    statusEl.className = isError
      ? 'text-sm text-red-400 min-h-[2.5rem]'
      : 'text-sm text-slate-400 min-h-[2.5rem]';
  }

  function setStatusRaw(text, isError = false) {
    lastStatus = { raw: text, isError };
    statusEl.textContent = text;
    statusEl.className = isError
      ? 'text-sm text-red-400 min-h-[2.5rem]'
      : 'text-sm text-slate-400 min-h-[2.5rem]';
  }

  function refreshMicButtonText() {
    btnEnableMic.textContent =
      micButtonMode === 'http' ? t('btnEnableMicHttp') : t('btnEnableMic');
  }

  function broadcastAgentNames() {
    if (!agentsList.length) return '';
    return agentsList.map((a) => a.label).join(uiLang() === 'en' ? ' and ' : '、');
  }

  function updateBroadcastHint() {
    const names = broadcastAgentNames();
    document.getElementById('i18n-broadcastHint').textContent = names
      ? t('broadcastHint', { names })
      : t('broadcastHintNone');
  }

  function updateAgentButtonHints() {
    const hint = t(agentHintKey());
    talkButtons.forEach((btn) => {
      const hintEl = btn.querySelector('[data-role="agent-hint"]');
      if (hintEl) hintEl.textContent = hint;
    });
  }

  function applyUiLanguage() {
    const lang = uiLang();
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
    document.title = t('pageTitle');

    document.getElementById('i18n-title').textContent = t('pageTitle');
    document.getElementById('i18n-subtitle').textContent =
      getRecordMode() === 'toggle' ? t('subtitleToggle') : t('subtitleHold');
    document.getElementById('i18n-shareScanHint').textContent = t('shareScanHint');
    document.getElementById('i18n-langLabel').textContent = t('langLabel');
    document.getElementById('i18n-recordModeLabel').textContent = t('recordModeLabel');
    recordModeSelect.options[0].textContent = t('recordModeHold');
    recordModeSelect.options[1].textContent = t('recordModeToggle');
    document.getElementById('i18n-broadcast').textContent = t('broadcast');

    talkButtons.forEach((btn) => {
      const labelEl = btn.querySelector('[data-role="agent-call"]');
      if (labelEl) {
        const agent = btn.dataset.agent;
        if (agent === 'broadcast') return;
        const info = agentsList.find((a) => a.name === agent);
        labelEl.textContent = t('callAgent', { label: info?.label || agent });
      }
    });

    updateBroadcastHint();
    updateAgentButtonHints();
    refreshMicButtonText();
    updateShareHint(lastShareSource);

    if (lastStatus.raw != null) {
      setStatusRaw(lastStatus.raw, lastStatus.isError);
    } else if (lastStatus.key) {
      setStatusKey(lastStatus.key, lastStatus.vars, lastStatus.isError);
    }
  }

  function agentLabel(agent) {
    if (agent === 'broadcast') return t('broadcastLabel');
    const info = agentsList.find((a) => a.name === agent);
    return info?.label || agent;
  }

  function wsUrl() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${location.host}/ws`;
  }

  function isLocalhost() {
    const h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  }

  function updateShareHint(source) {
    lastShareSource = source;
    if (source === 'ngrok') {
      shareHintEl.textContent = t('shareHintNgrok');
    } else if (isLocalhost()) {
      shareHintEl.textContent = t('shareHintLocalWait');
    } else {
      shareHintEl.textContent = t('shareHintCurrent');
    }
  }

  async function renderShareQr(url, source) {
    shareUrl = url;
    shareLinkEl.href = url;
    shareLinkEl.textContent = url;
    updateShareHint(source);

    shareQrEl.src = `/api/share-qr?_=${Date.now()}`;
    shareQrEl.alt = t('qrAltUrl', { url });
  }

  async function refreshShareUrl() {
    try {
      const res = await fetch('/api/share-url');
      if (!res.ok) return;
      const data = await res.json();
      if (data.shareUrl) {
        await renderShareQr(data.shareUrl, data.source);
      }
    } catch {
      await renderShareQr(location.href, 'local');
    }
  }

  function rebuildTalkButtons() {
    talkButtons = [
      ...agentButtonsEl.querySelectorAll('[data-agent]:not([data-agent="broadcast"])'),
      btnBroadcast,
    ];
  }

  function renderAgentButtons(agents) {
    const signature = agents.map((a) => `${a.name}:${a.label}:${a.in_game}`).join('|');
    if (signature === renderAgentButtons.lastSignature) return;
    if (recording) return;
    renderAgentButtons.lastSignature = signature;

    agentsList = agents;

    agentButtonsEl.querySelectorAll('[data-agent]:not([data-agent="broadcast"])').forEach((el) => {
      el.remove();
    });

    agents.forEach((agent, index) => {
      const gradient = AGENT_GRADIENTS[index % AGENT_GRADIENTS.length];
      const hintColor = AGENT_HINT_COLORS[index % AGENT_HINT_COLORS.length];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.agent = agent.name;
      btn.className = `ptt-btn relative w-full min-h-[24vh] rounded-3xl bg-gradient-to-br ${gradient} font-bold text-2xl shadow-lg flex flex-col items-center justify-center gap-2`;
      if (!agent.in_game) btn.classList.add('opacity-70');
      btn.innerHTML = `
        <span class="text-4xl">🎙</span>
        <span data-role="agent-call">${t('callAgent', { label: agent.label })}</span>
        <span data-role="agent-hint" class="text-sm font-normal ${hintColor}">${t(agentHintKey())}</span>
      `;
      agentButtonsEl.insertBefore(btn, btnBroadcast);
      bindTalkButton(btn);
    });

    rebuildTalkButtons();
    updateBroadcastHint();
    applyMicDeniedState();
  }

  async function refreshAgents() {
    try {
      const res = await fetch('/api/agents');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.agents)) {
        renderAgentButtons(data.agents);
      }
    } catch {
      // keep existing buttons if any
    }
  }

  function applyMicDeniedState() {
    if (!micReady && !window.isSecureContext) return;
    talkButtons.forEach((b) => {
      if (!micReady) b.classList.add('mic-denied');
      else b.classList.remove('mic-denied');
    });
  }

  function checkSecureContext() {
    if (window.isSecureContext) return true;
    setStatusKey('statusHttpsRequired', {}, true);
    btnEnableMic.classList.remove('hidden');
    micButtonMode = 'http';
    refreshMicButtonText();
    btnEnableMic.disabled = true;
    btnEnableMic.classList.add('opacity-60', 'cursor-not-allowed');
    talkButtons.forEach((b) => b.classList.add('mic-denied'));
    return false;
  }

  function micErrorMessage(err) {
    const name = err?.name || '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return t('micDenied');
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return t('micNotFound');
    }
    if (name === 'NotSupportedError' || name === 'SecurityError') {
      if (!window.isSecureContext) {
        return t('micNotSupportedHttps');
      }
      return t('micNotSupported', { message: err.message });
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      return t('micNoApi');
    }
    return t('micError', { message: err?.message || name || 'unknown' });
  }

  function showMicButton() {
    if (micReady || !window.isSecureContext) return;
    btnEnableMic.classList.remove('hidden');
    btnEnableMic.disabled = false;
    micButtonMode = 'default';
    refreshMicButtonText();
    btnEnableMic.classList.remove('opacity-60', 'cursor-not-allowed');
  }

  function hideMicButton() {
    btnEnableMic.classList.add('hidden');
  }

  function connectedStatusKey(needMic = false) {
    const toggle = getRecordMode() === 'toggle';
    if (needMic) return toggle ? 'statusConnectedNeedMicToggle' : 'statusConnectedNeedMicHold';
    return toggle ? 'statusConnectedToggle' : 'statusConnectedHold';
  }

  async function requestMic(fromUserGesture = false) {
    if (mediaStream) {
      micReady = true;
      return true;
    }

    if (!window.isSecureContext) {
      setStatusKey('statusNeedHttps', {}, true);
      return false;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatusKey('statusNoMicApi', {}, true);
      talkButtons.forEach((b) => b.classList.add('mic-denied'));
      return false;
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micReady = true;
      hideMicButton();
      talkButtons.forEach((b) => b.classList.remove('mic-denied'));
      setStatusKey(getRecordMode() === 'toggle' ? 'statusMicReadyToggle' : 'statusMicReadyHold');
      return true;
    } catch (err) {
      console.warn('getUserMedia failed:', err);
      setStatusRaw(micErrorMessage(err), true);
      talkButtons.forEach((b) => b.classList.add('mic-denied'));
      if (fromUserGesture) showMicButton();
      return false;
    }
  }

  function connectWs() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    ws = new WebSocket(wsUrl());
    wsStateEl.textContent = wsUrl();

    ws.onopen = () => {
      if (micReady) {
        setStatusKey(connectedStatusKey());
      } else if (window.isSecureContext) {
        setStatusKey(connectedStatusKey(true));
        showMicButton();
      } else {
        checkSecureContext();
      }
    };

    ws.onclose = () => {
      setStatusKey('statusDisconnected', {}, true);
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connectWs, 2000);
    };

    ws.onerror = () => {
      setStatusKey('statusWsError', {}, true);
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'result') {
          if (data.logOnly) {
            setStatusKey('statusTestReceived', {
              bytes: data.bytes,
              format: data.format,
            });
            return;
          }
          if (data.ok) {
            setStatusKey('statusSent', {
              label: agentLabel(data.agent),
              transcript: data.transcript || '',
            });
          } else {
            setStatusRaw(data.error || t('statusSendFailed'), true);
          }
        } else if (data.type === 'error') {
          setStatusRaw(data.error || t('statusServerError'), true);
        }
      } catch {
        setStatusKey('statusInvalidResponse', {}, true);
      }
    };
  }

  function pickMimeType() {
    if (typeof MediaRecorder === 'undefined') return '';
    return MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) || '';
  }

  function formatFromMime(mime) {
    if (!mime) return 'webm';
    if (mime.includes('webm')) return 'webm';
    if (mime.includes('mp4')) return 'mp4';
    if (mime.includes('ogg')) return 'ogg';
    return 'webm';
  }

  async function startRecording(agent, btn) {
    if (recording) return;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setStatusKey('statusNotConnected', {}, true);
      return;
    }
    const ok = await requestMic(true);
    if (!ok) return;

    const mimeType = pickMimeType();
    chunks = [];
    activeAgent = agent;
    activeBtn = btn;
    recording = true;
    btn.classList.add('recording');
    setStatusKey('statusRecording', { label: agentLabel(agent) });

    try {
      mediaRecorder = mimeType
        ? new MediaRecorder(mediaStream, { mimeType })
        : new MediaRecorder(mediaStream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.start(100);
    } catch (err) {
      recording = false;
      activeAgent = null;
      activeBtn = null;
      btn.classList.remove('recording');
      setStatusKey('statusRecordFailed', { message: err.message }, true);
    }
  }

  function stopRecording(btn) {
    if (!recording || !mediaRecorder) return;
    btn.classList.remove('recording');
    recording = false;

    const agent = activeAgent;
    const mimeType = mediaRecorder.mimeType || pickMimeType() || 'audio/webm';
    const format = formatFromMime(mimeType);

    mediaRecorder.onstop = async () => {
      activeAgent = null;
      activeBtn = null;
      if (!chunks.length) {
        setStatusKey('statusNoAudio', {}, true);
        return;
      }
      const blob = new Blob(chunks, { type: mimeType });
      chunks = [];
      setStatusKey('statusUploading', { size: (blob.size / 1024).toFixed(1) });

      try {
        const buffer = await blob.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        ws.send(
          JSON.stringify({
            type: 'voice-upload',
            agent,
            format,
            language: langSelect.value,
            audio: base64,
          })
        );
      } catch (err) {
        setStatusKey('statusUploadFailed', { message: err.message }, true);
      }
    };

    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function handleToggleClick(agent, btn) {
    if (recording && activeAgent === agent && activeBtn === btn) {
      stopRecording(btn);
      return;
    }
    if (recording && activeBtn) {
      stopRecording(activeBtn);
      return;
    }
    startRecording(agent, btn);
  }

  function bindTalkButton(btn) {
    const agent = btn.dataset.agent;

    btn.addEventListener(
      'touchstart',
      (e) => {
        if (getRecordMode() !== 'hold') return;
        touchActive = true;
        e.preventDefault();
        startRecording(agent, btn);
      },
      { passive: false }
    );

    btn.addEventListener(
      'touchend',
      (e) => {
        if (getRecordMode() !== 'hold') return;
        e.preventDefault();
        stopRecording(btn);
        setTimeout(() => {
          touchActive = false;
        }, 400);
      },
      { passive: false }
    );

    btn.addEventListener('touchcancel', () => {
      if (getRecordMode() === 'hold') stopRecording(btn);
    });

    btn.addEventListener('mousedown', (e) => {
      if (getRecordMode() !== 'hold') return;
      if (touchActive) return;
      e.preventDefault();
      startRecording(agent, btn);
    });

    btn.addEventListener('mouseup', () => {
      if (getRecordMode() !== 'hold') return;
      if (touchActive) return;
      stopRecording(btn);
    });

    btn.addEventListener('mouseleave', () => {
      if (getRecordMode() !== 'hold') return;
      if (recording && activeAgent === agent) stopRecording(btn);
    });

    btn.addEventListener('click', (e) => {
      if (getRecordMode() !== 'toggle') return;
      e.preventDefault();
      handleToggleClick(agent, btn);
    });

    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  langSelect.value = localStorage.getItem(LANG_KEY) || normalizeLang(navigator.language);
  langSelect.addEventListener('change', () => {
    localStorage.setItem(LANG_KEY, langSelect.value);
    applyUiLanguage();
  });

  recordModeSelect.value = localStorage.getItem(RECORD_MODE_KEY) || 'hold';
  recordModeSelect.addEventListener('change', () => {
    if (recording && activeBtn) {
      stopRecording(activeBtn);
    }
    localStorage.setItem(RECORD_MODE_KEY, recordModeSelect.value);
    applyUiLanguage();
  });

  btnEnableMic.addEventListener('click', () => requestMic(true));

  bindTalkButton(btnBroadcast);
  rebuildTalkButtons();

  applyUiLanguage();
  setStatusKey('statusConnecting');

  refreshShareUrl();
  refreshAgents();
  setInterval(refreshShareUrl, 8000);
  setInterval(refreshAgents, 8000);

  if (!checkSecureContext() && !isLocalhost()) {
    connectWs();
    return;
  }

  connectWs();
  if (window.isSecureContext) {
    showMicButton();
  }
})();
