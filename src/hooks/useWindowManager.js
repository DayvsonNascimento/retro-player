import { useState, useRef, useCallback, useEffect } from 'react';

const DEFAULT_WIDTH = 780;
const DEFAULT_HEIGHT = 560;
const MIN_WIDTH = 500;
const MIN_HEIGHT = 360;
const WINDOW_STATE_KEY = 'wmp_window_state';

function getDefaultPosition(w, h) {
  return {
    x: Math.max(0, Math.round((window.innerWidth - w) / 2)),
    y: Math.max(0, Math.round((window.innerHeight - h) / 2)),
  };
}

function loadWindowState() {
  try {
    const raw = localStorage.getItem(WINDOW_STATE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (
      typeof s.x === 'number' && typeof s.y === 'number' &&
      typeof s.width === 'number' && typeof s.height === 'number' &&
      s.width >= MIN_WIDTH && s.height >= MIN_HEIGHT &&
      typeof s.isMaximized === 'boolean' && typeof s.isMinimized === 'boolean'
    ) {
      return s;
    }
  } catch (_) {}
  return null;
}

export function useWindowManager() {
  const [state, setState] = useState(() => {
    const saved = loadWindowState();
    if (saved) return saved;
    const pos = getDefaultPosition(DEFAULT_WIDTH, DEFAULT_HEIGHT);
    return {
      x: pos.x,
      y: pos.y,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      isMaximized: false,
      isMinimized: false,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(WINDOW_STATE_KEY, JSON.stringify(state));
    } catch (_) {}
  }, [state]);

  // Keep a ref in sync so event handlers can read current values synchronously
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  const savedStateRef = useRef(null);

  // ---- drag (title bar) ----
  const startDrag = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();

    const { isMaximized, x, y } = stateRef.current;
    if (isMaximized) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = x;
    const origY = y;

    const onMove = (me) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      setState((s) => ({
        ...s,
        x: Math.max(0, origX + dx),
        y: Math.max(0, origY + dy),
      }));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  // ---- resize ----
  const startResize = useCallback((e, direction) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const { x, y, width, height } = stateRef.current;
    const startX = e.clientX;
    const startY = e.clientY;

    const onMove = (me) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;

      setState((s) => {
        let newX = x;
        let newY = y;
        let newWidth = width;
        let newHeight = height;

        if (direction.includes('e')) newWidth = Math.max(MIN_WIDTH, width + dx);
        if (direction.includes('s')) newHeight = Math.max(MIN_HEIGHT, height + dy);
        if (direction.includes('w')) {
          newWidth = Math.max(MIN_WIDTH, width - dx);
          newX = x + (width - newWidth);
        }
        if (direction.includes('n')) {
          newHeight = Math.max(MIN_HEIGHT, height - dy);
          newY = y + (height - newHeight);
        }

        return { ...s, x: newX, y: newY, width: newWidth, height: newHeight };
      });
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  // ---- maximize / restore ----
  const toggleMaximize = useCallback(() => {
    setState((s) => {
      if (s.isMaximized) {
        const prev = savedStateRef.current || {
          x: getDefaultPosition(DEFAULT_WIDTH, DEFAULT_HEIGHT).x,
          y: getDefaultPosition(DEFAULT_WIDTH, DEFAULT_HEIGHT).y,
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT,
        };
        return { ...s, ...prev, isMaximized: false, isMinimized: false };
      } else {
        savedStateRef.current = { x: s.x, y: s.y, width: s.width, height: s.height };
        return {
          ...s,
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight,
          isMaximized: true,
          isMinimized: false,
        };
      }
    });
  }, []);

  // ---- minimize ----
  const toggleMinimize = useCallback(() => {
    setState((s) => {
      if (s.isMinimized) {
        return { ...s, isMinimized: false };
      } else {
        if (!s.isMaximized) {
          savedStateRef.current = { x: s.x, y: s.y, width: s.width, height: s.height };
        }
        return { ...s, isMinimized: true, isMaximized: false };
      }
    });
  }, []);

  // Keep maximize dimensions in sync with viewport resize
  useEffect(() => {
    const onResize = () => {
      setState((s) => {
        if (!s.isMaximized) return s;
        return { ...s, width: window.innerWidth, height: window.innerHeight };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return { state, startDrag, startResize, toggleMaximize, toggleMinimize };
}
