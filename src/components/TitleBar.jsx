export default function TitleBar({ onDragStart, onMaximize, onMinimize, isMaximized }) {
  return (
    <div
      className="wmp-titlebar"
      onMouseDown={onDragStart}
      onDoubleClick={onMaximize}
    >
      <div className="wmp-titlebar-left">
        <svg className="wmp-icon" viewBox="0 0 16 16" width="16" height="16">
          <circle cx="8" cy="8" r="7" fill="#F47920" />
          <polygon points="6,4 13,8 6,12" fill="#fff" />
        </svg>
        <span className="wmp-titlebar-text">Windows Media Player</span>
      </div>
      <div className="wmp-titlebar-buttons">
        <button
          className="wmp-btn-min"
          aria-label="Minimize"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onMinimize}
        >
          <span>&#x2014;</span>
        </button>
        <button
          className="wmp-btn-max"
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onMaximize}
        >
          <span>{isMaximized ? '\u2750' : '\u25A1'}</span>
        </button>
        <button
          className="wmp-btn-close"
          aria-label="Close"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span>&#10005;</span>
        </button>
      </div>
    </div>
  );
}
