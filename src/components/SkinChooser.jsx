import { useStore } from '../store';

const THEMES = [
  {
    id: 'classic',
    name: 'WMP Classic',
    swatches: ['#0997ff', '#d6dfe8', '#d8d0bc', '#b8c8d8', '#f0f0f0'],
    label: '#1a2a3a',
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    swatches: ['#1a1b2e', '#24283b', '#3d59a1', '#7aa2f7', '#1e2235'],
    label: '#7aa2f7',
  },
  {
    id: 'dracula',
    name: 'Dracula',
    swatches: ['#282a36', '#44475a', '#6272a4', '#bd93f9', '#50fa7b'],
    label: '#f8f8f2',
  },
  {
    id: 'monokai',
    name: 'Monokai',
    swatches: ['#272822', '#49483e', '#75715e', '#f92672', '#a6e22e'],
    label: '#f8f8f2',
  },
  {
    id: 'solarized',
    name: 'Solarized Dark',
    swatches: ['#002b36', '#073642', '#268bd2', '#2aa198', '#839496'],
    label: '#839496',
  },
];

export default function SkinChooser() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);

  const handleSelect = (id) => {
    setTheme(id);
  };

  return (
    <div className="wmp-skin-chooser">
      <div className="wmp-skin-chooser-title">CHOOSE A SKIN</div>
      <div className="wmp-skin-grid">
        {THEMES.map((t) => (
          <div
            key={t.id}
            className={`wmp-skin-card${theme === t.id ? ' active' : ''}`}
            onClick={() => handleSelect(t.id)}
          >
            <div className="wmp-skin-swatch">
              {t.swatches.map((color, i) => (
                <div
                  key={i}
                  className="wmp-skin-swatch-block"
                  style={{ background: color }}
                />
              ))}
            </div>
            <div
              className="wmp-skin-label"
              style={{
                background: t.swatches[0],
                color: t.label,
                borderTop: `1px solid ${t.swatches[2]}`,
              }}
            >
              {t.name}
              {theme === t.id && ' ✓'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
